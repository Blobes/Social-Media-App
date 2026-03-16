import express from "express";
import dotenv from "dotenv";
import path from "path";
import { connectDB } from "./utils/express/config";
import appLoader from "./utils/express/loader";
import monitorProcess from "./utils/express/monitor";
import { initUserCleanup } from "./services/cleanup/user";
import {
  initTopicCleanup,
  initUserTopicCleanup,
} from "./services/cleanup/topic/automated";
import { startEligibilityWorker } from "./services/identity/worker";

// Load Environment Variables immediately
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const startServer = async () => {
  const app = express();
  const port = process.env.PORT || 8080;
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

// Background workers
// initUserCleanup()
// initTopicCleanup();
// initUserTopicCleanup();
// startEligibilityWorker()

startServer();
