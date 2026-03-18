import { initEnv } from "@repo/shared";

// Force the environment to load first
initEnv();

const startServer = async () => {
  // 2. Dynamically import the rest of your app logic
  // This ensures these modules only parse AFTER initEnv() is done
  const express = (await import("express")).default;
  const { connectDB, monitorProcess } = await import("@repo/shared");
  const appLoader = (await import("./loader")).default;

  const app = express();
  const port = process.env.ADMIN_PORT || 8084;
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
