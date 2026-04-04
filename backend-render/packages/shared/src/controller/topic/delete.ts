// Only delete topic if user and post count is zero. This will mostly likely be used as part of a background process.

import { Response } from "express";
import { pruneDeadTopics } from "../../services/topic";
import { IAuthRequest } from "../../types/types";

interface DeleteRequest extends IAuthRequest {
  body: {
    topicIds: string[];
  };
}

export const deleteUnusedTopics = async (
  req: DeleteRequest,
  res: Response,
): Promise<any> => {
  const { topicIds } = req.body;

  if (!topicIds || !Array.isArray(topicIds)) {
    return res
      .status(400)
      .json({ status: "ERROR", message: "An array of topicIds is required." });
  }

  try {
    const deletedCount = await pruneDeadTopics(topicIds);
    return res.status(200).json({
      status: "ERROR",
      deletedCount,
      message: `Removed ${deletedCount} topics.`,
    });
  } catch (error: any) {
    return res.status(500).json({ status: "ERROR", message: error.message });
  }
};
