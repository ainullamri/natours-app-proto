/* eslint-disable prefer-arrow-callback */
const mongoose = require("mongoose");
const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty"],
    },
    rating: {
      type: Number,
      min: [1, "Rating must be above or equal to 1.0"],
      max: [5, "Rating must be below or equal to 5.0"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// // mengganti text review
// reviewSchema.pre("save", function (next) {
//   this.review = "This is a review example, not a real review comment!";
//   next();
// });

// QUERY MIDDLEWARE
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    // tidak perlu mengaktifkan populate tour
    path: "user", // "tour user", // for multiple path just use space
    select: "name photo",
  });

  next();
});

// menghitung rata-rata average dan kuantiti
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    // this = Review Model
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]); // return as array [{hasil group}]

  // setiap setalah mnghitung rata-rata, update tour yg mendapat review
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating.toFixed(2),
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 0,
    });
  }
};

// setiap ada review yang di tulis, update rating dari tour yg di review
reviewSchema.post("save", function (doc) {
  doc.constructor.calcAverageRatings(doc.tour); // this.tour => id dari tour yang di review
});

// setiap ada review yang di update/delete, update rating dari tour yg di review
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.tour);
  }
});

// INDEXES
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
