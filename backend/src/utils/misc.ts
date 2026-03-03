import mongoose from "mongoose";
import cors from "cors";

// Configure cors
export const corsConfig = (): any => {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001", // Local Shell
    "http://localhost:3002", // Local Auth
    "http://localhost:3003", // Local Feed
    "http://localhost:3004", // Local Stake
    "http://localhost:3005", // Local Profile
    "http://localhost:3006",
    "https://funstakes.vercel.app",
    "https://funstakes-auth.vercel.app",
    "https://funstakes.onrender.com",
  ];

  return cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      // Check if the origin is in our hardcoded list
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Pattern match for any localhost port between 3000-3006
      const localhostMatch = origin.match(/^http:\/\/localhost:300[0-6]$/);
      if (localhostMatch) return callback(null, true);

      // Allow Vercel preview deployments
      if (origin.endsWith(".vercel.app")) return callback(null, true);

      return callback(new Error("CORS: Origin not allowed"));
    },
    credentials: true,
  });
};

//DB Connector
export const connectDB = async (mongoUri: any) => {
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // fail fast if cannot connect
      socketTimeoutMS: 45000, // drop dead sockets
      // keepAlive: true,
    });
    // prevent query buffer from timing out too fast
    mongoose.set("bufferTimeoutMS", 20000);
    console.log("✅ DB Connected successfully");
  } catch (err: any) {
    console.error("❌ Initial DB connection failed:", err.message);
    setTimeout(connectDB, 10000); // retry after 10s
  }
};
