const express = require("express");
const morgan = require("morgan");
const app = express();
//Different files include:
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const AppError=require('./utils/appError');
const globalErrorHandler=require('./controllers/errorController');
//Middlewares
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(express.json());
app.use(express.static(`${__dirname}/public`));
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});
//Routes:
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

app.all("*", (req, res, next) => {
  // const err=new Error(`Can not find ${req.originalUrl} on this server`);
  // err.status='fail';
  // err.statusCode=404;
  //console.log('This is error handler middleware ')
  next(new AppError(`Can not find ${req.originalUrl} on this server`, 404));
});

//Error handler middleware:
app.use(globalErrorHandler);

module.exports = app;
