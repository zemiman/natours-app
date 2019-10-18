const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");

const filterObj = (obj, ...allowedfields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedfields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //1)Create error if user posted password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password update. pls use /updateMyPassword",
        400
      )
    );
  }
  //2)Filtered out unwanted fields names that are not allowed to update:
  const filteredBody = filterObj(req.body, "name", "email");
  //3)update user document:
  const updateUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true
  });
  //await user.save();
  return res.status(200).json({
    status: "success",
    user: updateUser
  });
});
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  return res.status(204).json({
    status: "success",
    data: null
  });
});
exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not defined! pls use /signup instead!"
  });
};
exports.getMe=(req, res, next)=>{
  req.params.id=req.user._id;
  next();
}

//User handled by the handler factor function:
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User)
//Do not update password with this:
exports.updateUser = factory.updateOne(User)
exports.deleteUser =  factory.deleteOne(User)
