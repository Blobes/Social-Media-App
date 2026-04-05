import { IAuthRequest, upstashClient } from "@repo/shared";
import { Response } from "express";

export const getActiveSessions = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const userId = req.user?.id;
  const currentSessionId = req.user?.sessionId;

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      message: "Unauthorized",
    });
  }

  try {
    const sessions: any[] = [];
    let cursor = "0";
    const pattern = `session:${userId}:*`;

    // 1. Scan Upstash for all session keys belonging to this user
    do {
      const [nextCursor, keys] = await upstashClient.scan(cursor, {
        match: pattern,
        count: 100,
      });

      if (keys.length > 0) {
        // 2. Fetch the metadata for each session key found
        const pipeline = upstashClient.pipeline();
        keys.forEach((key) => pipeline.get(key));
        const results = await pipeline.exec();

        // 3. Map the data into a readable format for the UI
        keys.forEach((key, index) => {
          const sessionData = results[index] as any;
          if (sessionData) {
            const sessionId = key.split(":").pop(); // Extract UUID from key
            sessions.push({
              sessionId,
              isCurrentDevice: sessionId === currentSessionId,
              userAgent: sessionData.userAgent,
              ip: sessionData.ip,
              lastActive: sessionData.lastActive,
              createdAt: sessionData.createdAt,
            });
          }
        });
      }
      cursor = nextCursor;
    } while (cursor !== "0");

    // Sort sessions so the current device is always first
    const sortedSessions = sessions.sort((a, b) =>
      a.isCurrentDevice === b.isCurrentDevice ? 0 : a.isCurrentDevice ? -1 : 1,
    );

    return res.status(200).json({
      status: "SUCCESS",
      message: "Active sessions retrieved.",
      payload: sortedSessions,
    });
  } catch (error: any) {
    console.error("Get Active Sessions Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Could not retrieve active sessions.",
    });
  }
};
