import cors from "cors";

// Configure cors
export const corsConfig = (): any => {
  const allowedOrigins = [
    // Backend Production Deployments
    "https://api.funstakes.net", // Gateway

    // Backend Local Deployments
    "http://localhost:8000", // Gateway
    "http://localhost:8080", // Account
    "http://localhost:8081", // Post
    "http://localhost:8083", // Worker
    "http://localhost:8084", // Platform

    // Frontend Production Deployments
    "https://funstakes.net", // Main frontend
    "https://www.funstakes.net", // www version

    // Frontend Local Deployments
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://localhost:3005",
    "http://localhost:3006",
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

      // Allow any subdomain of your main domain (optional but safer)
      const allowedDomains = ["funstakes.net"];
      if (
        allowedDomains.some(
          (domain) =>
            origin === `https://${domain}` ||
            origin === `https://www.${domain}`,
        )
      ) {
        return callback(null, true);
      }

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
