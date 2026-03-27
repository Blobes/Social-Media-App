import express from "express";
import { connectDB, initEnv, initRedis, monitorProcess } from "@repo/shared";
import appLoader from "./loader";

const startServer = async () => {
  initEnv(); // Load the environment first

  initRedis(); // Initialize Redis configuration

  const app = express();
  const port = process.env.ACCOUNT_PORT;
  const mongoUri = process.env.MONGO_URI || "";

  try {
    monitorProcess();
    await connectDB(mongoUri);
    appLoader(app);

    app.listen(port, () => {
      console.log(
        `🚀 Funstakes Account Service [${process.env.NODE_ENV}] running on port ${port}`,
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
