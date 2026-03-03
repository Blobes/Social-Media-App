import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";
import { GistModel } from "@/models/post/gist";
import mongoose from "mongoose";
import { getGistAggregation } from "@/utils/gist";

const getGist = async (req: AuthRequest, res: Response): Promise<void> => {
  const postId = req.params.id;
  const userId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    res
      .status(400)
      .json({ message: "Invalid Post ID", status: "ERROR", payload: null });
    return;
  }

  try {
    const gist = await GistModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(postId), status: "ACTIVE" },
      },
      ...getGistAggregation(userId),
    ]);

    if (!gist.length) {
      res
        .status(404)
        .json({ message: "Post not found", status: "ERROR", payload: null });
      return;
    }

    res.status(200).json({
      message: "Post fetched successfully",
      status: "SUCCESS",
      payload: gist[0],
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error.message, status: "ERROR", payload: null });
  }
};

export default getGist;
