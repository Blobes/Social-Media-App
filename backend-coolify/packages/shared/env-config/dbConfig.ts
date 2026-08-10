import mongoose, { ConnectOptions } from "mongoose";

/**
 * Interface for global mongoose cache container.
 */
interface IMongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: IMongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

/**
 * Establishes and caches the database connection.
 */
export const connectDB = async (mongoUri: string) => {
  if (!mongoUri) {
    console.error("❌ MONGODB_URI is missing from environment variables.");
    return;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      autoIndex: process.env.NODE_ENV !== "production",
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
    throw e;
  }

  return cached.conn;
};

/**
 * Configures process-level and connection event listeners.
 */
export const monitorProcess = () => {
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
  });

  mongoose.connection.on("error", (err) => {
    console.error("🔥 MongoDB runtime error:", err);
  });

  process.on("uncaughtException", (err) => {
    console.error("🚨 Uncaught Exception:", err);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("🚨 Unhandled Rejection at Promise:", reason);
  });
};
