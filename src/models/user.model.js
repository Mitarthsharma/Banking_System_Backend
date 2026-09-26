const mongoose=require("mongoose");
const bcrypt=require("bcrypt")
const userSchema=new mongoose.Schema({

username:{
    type:String,
    required:[true,"Username required"]
},email:{
    type:String,
    required:[true,"Email required"],
    unique:true,
    lowercase:true,
    trim:true,
    match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,"Invalid email"]
},
password:{
    type:String,
    minlength:[6,"Password's minimum length should be 6"],
    select:false,
    required:[true,"Password required"]
}

},{
    timestamps:true
}
)
userSchema.pre("save", async function() {

    if (!this.isModified("password")) {
        return;
    }

    const hash = await bcrypt.hash(this.password, 10);

    this.password = hash;
});

userSchema.methods.comparePassword=async function(password){
    return await bcrypt.compare(password,this.password)
}
const userModel=mongoose.model("user",userSchema);
module.exports=userModel