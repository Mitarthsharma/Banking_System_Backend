const express=require("express");
const app=express();
const dbConnect=require("../src/db/db")
const cookieParser=require("cookie-parser")

const authRouter=require("../src/routes/auth.routes")
const accountRouter=require("../src/routes/account.routes")

dbConnect()
app.use(express.json());
app.use(cookieParser())
app.use("/auth",authRouter)
app.use("/account",accountRouter)

module.exports=app;