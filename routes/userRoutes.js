const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const router = express.Router();
//the chained Route:

router.post("/signup", authController.signup);
router.post("/login", authController.login);
//Resetting password routes:
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
router.get("/confirmEmail/:token", authController.confirmEmail);


//All ROUTES BELOW REQUIRE AN AUTHENTICATION:protect all routes after this middleware
router.use(authController.protectData);
router.patch("/updateMyPassword", authController.updatePassword);
router.patch("/updateMe", userController.updateMe);
router.delete("/deleteMe", userController.deleteMe);
router.get("/me", userController.getMe, userController.getUser);

//Authorization:
router.use(authController.restirctTo('admin'))
router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);


module.exports = router;