const express=require("express");
const app=express();
const dbConnect=require("../src/db/db")
const authRouter=require("../src/routes/auth.routes")
const cookieParser=require("cookie-parser")
dbConnect()
app.use(express.json());
app.use(cookieParser())
app.use("/auth",authRouter)

module.exports=app;