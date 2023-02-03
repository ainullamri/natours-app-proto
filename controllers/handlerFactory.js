const catchAsync = require("../utilities/catchAsync");
const AppError = require("../utilities/appError");
const APIFeature = require("../utilities/apiFeature");

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // jika ingin mendapatkan semua review dari spesifik tour
    // GET nested review on tour api
    let filter;
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const feature = new APIFeature(Model.find(filter), req.query) // bisa Tour atau Tour.find()
      .filter() // query.find() from req.query
      .sort() // query.sort() from req.query
      .limitFields() // query.select()  from req.query
      .pagination(); // query.skip().limit()  from req.query

    // EXECUTE QUERY
    const docs = await feature.query; // await Promise.find()

    // SEND RESPPONSE
    res.status(200).json({
      status: "success",
      result: docs.length,
      data: { data: docs },
    });
  });

exports.getOne = (Model, populateOption) =>
  catchAsync(async (req, res, next) => {
    // :id akan menjadi object parameter dari get request ==> {id : ...}
    // req.params = { id : value}
    // value bersifat string

    // const id = req.params.id * 1;
    // const tour = tours.filter((el) => el.id === id);

    // console.log(req.params.id);
    let query = Model.findById(req.params.id);
    if (populateOption) query = query.populate(populateOption);
    const doc = await query; // return single object

    if (!doc) {
      return next(
        new AppError(
          `There are no data with the ID of ${req.params.id} in the database!`,
          404
        )
      );
    }
    // Reformatting to JSend model
    res.status(200).json({
      status: "success",
      data: { data: doc },
    });
  });

// cuma untuk update user dan tour BY ADMIN (tidak untuk update review)
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // if true will return the new updated document
      runValidators: true, // will run the validators again in the schema
    });

    if (!doc) {
      return next(
        new AppError(
          `There are no document with the ID of ${req.params.id} in the database!`,
          404
        )
      );
    }

    if (doc.user.id !== req.user.id) {
      return next(new AppError(`jangko rubah/hapus reviewna orang sotta`, 403));
    }

    res.status(200).json({
      status: "success",
      data: { data: doc },
    });
  });

// cuma untuk delete user dan tour BY ADMIN (tidak untuk delete review)
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    // karena menghapus maka tidak perlu disimpan ke dalam variabel

    if (!doc) {
      return next(
        new AppError(
          `There are no data/document with the ID of ${req.params.id} in the database!`,
          404
        )
      );
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });
