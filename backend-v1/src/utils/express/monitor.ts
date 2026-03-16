import mongoose from "mongoose";

export default () => {
  // ====== DB Lifecycle Handlers ======
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
  });

  mongoose.connection.on("error", (err) => {
    console.error("🔥 MongoDB runtime error:", err);
  });

  // ====== Global Error Handlers ======
  process.on("uncaughtException", (err) => {
    console.error("🚨 Uncaught Exception:", err);
    // In production, consider a graceful shutdown logic here
  });

  process.on("unhandledRejection", (reason) => {
    console.error("🚨 Unhandled Rejection at Promise:", reason);
  });
};
