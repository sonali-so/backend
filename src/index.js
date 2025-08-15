//require('dotenv').config({path:'./env'})       can be or
/*import dotenv from 'dotenv'
import connectDB from './db/index.js';

dotenv.config({
    path:"./env"
});

import connectDB from"./db";


connectDB()*/
// src/index.js

// Fix for MaxListenersExceededWarning
import { EventEmitter } from "events";
EventEmitter.defaultMaxListeners = 20;


import dotenv from "dotenv";
import connectDB from "./db/index.js"; // your MongoDB helper
import app from "./app.js"; // your Express app

dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 5000;

// connect to MongoDB and start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed", err);
  });


























/*
approach 1 bring all the code to index file import from index file but bit cozy


import express from "express";
const app=express()

(async () => {
    try
    {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.error("Express error:", error);
            throw error;
        })
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    } 
    catch(error)
    {
        console.error("Error connecting to MongoDB:", error)
        throw error;
    }
})()*/
