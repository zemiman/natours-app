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
//Updating password after logged in:
router.patch(
  "/updateMyPassword",
  authController.protectData,
  authController.updatePassword
);
//Update your data after logged in:
router.patch("/updateMe", authController.protectData, userController.updateMe);
router.delete("/deleteMe", authController.protectData, userController.deleteMe);

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
