import express from "express";
import appLoader from "./loader";
import { connectDB, initEnv, monitorProcess } from "@repo/shared";

// Load Environment Variables immediately
initEnv();

const startServer = async () => {
  const app = express();
  const port = process.env.USER_PORT || 8082;
  const mongoUri = process.env.MONGO_URI || "";

  try {
    // Initialize Process Monitoring (Error Handlers)
    monitorProcess();

    // Connect to Database
    await connectDB(mongoUri);

    // Load Express Middlewares & Routes
    appLoader(app);

    // Start Server
    app.listen(port, () => {
      console.log(
        `🚀 Funstakes Server [${process.env.NODE_ENV}] running on port ${port}`,
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
