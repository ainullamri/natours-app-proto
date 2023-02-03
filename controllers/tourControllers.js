const Tour = require("../models/tourModel");
const AppError = require("../utilities/appError");
const catchAsync = require("../utilities/catchAsync");
const factory = require("./handlerFactory");

// const APIFeature = require("../utilities/apiFeature");

// ID VALIDATION
// karena parameter mengandung val, maka fungsi
// di bawah ini hanya dapat digunakan untuk app.param()
// exports.checkID = (req, res, next, val) => {
//   console.log(val);
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: "fail",
//       message: `INVALID ID VALUE, (${req.params.id}) is not a valid id`,
//     });
//   }
//   next();
// };

// BODY VALIDATION
// SUDAH TIDAK TERPAKAI KARENA SUDAH ADA VALIDASI DI DALAM SCHEMA
// exports.checkBody = (req, res, next) => {
//   console.log("Kamu sempat lewat sini");
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: "fail",
//       message: `There are no ${
//         !req.body.name ? "name" : "price"
//       } property in the request body`,
//     });
//   }
//   next();
// };

// ALIASING API CALLS
// api/v1/tours/top-5-tours === api/v1/tours?limit=5&sort=-ratingsAverage,price
exports.alias = (req, res, next) => {
  // console.log(req.params); {amount : "from the router :amount"}
  req.query.limit = req.params.amount;
  req.query.sort = "-ratingsAverage,price";

  next();
};

// 2) ROUTE HANDLER
// AFTER REFACTOR
exports.getAllTour = factory.getAll(Tour);
exports.getTourById = factory.getOne(Tour, "reviews");
exports.updateTourData = factory.updateOne(Tour);
exports.deleteTourData = factory.deleteOne(Tour);

// Add new tour data
exports.createTourData = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: "success",
    result: `adding document to ${process.env.DATABASE_NAME} database`,
    data: { tour: newTour },
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    { $match: { duration: { $gte: 1 } } },
    {
      $group: {
        _id: "$difficulty",
        totalDoc: { $sum: 1 },
        avgRatings: { $avg: "$ratingsAverage" },
        avgQuantity: { $avg: "$ratingsQuantity" },
        avgPrice: { $avg: "$price" },
        maxPrice: { $max: "$price" },
        minPrice: { $min: "$price" },
      },
    },
    { $sort: { totalDoc: -1 } },
  ]);
  res.status(200).json({
    status: "success",
    data: { stats },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const { year } = req.params;
  const plan = await Tour.aggregate([
    {
      // unwind berfungsi untuk memecah document berdasarkan properti array
      $unwind: "$startDates",
    },
    {
      // menghasilkan query yang sesuai dengan ekspresi match
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      // mengelompokkan data/doc berdasarkan _id
      $group: {
        _id: { $month: "$startDates" },
        tourTotalInMonth: { $sum: 1 },
        toursName: { $push: "$name" },
      },
    },
    {
      // menambahkan properti pada hasil grouping
      $addFields: { month: "$_id" },
    },
    {
      // jika value 0 maka menyembunyikan properti dari hasil
      $project: { _id: 0 },
    },
    {
      // mengurutkan berdasarkan properti name. 1 (ascending), -1(descending)
      $sort: { month: 1 },
    },
    {
      $limit: 6,
    },
  ]);

  res.status(200).json({
    status: "success",
    result: plan.length,
    data: { plan },
  });
});

// /tours-within/400/center/34.1111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlong, unit } = req.params;
  const [lat, long] = latlong.split(",");

  // asumsi jika unit tidak ditulis maka satuan yg dipakai = km
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !long) {
    next(
      new AppError(
        "Please provide latitude and longitude in format lat,long.",
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[long, lat], radius] } },
    // [long, lat] titik tengah pencarian, radius jarak pencarian
  });

  res.status(200).json({
    status: "success",
    result: tours.length,
    data: { data: tours },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlong, unit } = req.params;
  const [lat, long] = latlong.split(",");

  const multiplier = unit === "mi" ? 0.000621371 : 0.001;

  if (!lat || !long) {
    next(
      new AppError(
        "Please provide latitude and longitude in format lat,long.",
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [long * 1, lat * 1],
        },
        distanceField: "distance",
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: { data: distances },
  });
});

////////////////////////////// REFERENCE //////////////////////////
// GET tour data
// exports.getAllTour = catchAsync(async (req, res, next) => {
//   const feature = new APIFeature(Tour.find(), req.query) // bisa Tour atau Tour.find()
//     .filter() // query.find() from req.query
//     .sort() // query.sort() from req.query
//     .limitFields() // query.select()  from req.query
//     .pagination(); // query.skip().limit()  from req.query

//   // EXECUTE QUERY
//   const tours = await feature.query; // await Promise.find()

//   // SEND RESPPONSE
//   res.status(200).json({
//     status: "success",
//     result: tours.length,
//     data: { tours },
//   });
// });

// GET tour data based on ID

// exports.getTourById = catchAsync(async (req, res, next) => {
//   // :id akan menjadi object parameter dari get request ==> {id : ...}
//   // req.params = { id : value}
//   // value bersifat string

//   // const id = req.params.id * 1;
//   // const tour = tours.filter((el) => el.id === id);

//   // console.log(req.params.id);
//   const tour = await Tour.findById(req.params.id).populate("reviews"); // return single object
//   if (!tour) {
//     return next(
//       new AppError(
//         `There are no data with the ID of ${req.params.id} in the database!`,
//         404
//       )
//     );
//   }
//   // Reformatting to JSend model
//   res.status(200).json({
//     status: "success",
//     data: { tour },
//   });
// });

// Add new tour data
// exports.createTourData = catchAsync(async (req, res, next) => {
// console.log(req.body.name);
// membuat id baru berdasarkan id dari object terakhir
// const newId = tours.at(-1).id + 1;
// // membuat object baru dengan menambahkan property id
// const newTour = { id: newId, ...req.body }; // Object.assign ({id: newId}, req.body)
// tours.push(newTour); // menambahkan tour baru ke dalam data tours
// fs.writeFile(
//   `${__dirname}/../dev-data/data/tours-simple.json`,
//   JSON.stringify(tours),
//   (err) => {
//     res.status(201).json({
//       status: "success",
//       result: `adding 1 data object to Tour data Arrays`,
//       data: { tour: newTour },
//     });
//   }
// );

// PATCH / UPDATE DATA

// exports.updateTourData = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true, // if true will return the new updated document
//     runValidators: true, // will run the validators again in the schema
//   });

//   if (!tour) {
//     return next(
//       new AppError(
//         `There are no data with the ID of ${req.params.id} in the database!`,
//         404
//       )
//     );
//   }

//   res.status(200).json({
//     status: "success",
//     data: { tour },
//   });
// });

// DELETE DATA/DOCUMENT

// exports.deleteTourData = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   // karena menghapus maka tidak perlu disimpan ke dalam variabel

//   if (!tour) {
//     return next(
//       new AppError(
//         `There are no data with the ID of ${req.params.id} in the database!`,
//         404
//       )
//     );
//   }

//   res.status(204).json({
//     status: "success",
//     data: null,
//   });
// });
