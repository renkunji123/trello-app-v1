import express from "express";
const app = express();
const port = 3002;
app.listen(port, () => { 
console.log("Máy chủ đang chạy trên cổng 3002"); 
});