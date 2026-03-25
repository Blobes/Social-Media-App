import { Request, Response, NextFunction } from "express";
import { checkSlidingWindow } from "@repo/shared";

export const rateLimiter = (limit: number, windowSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || "anonymous";

    try {
      const { isAllowed, currentUsage } = await checkSlidingWindow(
        identifier,
        limit,
        windowSeconds,
      );

      if (!isAllowed) {
        return res.status(429).json({
          error: "Too many requests",
          message: `Rate limit exceeded. Current usage: ${currentUsage}/${limit}`,
        });
      }

      next();
    } catch (error) {
      console.error("Sliding Window Error:", error);
      next(); // Fail-open strategy
    }
  };
};
