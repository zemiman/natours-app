const Tour = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");

// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is : ${val}`);
//   if (req.params.id * 1 >= tours.length) {
//     return res.status(404).json({
//       status: "fail",
//       message: "Invalid ID"
//     });
//   }
//   next();
// };
//params or query string middleware:
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // try {
//   //console.log(req.query);
//   //BUILDING QUERY
//   //1A)Filtering:
//   // const queryObj = { ...req.query };
//   // const excludedFields = ["page", "limit", "sort", "fields"];
//   // excludedFields.forEach(el => delete queryObj[el]);
//   // //1B)Advanced filtering:
//   // let queryStr = JSON.stringify(queryObj);
//   // //replace gte, gt, lte, lt with $gte, $gt...
//   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

//   // let query = Tour.find(JSON.parse(queryStr));
//   //2) Sorting:
//   // if (req.query.sort) {
//   //   const sortBy = req.query.sort.split(",").join(" ");
//   //   query = query.sort(sortBy);
//   // } else {
//   //   query = query.sort("-createdAt");
//   // }

//   //3) Field Limiting:
//   // if (req.query.fields) {
//   //   const fields = req.query.fields.split(",").join(" ");
//   //   query = query.select(fields);
//   // } else {
//   //   query = query.select("-__v");
//   // }

//   //4)Pagination:
//   // const page = req.query.page * 1 || 1;
//   // const limit = req.query.limit * 1 || 100;
//   // const skip = (page - 1) * limit;
//   // //page=3&limit=10:1-10 page-1, 11-20 page-2, 21-30 page-3
//   // query = query.skip(skip).limit(limit);
//   // if (req.query.page) {
//   //   const numTours = await Tour.countDocuments();
//   //   if (skip >= numTours) throw new Error("This page does not exist!");
//   // }

//   //EXECUTE QUERY:
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;
//   //query.sort().select().skip().limit();

//   return res.status(200).json({
//     status: "success",
//     results: tours.length,
//     data: {
//       tours
//     }
//   });
//   // } catch (err) {
//   //   return res.status(404).json({
//   //     status: "fail",
//   //     message: err
//   //   });
//   // }
// });
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, {
  path: "reviews",
  select: "-__v -createdAt"
});
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

//Aggregate Data:
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: {
          $gte: 4.5
        }
      }
    },
    {
      $group: {
        _id: {
          $toUpper: "$difficulty"
        },
        numTours: {
          $sum: 1
        },
        numRatings: {
          $sum: "$ratingsQuantity"
        },
        avgRating: {
          $avg: "$ratingsAverage"
        },
        avgPrice: {
          $avg: "$price"
        },
        minPrice: {
          $min: "$price"
        },
        maxPrice: {
          $max: "$price"
        }
      }
    },
    {
      $sort: {
        avgPrice: 1
      }
    }
    // {
    //   $match: { _id: { $ne: "EASY" } }
    // }
  ]);
  return res.status(200).json({
    status: "success",
    data: {
      stats
    }
  });
});
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates"
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: {
          $month: "$startDates"
        },
        numTourStarts: {
          $sum: 1
        },
        tours: {
          $push: "$name"
        }
      }
    },
    {
      $addFields: {
        month: "$_id"
      }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: {
        numTourStarts: -1
      }
    },
    {
      $limit: 12
    }
  ]);
  return res.status(200).json({
    status: "success",
    data: {
      plan
    }
  });
});

// "/tours-within/:distance/center/:latlng/unit/:unit"
// /tours-within/400/center/34.111745, -118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  //calculate the radius: dividing the distance by earth radius:
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    return next(
      new AppError(
        "please provide latitude and longitude in the format lat, lng",
        400
      )
    );
  }
  // console.log(distance, lat, lng, unit);
  console.log(radius);
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius]
      }
    }
  });
  return res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    return next(
      new AppError(
        "please provide latitude and longitude in the format lat, lng",
        400
      )
    );
  }
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: "distance",
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1,
        _id: 0
      }
    }
  ]);
  // console.log(distances);
  return res.status(200).json({
    status: "success",
    data: {
      data: distances
    }
  });
});
