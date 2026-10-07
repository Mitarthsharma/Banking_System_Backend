const mongoose=require("mongoose")
const transactionSchema=new mongoose.Schema({
    type:{
        type:String,
        enum:["DEPOSIT","WITHDRAW","TRANSFER"],
        default:"TRANSFER",
        required:true
    },
    amount:{
        type:Number,
        required:true
    },
    fromAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    toAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account"
    },
    status:{
        type:String,
        enum:["PENDING","COMPLETED","FAILED"],
        default:"PENDING",
        required:true
    },reference:{
        type:String,
        required:true,
        unique:true
    }
},
{timestamps:true})

const transactionModel=mongoose.model("transaction",transactionSchema);
module.exports=transactionModel