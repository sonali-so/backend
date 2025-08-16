// src/app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN ,
    Credentials:true
}));
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public")); // Serve static files from the "public" directory 
app.use(cookieParser());


// Basic route
app.get("/", (req, res) => {
  res.send("API is working!");
});

export default app;
