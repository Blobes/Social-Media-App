import { redisClient } from "../../services/redis";

export const checkSlidingWindow = async (
  identifier: string,
  limit: number,
  windowSeconds: number = 60,
) => {
  const now = Date.now();
  const currentWindow = Math.floor(now / (windowSeconds * 1000));
  const previousWindow = currentWindow - 1;

  const currentKey = `ratelimit:${identifier}:${currentWindow}`;
  const previousKey = `ratelimit:${identifier}:${previousWindow}`;

  // Pipeline both counts and the increment in one jump to Upstash
  const p = redisClient.pipeline();
  p.get<number>(previousKey);
  p.incr(currentKey);
  p.expire(currentKey, windowSeconds * 2); // Keep key long enough for next window calculation

  const [prevCount, currCount] = await p.exec();

  const prevValue = (prevCount as number) ?? 0;
  const currValue = (currCount as number) ?? 0;

  // Calculate the weight (how far we are into the current window)
  const timePassedInWindow = now % (windowSeconds * 1000);
  const weight =
    (windowSeconds * 1000 - timePassedInWindow) / (windowSeconds * 1000);

  // The Sliding Estimate
  const estimate = currValue + prevValue * weight;

  return {
    isAllowed: estimate <= limit,
    currentUsage: Math.floor(estimate),
  };
};
