const mongoose=require('mongoose')
const dotenv=require('dotenv')
dotenv.config({path:'./config.env'});
const app=require('./app');
//console.log(process.env);
//connect database:
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
app.listen(port, () => {
  console.log(`Server listening at port ${port}...`);
});
