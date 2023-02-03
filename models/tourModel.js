// MEMBUAT SKEMA => struktur data, default value, validasi, dll

// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require("mongoose");
// eslint-disable-next-line import/no-extraneous-dependencies
const { default: slugify } = require("slugify");
// eslint-disable-next-line import/no-extraneous-dependencies
// const validator = require("validator");

// const User = require("./userModel");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true, // memotong ekstensi spasi di awal dan di akhir stirng
      maxlength: [40, "A tour name must have less or equal then 40 characters"],
      minlength: [10, "A tour name must have more or equal then 10 characters"],
      // validate: [validator.isAlpha, "Tour name must only contain characters"],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium, difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [0, "Rating must be above or equal to 0"],
      max: [5, "Rating must be below or equal to 5"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          // tidak bisa untuk patch atau update
          return val < this.price;
        },
        message: "Discount price ({VALUE}) should be below regular price",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a description"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // making createdAt property never get selected as query output
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual Property
tourSchema.virtual("durationInWeeks").get(function () {
  return (this.duration / 7).toFixed(2) * 1;
});

// Virtual Populate
tourSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "tour",
});

// INDEXES
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" });

// 1) DOCUMENT MIDDLEWARE:
// runs before (.pre) and after (.post) save or create event (.save(), .create())
// // MENGGANTI TEXT DESCRIPTION
// tourSchema.pre("save", function (next) {
//   this.description =
//     "THIS IS DESCRIPTION EXAMPLE : Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut eu dui in orci tempus euismod quis maximus sem. Aliquam at ornare erat. Curabitur ac tortor nibh. Integer at pulvinar odio. Fusce congue vestibulum mauris. Pellentesque a cursus elit. Aliquam mauris neque, hendrerit nec feugiat id, tincidunt vel mauris. Vivamus pharetra nisl non turpis ultrices, condimentum hendrerit nulla venenatis. Curabitur ac hendrerit enim. Mauris sodales nibh ipsum, quis tristique erat pulvinar ut. In bibendum massa a ex accumsan ultricies.";
//   next();
// });

// 1. a) menambahkan property nama yang telah di slug sebleum create
tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// 1. b) embedding document with id (properti: [id_1, id_2, id_3])
// tourSchema.pre("save", async function (next) {
//   const guidesPromises = this.guides.map(async (id) => User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// dalam post middleware sudah terdapat parameter doc (document yang telah tersimpan)
// tourSchema.post("save", (doc, next) => {
//   console.log(doc);
//   next();
// });

// 2) QUERY MIDDLEWARE
// 2. a) hasil query hanya untuk yg secretTour = false
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// 2. b) Populating referenced child when query-ing
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt",
  });

  next();
});

// 2. x). testing post middleware
// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start}`);
//   // console.log(docs);
//   next();
// });

// 3) AGGREGATION MIDDLEWARE
// menambahkan satu stage di awal pada setiap aggregasi
// tourSchema.pre("aggregate", function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

// MEMBUAT MODEL => menggunakan skema yang telah dibuat.
// membuat model memiliki berbagai property untuk melakukan CRUD ops dll

const Tour = mongoose.model("Tour", tourSchema);

// Membuat dokumen dan contoh mengoperasikan model

// const testTour = new Tour({
//   name: "Another Tour  ",
//   rating: 245,
//   price: 456,
// });

// testTour
//   .save()
//   .then((doc) => console.log(doc))
//   .catch((err) => console.log(err));

module.exports = Tour;
