import express from "express";
import { Request, Response } from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "@/routes/authRoutes";
import userRoutes from "@/routes/userRoutes";
import postRoutes from "@/routes/postRoutes";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

dotenv.config({
  path: path.resolve(
    process.cwd(),
    `.env.${process.env.NODE_ENV || "development"}`
  ),
});

const app = express();
const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGO_URI || "";

// ====== Middlewares ======
app.use(
  cors({
    origin: "http://localhost:3000", // change for production
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: "30mb", inflate: true }));
app.use(
  bodyParser.urlencoded({ limit: "30mb", inflate: true, extended: true })
);
app.use(cookieParser());

// Site health
app.get("/healthz", (_req: Request, res: Response): void => {
  res.status(200).send("OK");
});

// ====== Routes ======
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);

// ====== DB Connection ======
const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // fail fast if cannot connect
      socketTimeoutMS: 45000, // drop dead sockets
      // keepAlive: true,
    });
    // prevent query buffer from timing out too fast
    mongoose.set("bufferTimeoutMS", 20000);
    console.log("✅ DB Connected successfully");
  } catch (err: any) {
    console.error("❌ Initial DB connection failed:", err.message);
    setTimeout(connectDB, 10000); // retry after 10s
  }
};

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
  await connectDB(); // ensure DB connection before starting server

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
