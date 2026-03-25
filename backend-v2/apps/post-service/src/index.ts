import express from "express";
import { connectDB, initEnv, monitorProcess } from "@repo/shared";
import appLoader from "./loader";

const startServer = async () => {
  initEnv(); // Load the environment first

  const app = express();
  const port = process.env.GIST_PORT || 8081;
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
