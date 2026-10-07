const userModel=require("../models/user.model")
const jwt=require("jsonwebtoken")
const emailService=require("../services/email.service")
const bcrypt=require("bcrypt")
async function createUser(req, res) {

    const { username, email, password } = req.body;


    const isExist = await userModel.findOne({
        email: email
    });

 

    if (isExist) {
        return res.status(402).json({
            message: "email already exists"
        });
    }


    const user = await userModel.create({
        username,
        email,
        password
    });



    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET
    );

    

    res.cookie("jwt_token", token);

    res.status(201).json({
        message: "User created successfully",
        name: user.username,
        email: user.email
    }

);
await emailService.sendRegistrationEmail(user.email,user.username)

    console.log("7. Response sent");
}
async function loginUser(req, res) {

    const { email, password } = req.body;

    const user = await userModel
        .findOne({ email: email })
        .select("+password");

    if (!user) {
        return res.status(402).json({
            message: "Email not registered"
        });
    }

    const isPasswordCorrect = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordCorrect) {
        return res.status(402).json({
            message: "Incorrect password"
        });
    }

    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET
    );

    res.cookie("jwt_token", token);

    return res.status(200).json({
        message: "User logged in successfully"
    });
}
module.exports={createUser,loginUser}