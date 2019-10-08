const express = require("express");
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");
const router = express.Router();
//Param middleware:
//router.param('id', tourController.checkID);
router.route("/tour-stats").get(tourController.getTourStats);
router.route("/monthly-plan/:year").get(tourController.getMonthlyPlan);
router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);
router
  .route("/")
  .get(authController.protectData, tourController.getAllTours)
  .post(tourController.createTour);
router
  .route("/:id")
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protectData,
    authController.restirctTo("admin", "lead-guide"),
    tourController.deleteTour
  );

module.exports = router;
