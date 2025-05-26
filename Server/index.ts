import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "@/routes/authRoutes";
//import userRoutes from "@/routes/userRoutes";
//import postRoutes from "@/routes/postRoutes";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Allow requests from your frontend here
app.use(
  cors({
    origin: "http://localhost:3000", // or "*" for all origins (not recommended for production)
    credentials: true, // this is important if you're using cookies
  })
);

//Connecting to DB
dotenv.config();
mongoose
  .connect(process.env.MONGO_URI || "")
  .then(() => console.log("DB Connected sucessfully"));
mongoose.connection.on("error", (err) =>
  console.log(`DB connection error: ${err.message}`)
);
const port = process.env.PORT;
app.listen(port);

//Middlewares
app.use(bodyParser.json({ limit: "30mb", inflate: true }));
app.use(
  bodyParser.urlencoded({ limit: "30mb", inflate: true, extended: true })
);
app.use(cookieParser());

// Utilizing routes
app.use("/auth", authRoutes);
//app.use("/user", userRoutes);
//app.use("/post", postRoutes);
