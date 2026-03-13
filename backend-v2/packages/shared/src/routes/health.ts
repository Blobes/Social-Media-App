import { Router, Request, Response } from "express";

type AppService =
  | "ADMIN_SERVICE"
  | "AUTH_SERVICE"
  | "POST_SERVICE"
  | "USER_SERVICE"
  | "WORKER_SERVICE";
// I wrap this in a function so each service can tell us who it is
export const healthRouter = (serviceName: AppService) => {
  const router = Router();

  router.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: serviceName,
    });
  });

  return router;
};
