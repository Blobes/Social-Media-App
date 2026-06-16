// User-triggered Removal: Receives a list of topics to be removed from a user's preferred topics list and decrement the userCount field from the topic collection.

// Automated-removal: A background process that looks into the user's preferred topics list and removes every topic that the lastViewed date exceeds a given number when compared with the current date. And also decrements the userCount field from the topic collection.

import { Response } from "express";
import { removeTopicsFromUser } from "../../services/topic";
import { IAuthRequest } from "../../types";

interface RemovalRequest extends IAuthRequest {
  body: {
    topicIds: string[];
  };
}

export const handleUserTopicRemoval = async (
  req: RemovalRequest,
  res: Response,
): Promise<any> => {
  const userId = req.user?.id;
  const { topicIds } = req.body;

  if (!topicIds || !Array.isArray(topicIds)) {
    return res
      .status(400)
      .json({ status: "ERROR", message: "An array of topicIds is required." });
  }

  try {
    await removeTopicsFromUser(userId!, topicIds);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Topics removed from preferences successfully.",
    });
  } catch (error: any) {
    return res.status(500).json({ status: "ERROR", message: error.message });
  }
};
