import express from "express";
import { connectDB, initCacheClient, monitorProcess } from "@repo/shared";
import { otpDispatchWorker } from "./processors/otpDispatcher";
import appLoader from "./loader";
import { startDeviceCleanupTask } from "./automations/deviceCleanup";
import { FUNSTAKES_REDIS_URL, MONGO_URI, NODE_ENV, PORT } from "./envVars";
import { startUserMetricsReset } from "./automations/resetUserMetrics";
import { startErrorLogCleanupTask } from "./automations/errorLogsCleanup";

const startServer = async () => {
  const app = express();

  try {
    monitorProcess();

    await initCacheClient(FUNSTAKES_REDIS_URL); // Initialize Redis cache pool
    await connectDB(MONGO_URI);

    // Background workers
    otpDispatchWorker();
    startDeviceCleanupTask();
    startErrorLogCleanupTask();
    startUserMetricsReset();
    // initUserCleanup()
    // initTopicCleanup();
    // initUserTopicCleanup();
    // startEligibilityWorker()

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
