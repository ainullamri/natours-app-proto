const Tour = require("../models/tourModel");
const catchAsync = require("../utilities/catchAsync");

// res.status(200).render("overview",
// di atas berarti akan merender "overview.pug" yg ada di folder views-pug
// yang telah di set di awal app.js ==> app.set("views", path.join(__dirname, "views-pug"));

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1). Get tour data from collection by calling the tour model
  const tours = await Tour.find();

  // 2). build the template
  // 3). render the template using tour data from 1).
  res.status(200).render("overview", {
    title: "All Tours",
    tours: tours,
  });
});

exports.getTour = (req, res) => {
  res.status(200).render("tour", {
    title: "The Forest Hiker",
  });
};
