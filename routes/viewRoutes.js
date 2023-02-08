const express = require("express");
const viewController = require("../controllers/viewControllers");

const router = express.Router();

router.get("/", viewController.getOverview);
router.get("/tour/:slug", viewController.getTour);
// router.route("/tours/").get(viewController.getTour);

module.exports = router;
