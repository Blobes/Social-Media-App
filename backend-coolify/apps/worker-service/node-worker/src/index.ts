import express from "express";
import { connectDB, initUpstash, monitorProcess } from "@repo/shared";
import { otpDispatchWorker } from "./processors/otpDispatcher";
import appLoader from "./loader";
import { startDeviceCleanupTask } from "./automations/deviceCleanup";
import { MONGO_URI, NODE_ENV, PORT } from "./envVars";

const startServer = async () => {
  const app = express();
  initUpstash(); // Load redis

  try {
    monitorProcess();
    await connectDB(MONGO_URI);

    appLoader(app);

    app.listen(PORT, () => {
      console.log(`🚀 Funstakes Server [${NODE_ENV}] running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

otpDispatchWorker();
startDeviceCleanupTask();

// Background workers
// initUserCleanup()
// initTopicCleanup();
// initUserTopicCleanup();
// startEligibilityWorker()
