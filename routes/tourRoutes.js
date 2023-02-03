/* eslint-disable prettier/prettier */
const express = require("express");
const tourControllers = require("../controllers/tourControllers");
const authControllers = require("../controllers/authControllers");
const reviewRouter = require("./reviewRoutes");

const router = express.Router();

// membuat /tour/asdasd/reviews menjadi root route di reviewRouter.js
router.use("/:tourId/reviews", reviewRouter);

// router.param("id", tourControllers.checkID);
router
  .route("/top-:amount-tours")
  .get(tourControllers.alias, tourControllers.getAllTour);

router.route("/tour-stats").get(tourControllers.getTourStats);

// route untuk mencari tour di radius :distance (:unit) dari titik :latlong
router
  .route("/tours-within/:distance/center/:latlong/unit/:unit")
  .get(tourControllers.getToursWithin);

// router untuk menghitung jarak dari titik ke semua tour
router
  .route("/distance-to-all/:latlong/unit/:unit")
  .get(tourControllers.getDistances);

router
  .route("/tour-monthly-plan/:year")
  .get(
    authControllers.protect,
    authControllers.restrictTo("admin", "lead-guide", "guide"),
    tourControllers.getMonthlyPlan
  );

router
  .route("/")
  .get(tourControllers.getAllTour) // GET REQUEST akan di ekspos ke publik, tidak perlu login
  .post(
    authControllers.protect,
    authControllers.restrictTo("admin", "lead-guide"),
    tourControllers.createTourData
  );

router
  .route("/:id")
  .get(tourControllers.getTourById) // GET REQUEST akan di ekspos ke publik
  .patch(
    authControllers.protect,
    authControllers.restrictTo("admin", "lead-guide"),
    tourControllers.updateTourData
  )
  .delete(
    authControllers.protect,
    authControllers.restrictTo("admin", "lead-guide"),
    tourControllers.deleteTourData
  );

module.exports = router;
// module.export digunakan bila hanya ingin mengexport 1 fie
