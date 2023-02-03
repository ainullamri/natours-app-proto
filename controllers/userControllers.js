const User = require("../models/userModel");
const catchAsync = require("../utilities/catchAsync");
const AppError = require("../utilities/appError");
const factory = require("./handlerFactory");
// const ApiFeature = require("../utilities/apiFeature");

// ONLY ADMIN CONTROL
exports.getAllUser = factory.getAll(User);
exports.getUserById = factory.getOne(User);
exports.updateUserData = factory.updateOne(User);
exports.deleteUserData = factory.deleteOne(User);

// UNTUK /me
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// fungsi untuk filter object (DIGUNAKAN UNTUK MEMILAH DATA YANG BOLEH DI UPDATE DI PROFIL)
const filterObj = (objBeforeFilter, ...allowedFields) => {
  const objAfterFilter = {};
  Object.keys(objBeforeFilter).forEach((el) => {
    if (allowedFields.includes(el)) objAfterFilter[el] = objBeforeFilter[el];
  });

  return objAfterFilter;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs possword data
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppError(
        "This route id no for password update. use /updatePassword route",
        400
      )
    );
  }
  // 2) filter data from req.body that can be updated (yg bisa di update cuma yg ini)
  const filteredBody = filterObj(req.body, "name", "email");
  // updating user with filtered body
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: { user: updatedUser },
  });
});

// delete me / delete my profile
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {
    activeState: false,
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

///////////////////// REFERENCE

// exports.getAllUser = catchAsync(async (req, res, next) => {
//   const feature = new ApiFeature(User, req.query) // bisa Tour atau Tour.find()
//     .filter() // query.find() from req.query
//     .sort() // query.sort() from req.query
//     .limitFields() // query.select()  from req.query
//     .pagination(); // query.skip().limit()  from req.query

//   const users = await feature.query;

//   res.status(200).json({
//     status: "success",
//     data: { users },
//   });
// });
