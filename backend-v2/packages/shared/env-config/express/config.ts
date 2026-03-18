import mongoose from "mongoose";
import cors from "cors";

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

// Configure cors
export const corsConfig = (): any => {
  const allowedOrigins = [
    // Local Development
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://localhost:3005",
    "http://localhost:3006",

    // Production Domains
    "https://funstakes.net", // Your main frontend
    "https://www.funstakes.net", // www version
    "https://api.funstakes.net", // The gateway itself

    // Legacy/Preview Deployments
    "https://funstakes.vercel.app",
    "https://funstakes-auth.vercel.app",
    "https://funstakes.onrender.com",
  ];

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      // Check exact matches
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Regex for localhost ports 3000-3006
      const localhostMatch = origin.match(/^http:\/\/localhost:300[0-6]$/);
      if (localhostMatch) return callback(null, true);

      // Allow all Vercel preview deployments
      if (origin.endsWith(".vercel.app")) return callback(null, true);

      // Allow any subdomain of your main domain (optional but safer)
      if (origin.endsWith(".funstakes.net")) return callback(null, true);

      return callback(new Error(`CORS Error: Origin ${origin} not allowed`));
    },
    credentials: true, // Crucial for sending cookies across subdomains
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  });
};
