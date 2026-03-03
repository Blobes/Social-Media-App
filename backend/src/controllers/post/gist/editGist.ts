import mongoose from "mongoose";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken"; // type with user?: JwtUserPayload
import { GistModel } from "@/models/post/gist";

interface EditRequest extends AuthRequest {
  body: {
    content: string;
  };
}

export const editGist = async (
  req: EditRequest,
  res: Response,
): Promise<void> => {
  const gistId = req.params.id;
  const userId = req.user?.id; // from JWT payload
  const { content } = req.body;

  if (!content?.trim()) {
    res.status(400).json({
      message: "Content is required",
      status: "ERROR",
      payload: null,
    });
    return;
  }

  if (
    !mongoose.Types.ObjectId.isValid(gistId) ||
    !userId ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    res.status(400).json({
      message: "Post ID or User ID format not valid",
      status: "ERROR",
      payload: null,
    });
    return;
  }

  try {
    const gist = await GistModel.findById(gistId);
    if (!gist) {
      res.status(404).json({
        message: "Post not found",
        status: "ERROR",
        payload: null,
      });
      return;
    }

    if (userId !== gist.authorId.toString()) {
      res.status(403).json({
        message: "You are not the author of this post, so you cannot edit it.",
        status: "ERROR",
        payload: null,
      });
      return;
    }

    gist.content = content.trim();
    await gist.save();

    res.status(200).json({
      message: "Post edited successfully",
      payload: gist,
      status: "SUCCESS",
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to edit post due to server error",
      payload: null,
      status: "ERROR",
    });
  }
};

export default editGist;
