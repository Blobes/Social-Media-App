import express from "express";
import {
  connectDB,
  initCacheClient,
  initQueueClient,
  initSocketEmitter,
  monitorProcess,
} from "@repo/shared";
import appLoader from "./loader";
import { FUNSTAKES_REDIS_URL, MONGO_URI, NODE_ENV, PORT } from "./envVars";

const startServer = async () => {
  const app = express();

  initCacheClient(FUNSTAKES_REDIS_URL); // Initialize Redis cache pool
  initQueueClient(FUNSTAKES_REDIS_URL); // Initialize Queue engine pool
  initSocketEmitter(FUNSTAKES_REDIS_URL); // Initialize Socket Emitter

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
