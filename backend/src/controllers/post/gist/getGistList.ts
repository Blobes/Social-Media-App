import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";
import { GistModel } from "@/models/post/gist";
import { getGistAggregation } from "@/utils/gist";

export const getGistList = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;

  try {
    const gists = await GistModel.aggregate([
      { $match: { status: "ACTIVE" } },
      { $sort: { createdAt: -1 } },
      // Optional: { $limit: 20 },
      ...getGistAggregation(userId),
    ]);

    res.status(200).json({
      message:
        gists.length > 0 ? "Gists fetched successfully" : "No gists found",
      payload: gists,
      status: "SUCCESS",
    });
  } catch (error: any) {
    console.error("Fetch Gists Aggregation Error:", error);
    res.status(500).json({
      message: error.message || "An error occurred while fetching gists",
      payload: null,
      status: "ERROR",
    });
  }
};
