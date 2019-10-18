const express = require("express");
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");
const reviewRouter = require("./reviewRoutes");
// const reviewController = require("../controllers/reviewController");
const router = express.Router();
//Param middleware:
//router.param('id', tourController.checkID);
//NESTED ROUTE:
//POST /tour/235363/reviews
//GET /tour/235363/reviews
//GET /tour/235363/reviews/2354279
// router
//   .route("/:tourId/reviews")
//   .post(
//     authController.protectData,
//     authController.restirctTo("user"),
//     reviewController.createReview
//   );
router.use("/:tourId/reviews", reviewRouter);

router.route("/tour-stats").get(tourController.getTourStats);
router
  .route("/monthly-plan/:year")
  .get(
    authController.protectData,
    authController.restirctTo("admin", "lead-guide", "guide"),
    tourController.getMonthlyPlan
  );

router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,24&unit=m
// /tours-within/233/center/-40,24/unit/m
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances)
router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);
router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protectData,
    authController.restirctTo("admin", "lead-guide"),
    tourController.createTour
  );
router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protectData,
    authController.restirctTo("admin", "lead-guide"),
    tourController.updateTour
  )
  .delete(
    authController.protectData,
    authController.restirctTo("admin", "lead-guide"),
    tourController.deleteTour
  );

module.exports = router;
