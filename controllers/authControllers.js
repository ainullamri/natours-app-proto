const crypto = require("crypto");
const { promisify } = require("util");
// eslint-disable-next-line import/no-extraneous-dependencies
const jwt = require("jsonwebtoken");

const AppError = require("../utilities/appError");
const catchAsync = require("../utilities/catchAsync");
const User = require("../models/userModel");
const sendEmail = require("../utilities/email");

// sign Token function
// eslint-disable-next-line arrow-body-style
const signToken = (idFromDB) => {
  return jwt.sign({ id: idFromDB }, process.env.JWT_SECRET_32CHAR, {
    expiresIn: process.env.JWT_EXPIRE_IN,
  });
};

// Refactoring send Token
const createSendToken = (user, statusCode, res) => {
  // logging user in via json web toke (JWT)
  const token = signToken(user.id);
  // SENDING TOKEN VIA COOKIE
  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // if in production mode. set option secure to true

  if (process.env.NODE_ENV.trim() === "production") cookieOption.secure = true;
  res.cookie("jwtToken", token, cookieOption);

  // mengirim token ke user akan menandakan user telah login
  // only AFTER SIGN UP
  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

// sign up for new User
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    // untuk mencegah user yang menulis di body memjadi admin
    // hanya menerima informasi yang dibutuhkan
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,

    // sehingga untuk membuat admin harus manual di database
  });
  createSendToken(newUser, 201, res);
  // // logging user in via json web toke (JWT)
  // const token = signToken(newUser.id);
  // // mengirim token ke user akan menandakan user telah login
  // // only AFTER SIGN UP
  // res.status(201).json({
  //   status: "success",
  //   token,
  //   data: { user: newUser },
  // });
});

// logging in user
exports.login = catchAsync(async (req, res, next) => {
  // 0) grabbing email and password from client input
  const { email: inputtedEmail, password: inputtedPassword } = req.body;

  // 1) Checking if there is an input of email and password from client
  if (!inputtedEmail || !inputtedPassword) {
    return next(new AppError("Please provide email or password!", 400)); // 400 = Bad Request
  }

  // 2) Checking if the inputted value exist (email match from a doc in DB)
  const user = await User.findOne({ email: inputtedEmail }).select("+password");
  // console.log(user);
  // need to iclude "+" in select because in the schema, pass select = false
  // agar property password bisa ikut
  if (
    !user ||
    !(await user.checkingPassword(inputtedPassword, user.password))
  ) {
    return next(new AppError("Incorrect email or password", 401)); // 401 = unauthorized
  }

  // 3) if everything okay, send token as logging pass
  createSendToken(user, 200, res);
  // const token = signToken(userMatch.id);
  // res.status(200).json({
  //   status: "success",
  //   token,
  // });
});

// Protecting routes to authorized user after login
// fungsi untuk -- harus login dlu
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token from (req header) and check if it's there, if available, get token
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer")
  ) {
    return next(
      new AppError("You are not log in, Please log in to get access!", 401)
    );
  }
  // console.log(req.headers);
  const token = req.headers.authorization.split(" ")[1];

  // 2) Verify the token
  // if token is not valid, rejecting the promise, proceed to error global handler
  const decodedJWT = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_32CHAR
  );

  // 3) Check if the user still exist
  // (bisa jadi token belum expire tp user telah di hpus dri DB)
  // if user has been deleted, proceed to global error handler
  const currentUser = await User.findById(decodedJWT.id);
  // console.log(currentUser);

  if (!currentUser) {
    return next(
      new AppError("The User with this token has no longer existed"),
      401
    );
  }

  // 4) Check if user changed passwaord after the token was issued
  if (currentUser.changedPasswordAt(decodedJWT.iat)) {
    return next(
      new AppError(
        "User recenlty changed password, please log in again to get access",
        401
      )
    );
  }

  // massukan property baru ke req object (berisi profil user yang login)
  // GRANT ACCESS TO PROTECTED ROUTE FOR THIS USER
  req.user = currentUser;
  next();
});

// Authorizing only admin access
// exports.onlyAdmin = (req, res, next) => {
//   const adminList = ["admin", "lead-guide"];
//   if (adminList.includes(req.user.role)) {
//     next();
//     // 403 === Forbidden
//   } else {
//     next(
//       new AppError("You don't have permission to perform this action!", 403)
//     );
//   }
// };

// Authorizing only admin access (Jonas Way on Video)
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have permission to perform this action!", 403)
      );
    }
    next();
  };

// Creating function to reset password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Grabbing user form POSTed request by email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    next(new AppError("There are no user with the specified email", 404));
  }

  // 2) Generate random token
  const resetToken = user.createPasswordResetToken(); // resetToken = hasil dari fungsi
  await user.save({ validateBeforeSave: false }); //menyimpan hasil dari update dari fungsi di atas ke DB

  // 3) Send to user email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Click on the link below to PATCH your new Password and Confirm Password. \n${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your Password Reset Token (Valid for 10 mins)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token has been sent to your email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false }); //menyimpan ke DB saat dihubungkn ke router

    return next(new AppError("Failed to send email, try again", 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, there is user set new password
  if (!user) {
    return next(new AppError("URL is invalid or has been expired", 400));
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); //menyimpan ke data base saat dihubungkan ke router
  // 3) update passwrodChangedAt on user property (check middleware)
  // 4) log in user, by sending new jwt token
  createSendToken(user, 200, res);
  // const token = signToken(user.id);
  // res.status(200).json({
  //   status: "success",
  //   token,
  // });
});

// Update password, or changing password
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if POSTed current password is correct
  const { currentPassword } = req.body;
  if (!(await user.checkingPassword(currentPassword, user.password))) {
    return next(new AppError("Your current password is incorrect", 401));
  }
  // 3) If correct, update password
  user.password = req.body.newPassword;
  user.confirmPassword = req.body.newPasswordConfirm;
  await user.save(); //menyimpan ke data base saat dihubungkan ke router

  // 4) log user in, send JWT
  createSendToken(user, 200, res);
  // const token = signToken(user.id);
  // res.status(200).json({
  //   status: "success",
  //   token,
  // });
});
