const express = require("express");

const userControllers = require("../controllers/userControllers");
const authControllers = require("../controllers/authControllers");

const router = express.Router();

// ROUTE TO SIGNUP/LOGIN
router.post("/signup", authControllers.signup);
router.post("/login", authControllers.login);

// ROUTE TO FORGOT/RESET PASSWORD
router.post("/forgotPassword", authControllers.forgotPassword);
router.patch("/resetPassword/:token", authControllers.resetPassword);

// SEMUA ROUTER SETALAH INI HARUS LOGIN
router.use(authControllers.protect);

// ROUTE TO UPDATEPASSWORD
router.route("/updatePassword").patch(authControllers.updatePassword);
// ROUTE TO UPDATE PROFIL / UPDATE ME && DELETE ME / DEACTIVATE ME
router.route("/updateProfile").patch(userControllers.updateMe);
router.route("/deleteProfile").delete(userControllers.deleteMe);
// ROUTE TO SHOW MY PROFILE
router.route("/me").get(userControllers.getMe, userControllers.getUserById);

// ROUTE TO MANAGE ALL USER DATA BY ADMIN ONLY
// SEMUA ROUTER SETALAH INI HARUS ADMIN
router.use(authControllers.restrictTo("admin"));

router.route("/").get(userControllers.getAllUser);
router
  .route("/:id")
  .get(userControllers.getUserById)
  .patch(userControllers.updateUserData)
  .delete(userControllers.deleteUserData);

module.exports = router;
