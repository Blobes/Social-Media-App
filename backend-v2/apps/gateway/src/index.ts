import { initEnv } from "@repo/shared";

// Ensure environment loads first
initEnv();

const startGateway = async () => {
  const express = (await import("express")).default;
  const { corsConfig } = await import("@repo/shared");
  const gatewayRoutes = (await import("./routes")).default;

  const app = express();
  const PORT = process.env.PORT || 8000;

  // Middlewares
  app.use(corsConfig());

  // Basic Gateway health check
  app.get("/health", (req, res) => {
    res.status(200).send("Gateway is Live");
  });

  // Mount versioned routes (api.funstakes.net/v1/...)
  app.use("/", gatewayRoutes);

  app.listen(PORT, () => {
    console.log(`🚀 Gateway [${process.env.NODE_ENV}] running on port ${PORT}`);
    console.log(`📡 Public API Endpoint: https://api.funstakes.net/v1`);
  });
};

startGateway();
