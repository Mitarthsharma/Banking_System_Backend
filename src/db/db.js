const { default: mongoose } = require("mongoose");

// const mongoose=require("mongoose")
const dbConnect=async()=>{
    await mongoose.connect(process.env.MONGO_URL);
    console.log("db connected");
    
}
module.exports=dbConnect