import express from "express";
import { Request, Response } from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "@/routes/authRoutes";
import userRoutes from "@/routes/userRoutes";
import postRoutes from "@/routes/postRoutes";
import cookieParser from "cookie-parser";
import path from "path";
import { connectDB, corsConfig } from "@/helper";

dotenv.config({
  path: path.resolve(
    process.cwd(),
    `.env.${process.env.NODE_ENV || "development"}`,
  ),
});

const app = express();
const port = process.env.PORT || 8080;
const mongoUri = process.env.MONGO_URI || "";

// ====== Middlewares ======
app.use(corsConfig());
app.use(bodyParser.json({ limit: "30mb", inflate: true }));
app.use(
  bodyParser.urlencoded({ limit: "30mb", inflate: true, extended: true }),
);
app.use(cookieParser());

// Site health check
app.get("/healthz", (_req: Request, res: Response): void => {
  res.status(200).send("OK");
});

// ====== Routes ======
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

// ====== DB Connection ======
connectDB(mongoUri);

// Reconnect on disconnect
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected. Retrying in 10s...");
  setTimeout(connectDB, 10000);
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB runtime error:", err.message);
});

// ====== Start Server ======
const startServer = async () => {
  await connectDB(mongoUri); // ensure DB connection before starting server

  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
};
startServer();

// ====== Global Error Handlers ======
process.on("uncaughtException", (err) => {
  console.error(" Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error(" Unhandled Rejection:", reason);
});
