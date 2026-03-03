import mongoose from "mongoose";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";
import { GistModel } from "@/models/post/gist";
import { PostContentModel } from "@/models/post/content";
import { createMediaBatch, IMediaInput } from "@/controllers/media/createBatch";

interface CreateRequest extends AuthRequest {
  body: {
    content?: string;
    media?: IMediaInput[];
  };
}

const createGist = async (req: CreateRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { content, media } = req.body;

  const hasContent = content && content.trim().length > 0;
  const hasMedia = media && Array.isArray(media) && media.length > 0;

  if (!hasContent && !hasMedia) {
    res.status(400).json({
      message: "Post must contain either text content or media.",
      status: "ERROR",
      payload: null,
    });
    return;
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Create Gist Container
    const [newGist] = await GistModel.create(
      [{ authorId: userId, mediaIds: [] }],
      { session },
    );

    // Create media
    let uploadedMediaIds: mongoose.Types.ObjectId[] = [];
    if (hasMedia) {
      uploadedMediaIds = await createMediaBatch(media, userId, session, {
        sourceId: newGist._id as mongoose.Types.ObjectId,
        sourceType: "Gist",
      });
    }

    // Create Content Version
    const [initialContent] = await PostContentModel.create(
      [
        {
          postId: newGist._id,
          postType: "Gists",
          content: hasContent ? content!.trim() : "",
          version: 1,
          isLatest: true,
        },
      ],
      { session },
    );

    //  Finalize the Container with references
    newGist.latestContent = {
      contentId: initialContent._id,
      content: initialContent.content,
    };
    newGist.mediaIds = uploadedMediaIds;

    await newGist.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      message: "Gist created successfully",
      status: "SUCCESS",
      payload: newGist,
    });
  } catch (error: any) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error("Error in createGist:", error);
    res.status(500).json({
      message: error.message || "Server error during gist creation",
      status: "ERROR",
      payload: null,
    });
  } finally {
    session.endSession();
  }
};

export default createGist;
