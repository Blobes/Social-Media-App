import mongoose from "mongoose";

/**
 * Global is used here to maintain a cached connection across hot-reloads
 * in development and function executions in serverless environments.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

// Connect to MongoDB
export const connectDB = async (mongoUri: string) => {
  if (!mongoUri) {
    console.error("❌ MONGODB_URI is missing from environment variables.");
    return;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable buffering for better error visibility
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    console.log("⏳ Attempting to connect to MongoDB...");
    cached.promise = mongoose
      .connect(mongoUri, opts)
      .then((mongooseInstance) => {
        console.log("✅ DB Connected successfully to funstakes-prod");
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("❌ Initial DB connection failed:", e);
    // Exponential backoff or retry logic could go here
    throw e;
  }

  return cached.conn;
};

export const monitorProcess = () => {
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
