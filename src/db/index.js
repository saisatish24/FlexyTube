import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
  // async means that the function will return a Promise, and we can use await inside it to wait for asynchronous operations to complete.
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    ); //It's asynchronous because mongoose.connect() returns a Promise.
    //    Connects to MongoDB.
    //    await pauses execution until the connection is established.
    //    process.env.MONGODB_URI reads the MongoDB connection string from your .env file.
    console.log(
      `\n MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection error ", error);
    process.exit(1);
  }
};

export default connectDB;
