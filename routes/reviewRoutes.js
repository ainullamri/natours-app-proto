/* eslint-disable prettier/prettier */
const express = require("express");
const reviewControllers = require("../controllers/reviewControllers");
const authControllers = require("../controllers/authControllers");

const router = express.Router({ mergeParams: true });

// POST /tour/342342/reviews
// GET /tour/342342/reviews
router.use(authControllers.protect);

router
  .route("/")
  .get(reviewControllers.getAllReview)
  .post(authControllers.restrictTo("user"), reviewControllers.createReview);

router
  .route("/:id")
  .get(reviewControllers.getReviewByid)
  .patch(
    authControllers.restrictTo("user", "admin"),
    reviewControllers.isAuthor,
    reviewControllers.updateReview
  )
  .delete(
    authControllers.restrictTo("user", "admin"),
    reviewControllers.isAuthor,
    reviewControllers.deleteReview
  );

module.exports = router;
