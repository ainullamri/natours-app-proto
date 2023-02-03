const Review = require("../models/reviewModel");
const catchAsync = require("../utilities/catchAsync");
const AppError = require("../utilities/appError");
const factory = require("./handlerFactory");

//AFTER REFACTOR
exports.getAllReview = factory.getAll(Review);
exports.getReviewByid = factory.getOne(Review);

// exports.getAllReview = catchAsync(async (req, res, next) => {
//   // jika ingin mendapatkan semua review dari spesifik tour
//   let filter;
//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: "success",
//     result: reviews.length,
//     data: { reviews },
//   });
// });

// DI BAWAH INI SENGAJA TIDAK DI REFACTOR

exports.createReview = catchAsync(async (req, res, next) => {
  const newReview = await Review.create({
    rating: req.body.rating,
    review: req.body.review,
    // mencegah user membuat review untuk akun lain dan tour lain
    tour: req.params.tourId,
    user: req.user.id,
  });

  res.status(201).json({
    status: "success",
    result: `Adding a review to ${process.env.DATABASE_NAME} database!`,
    data: { review: newReview },
  });
});

// FUNGSI UNTUK MEMBUAT REVIEW (AUTO IDENTITY FROM TOUR AND LOGIN USER)
// FUNGSI UNTUK MENGECEK YANG MENGEDIT ATAU MEN-DELETE ADALAH USER YANG SAMA DGN YG LOGIN
// fungsi untuk mengecek penulis dari review yang ingin di edit/hapus
exports.isAuthor = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (review.user.id !== req.user.id) {
    return next(new AppError(`This is not your review`, 403));
  }

  next();
});

exports.updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // if true will return the new updated document
    runValidators: true, // will run the validators again in the schema
  });

  if (!review) {
    return next(
      new AppError(
        `There are no document with the ID of ${req.params.id} in the database!`,
        404
      )
    );
  }

  res.status(200).json({
    status: "success",
    data: { review },
  });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findByIdAndDelete(req.params.id);

  if (!review) {
    return next(
      new AppError(
        `There are no document with the ID of ${req.params.id} in the database!`,
        404
      )
    );
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
