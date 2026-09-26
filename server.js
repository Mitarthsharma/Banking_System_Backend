const dns = require("dns");

// Force Node.js to use Google DNS instead of localhost (127.0.0.1)
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();
const app=require("./src/app");
app.listen("3000",(req,res)=>{
    console.log("Server is running at port 3000");
    
})