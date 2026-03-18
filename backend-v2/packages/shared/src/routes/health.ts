import { Router, Request, Response } from "express";
import { AppName } from "../types/types";

// I wrap this in a function so each service can tell us who it is
export const healthRouter = (serviceName: AppName) => {
  const router = Router();

  router.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
      status: "Ok",
      timestamp: new Date().toISOString(),
      service: serviceName,
    });
  });
  console.log(`${serviceName} is Live"`);
  return router;
};
