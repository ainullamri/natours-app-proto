/* eslint-disable import/no-extraneous-dependencies */
const express = require("express");
const morgan = require("morgan"); // 3rd Party Middleware
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const AppError = require("./utilities/appError");
const globalErrorHandler = require("./controllers/errorControllers");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");

const app = express();

// 1) MIDDLEWARE UNTUK ALL ROUTE

// SET SECURITY HTTP HEADERS
app.use(helmet());

// DEVELOPMENT LOGGING
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// BODY PARSER, AGAR DAPAT MEMBACA DATA DARI req.body
app.use(express.json({ limit: "10kb" }));

// DATA SANITIZATION AGAINST NO SQL INJECTION
app.use(mongoSanitize());

// DATA SANITIZATION AGAINST XSS ATTACK
app.use(xss());

// PREVENT PARAMETER POLLUTION
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

// middleware agar dapat megakses file static
// To serve static files such as images, CSS files, and JavaScript files, use the express.static built-in middleware function in Express.
app.use(express.static(`${__dirname}/public`)); // http://127.0.0.1:3000/overview.html

// 2) MIDDLEWARE UNTUK SPESIFIK ROUTE

// LIMIT REQUEST FROM SAME API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// ROUTE TO SPESIFIK DATA
app.use("/api/v1/tours", tourRouter); // akan terhubung ke folder routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

// Jika router tidak terdefinisi
app.all("*", (req, res, next) => {
  // res.status(404).json({
  //   status: "fail",
  //   message: `FAILED : Could not find ${req.originalUrl} in this server!`,
  // });

  next(
    new AppError(
      `FAILED : Could not find ${req.originalUrl} in this server!`,
      404
    )
  );
});

app.use(globalErrorHandler);

// 4) START SERVER
// pindah ke server.js
// harus mengexport app terlebih dahulu

module.exports = app;

// membuat middleware sendiri
// contoh ingin mengetahui waktu get request
// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   // console.log(req.requestTime); // 2023-01-21T22:13:26.883Z
//   // console.log("pasti lewat sini");
//   next();
// });
