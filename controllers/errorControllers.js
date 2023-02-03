const AppError = require("../utilities/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400); // 400 ==> Bad Request
};

const handleDuplicateErrorDB = (err) => {
  const message = `${Object.values(err.keyValue)[0]} is already exist!`;
  // Object.values(err.keyValue)[0] ==> return value error yang terduplikat
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const message = `${err.message}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError("Invalid token, Please log in again", 401);

const handleJWTExpiredError = () =>
  new AppError("Token has been expired! Please log in again", 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // OPERATIONAL, Trusted error : send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // PROGRAMMING or OTHER UNKNOWN error : don't leak error details
  } else {
    // 1. log error
    console.error(`ERROR 💥: ${err}`);

    // 2. Send genetic error message
    res.status(500).json({
      status: "error",
      message: "Something went wrong !!!(not a operational error)",
    });
  }
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    // Error For Invalid ID
    // if (err.name === "CastError") err = handleCastErrorDB(err);
    sendErrorDev(err, res);

    // this is NOT WORK
  } else if (process.env.NODE_ENV.trim() === "production") {
    // console.log(err);
    let error = Object.create(err);

    // Error For Invalid ID
    if (error.name === "CastError") error = handleCastErrorDB(error);

    // Error for Invalid Name (Duplicate name)
    if (error.code === 11000) error = handleDuplicateErrorDB(error);

    // Error for not fullfilling the validator in the schema
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);

    // Error if JSonWebToken is invalid
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }

  next();
};
