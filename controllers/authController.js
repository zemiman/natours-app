const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  //Send token into cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);
  //Remove password from the output:
  user.password = undefined;
  return res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user
    }
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  const resetToken = newUser.createPassworResetToken();
  await newUser.save({
    validateBeforeSave: false
  });

  //Send the token to user's email:
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/confimEmail/${resetToken}`;
  const message = `Click here: ${resetURL}. To confirm your email!`;
  try {
    await sendEmail({
      email: newUser.email,
      subject: "Your password reset token (Valid for 10 min)",
      message
    });
    createSendToken(newUser, 201, res);
  } catch (err) {
    //console.error(err)
    newUser.passwordResetToken = undefined;
    newUser.passwordResetExpires = undefined;
    await newUser.save({ validateBeforeSave: false });
    return next(
      new AppError("There was an error sending the email! Try again later", 500)
    );
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1)Check if email and password exists
  if (!email || !password) {
    return next(new AppError("please provide email or password!", 400));
  }
  //2)Check if user exist and password is correct:
  const user = await User.findOne({ email }).select("+password -__v");
  if (!user) {
    return next(new AppError("Invalid Credentials!", 401));
  }
  const ismatched = await user.correctPassword(password, user.password);
  if (!ismatched) {
    return next(new AppError("Invalid Credentials!", 401));
  }
  //3)If everything is ok, send token to client:
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  })
  return res.status(200).json({
    status: 'success'
  })
}

//A protecting function for every source:
exports.protectData = catchAsync(async (req, res, next) => {
  //1)Getting token and if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
    //console.log(token);
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError("You are not logged in! please log in to access.", 401)
    );
  }
  //2) Verification for the given token:
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //3)Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist!",
        401
      )
    );
  }
  //4) Check if user changed his password after the token was issued:
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! please log in again.", 401)
    );
  }
  //Grant access to protected routes:
  req.user = currentUser;
  res.locals.user = currentUser;
  //console.log(req.user);
  next();
});

//Only for rendered pages, no errors: 
exports.isLoggedIn = async (req, res, next) => {
  //1)Checking if there is token in cookies
  try {
    if (req.cookies.jwt) {
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
      //3)Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //4) Check if user changed his password after the token was issued:
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      //THERE IS A LOGGED IN USER:
      res.locals.user = currentUser;
      // req.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  //console.log(req.user);
  next();
};

//I used a wrapper function with rest parameters to get the arguments from:
exports.restirctTo = (...roles) => {
  return (req, res, next) => {
    //Roles is array ['admin', 'lead-guide']:
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have a permision to perform this action", 403)
      );
    }
    next();
  };
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //Get user based on posted email:
  //console.log(req.body.email);
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with that email address!", 404));
  }
  //Generate the random reset token:
  const resetToken = user.createPassworResetToken();
  await user.save({ validateBeforeSave: false });
  //Send the token to user's email:
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and 
  confirm password to: ${resetURL}.\nif you did not forgot your password! please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (Valid for 10 min)",
      message
    });
    return res.status(200).json({
      status: "success",
      message: "Token sent to email!"
    });
  } catch (err) {
    //console.error(err)
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError("There was an error sending the email! Try again later", 500)
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1)Get user based on token:
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  //2)if reset token has not expired, and there is user, set the new password and confirm password:
  if (!user) {
    return next(new AppError("Token is invalid or has expired!", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3)Update the changedPasswordAt property for the user:
  //4)Log the user in and send or create jwt:
  createSendToken(user, 200, res);
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)Get user from collection:
  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    return next(new AppError("Invalid Credentials!", 401));
  }
  //2)Check if posted curret password is correct:
  const isMatched = await user.correctPassword(
    req.body.currentPassword,
    user.password
  );
  if (!isMatched) {
    return next(
      new AppError("Your current password is incorrect. pls try again!", 401)
    );
  }
  //3)if so, update password:
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //User.findByIdAndUpdate: will not work as intended
  //4)Log user in, create and send jwt:
  createSendToken(user, 200, res);
});
exports.confirmEmail = catchAsync(async (req, res, next) => {
  //1)Encrypt the token from params:
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  //2)Find user with that token in given expires date:
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  //3)If reset token has not expired, set activation to true then PRT&PRE to undefine:
  user.activation = true;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save({ validateBeforeSave: false });
  return res.status(201).json({
    status: 'success',
    message: 'You have confirmed your email correctly!'
  });
});
