import mongoose from "mongoose";
import { Response } from "express";
import { AuthRequest } from "@repo/shared";
import { GistModel, PostCaptionModel } from "@repo/database";

interface EditRequest extends AuthRequest {
  body: {
    content: string;
    gistId: string;
  };
}

const editGist = async (req: EditRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { content, gistId } = req.body;

  // 1. Basic Validations
  if (!content?.trim()) {
    res.status(400).json({
      message: "Content cannot be empty during an edit.",
      status: "ERROR",
      payload: null,
    });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(gistId) || !userId) {
    res.status(400).json({
      status: "ERROR",
      payload: null,
      message: "Invalid Gist ID or Session",
    });
    return;
  }

  // Start Transaction to ensure Versioning and Container stay in sync
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 2. Fetch Gist & Ownership Check
    const gist = await GistModel.findById(gistId).session(session);

    if (!gist) {
      res
        .status(404)
        .json({ message: "Gist not found", status: "ERROR", payload: null });
      return;
    }

    if (gist.authorId.toString() !== userId) {
      res
        .status(403)
        .json({ message: "Permission denied", status: "ERROR", payload: null });
      return;
    }

    // 3. ENFORCE 3-EDIT LIMIT
    if (gist.editCount >= 3) {
      res.status(400).json({
        status: "ERROR",
        payload: null,
        message: "Maximum edit limit (3) reached for this post.",
      });
      return;
    }

    // 4. Content Versioning (Decoupled Strategy)
    // Mark all existing versions for this post as not latest
    await PostCaptionModel.updateMany(
      { postId: gistId, isLatest: true },
      { $set: { isLatest: false } },
      { session },
    );

    // Create the new version (Next version = current editCount + 2)
    const nextVersion = (gist.editCount || 0) + 2;
    const [newContentDoc] = await PostCaptionModel.create(
      [
        {
          postId: gistId,
          postType: "GIST",
          caption: content.trim(),
          version: nextVersion,
          isLatest: true,
        },
      ],
      { session },
    );

    // 5. Update Gist Container (Denormalization)
    // Increment the edit count and update the fast-access text snippet
    gist.editCount += 1;
    gist.latestCaption = {
      captionId: newContentDoc._id,
      caption: newContentDoc.caption,
    };

    await gist.save({ session });

    // Finalize changes
    await session.commitTransaction();

    res.status(200).json({
      status: "SUCCESS",
      payload: gist,
      message: "Gist edited successfully",
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Critical Edit Error:", error);
    res.status(500).json({
      status: "ERROR",
      payload: null,
      message: error.message || "Failed to update gist",
    });
  } finally {
    session.endSession();
  }
};

export default editGist;
