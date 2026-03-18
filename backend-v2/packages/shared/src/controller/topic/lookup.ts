// When called without a keyword, by default it returns a few list of most recent starting from topics with highest post count. When it finally receives a keyword it then returns a list of topics matching the keyword. Please note that it will receive 2 arguments from the request body: 1 the keyword argument and 2 a list of the already selected topics from the frontend. The second argument is need to help the lookup logic filter only topics that the user has not selected yet.

import { TopicModel } from "@repo/database";
import { Response } from "express";
import { IAuthRequest } from "../../types/types";

interface LookupRequest extends IAuthRequest {
  body: {
    keyword?: string;
    alreadySelected?: string[]; // Array of IDs already picked by the user
  };
}

export const lookupTopics = async (
  req: LookupRequest,
  res: Response,
): Promise<any> => {
  const { keyword, alreadySelected = [] } = req.body;

  try {
    // 1. Base Filter: Exclude topics the user has already selected
    // I am using the $nin (Not In) operator to filter out existing IDs
    const filter: any = {
      _id: { $nin: alreadySelected },
    };

    let topics;

    if (keyword && keyword.trim() !== "") {
      // 2. Search Mode: Filter by keyword (case-insensitive)
      filter.title = { $regex: keyword.trim(), $options: "i" };

      topics = await TopicModel.find(filter).limit(20).sort({ postCount: -1 }); // Prioritize popular matches
    } else {
      // 3. Default Mode: Return most recent popular topics
      // We sort by createdAt for "recent" and postCount for "highest engagement"
      topics = await TopicModel.find(filter)
        .sort({ postCount: -1, createdAt: -1 })
        .limit(10);
    }

    return res.status(200).json({
      status: "SUCCESS",
      data: topics,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "ERROR",
      message: "Error fetching topics",
      error: error.message,
    });
  }
};
