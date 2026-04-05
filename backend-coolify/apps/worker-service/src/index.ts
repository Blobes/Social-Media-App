import express from "express";
import { connectDB, initEnv, initUpstash, monitorProcess } from "@repo/shared";
import "./processors/postModeration";
import { otpDispatchWorker } from "./processors/codeDispatch";
import { postModerationWorker } from "./processors/postModeration";
import appLoader from "./loader";

const startServer = async () => {
  initEnv(); // Load the environment first
  initUpstash(); // Load redis

  const app = express();
  const port = process.env.WORKER_PORT || 8083;
  const mongoUri = process.env.MONGO_URI || "";

  try {
    monitorProcess();
    await connectDB(mongoUri);

    appLoader(app);

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

otpDispatchWorker();
postModerationWorker();

// Background workers
// initUserCleanup()
// initTopicCleanup();
// initUserTopicCleanup();
// startEligibilityWorker()
