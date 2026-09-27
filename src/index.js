import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  // dotenv is available when npm run dev is executed.
  path: "./.env",
});



// connectDB() function is called which is initialised in src/db/index.js 
connectDB() // returns a Promise , so we can use .then() to handle the resolved value or .catch() to handle any errors that occur during the connection process.
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });
  })
  .catch((error) => {
    console.log("MONGODB connection error ", error);
  })


