import { Router, Request, Response } from "express";
import { AppName, healthCheck } from "@repo/shared";

// I wrap this in a function so each service can tell us who it is
export const healthRouter = (serviceName: AppName = "GATEWAY") => {
  const router: Router = Router();
  router.get("/", (req: Request, res: Response) => {
    const result = healthCheck(serviceName);
    res.status(200).json({
      ...result,
    });
  });
  return router;
};
