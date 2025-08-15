// src/app.js
import express from "express";

const app = express();

// Middleware
app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.send("API is working!");
});

export default app;
