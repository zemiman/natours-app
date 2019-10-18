//review//rating //createdAt //ref to tour //ref to user
const mongoose = require("mongoose");
const Tour=require('./tourModel')

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty!"]
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour!"]
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user!"]
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

//Populating users and tours using query midddleware:
reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: "tour",
  //   select: "name "
  // }).populate({
  //   path: "user",
  //   select: "name photo"
  // });
  this.populate({
    path: "user",
    select: "name photo"
  });
  next();
});

//Static function:
reviewSchema.statics.calcAverageRatings=async function(tourId){
  const stats=await this.aggregate([
    {
      $match:{tour:tourId}
    },
    {
      $group:{
        _id:'$tour',
        nRating:{$sum:1},
        avgRating:{$avg:'$rating'}
      }
    }
  ]);
  // console.log(stats);
  if(stats.length>0){
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  }else{
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
  
}

//Setting a compound index with unique option object to prevent from review duplication
reviewSchema.index({tour:1, user:1}, {unique:true});
reviewSchema.post('save', function(){
  //This points to the current review:
  this.constructor.calcAverageRatings(this.tour);
  
})

//findByIdAndUdate
//findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next){
  this.rev=await this.findOne();
  // console.log(this.rev);
  next();
})
reviewSchema.post(/^findOneAnd/, async function(){
  //await this.findOne():does not work here, the query has already executed.
  await this.rev.constructor.calcAverageRatings(this.rev.tour)
})

module.exports = Review = mongoose.model("Review", reviewSchema);
