const mongoose=require('mongoose')
const dotenv=require('dotenv')
dotenv.config({path:'./config.env'});

//console.log(process.env);
//connect database:
process.on("uncaughtException", err => {
  console.log(err.name, err.message);
  console.log("UNCAUGHT EXCEPTION");
  process.exit(1);
  // server.close(() => {
  // });
});
const app = require("./app");
const db=process.env.LOCAL_DB;
mongoose.connect(db, {
  useNewUrlParser:true,
  useCreateIndex:true,
  useFindAndModify:false, 
  useUnifiedTopology:true
}).then(()=>{
  //console.log(con.connections);
  console.log('DB connection successful!');
});

const port = process.env.PORT || 5000;
const server=app.listen(port, () => {
  console.log(`Server listening at port ${port}...`);
});

process.on('unhandledRejection', err=>{
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION');
  server.close(()=>{
    process.exit(1);

  })
})

