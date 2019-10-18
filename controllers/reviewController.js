const Review = require("../models/reviewModel");
const factory = require("./handlerFactory");
// const catchAsync = require("../utils/catchAsync");

exports.setTourUserIds = (req, res, next) => {
  //Allow Nested Route
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };
//   const reviews = await Review.find(filter);
//   return res.status(200).json({
//     status: "success",
//     results: reviews.length,
//     data: {
//       reviews
//     }
//   });
// });
