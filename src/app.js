// src/app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());


// Test route
app.get("/test", (req, res) => {
    res.json({ message: "Server is working" });
});

import userRoutes from "./routes/user.routes.js";
app.use("/api/v1/users", userRoutes);


export default app;
