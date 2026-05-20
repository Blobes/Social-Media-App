import { Response } from "express";
import { getClientIp, generateRandomIp, getLocationFromIp } from "@repo/shared";
import { GistModel, IPostStatus, PostVisibility } from "@repo/database";
import { CreateRequest } from "./createGist";

interface DraftRequest extends CreateRequest {
  body: {
    gistId?: string;
    caption?: string;
    topics?: string[];
  };
}

/**
 * Persists draft text metadata by updating an existing record if a gistId is provided, or creating a new one.
 */
export const draftGist = async (req: DraftRequest, res: Response) => {
  const userId = req.user?.id;
  const { gistId, caption, topics } = req.body;

  if (!userId) {
    res.status(400).json({
      status: "ERROR",
      payload: null,
      message: "Invalid User Session",
    });
    return;
  }

  const userIp = getClientIp(req);
  const geoData = await getLocationFromIp(generateRandomIp());
  const location = geoData
    ? {
        name: `${geoData.city}, ${geoData.state}`,
        type: "Point" as const,
        coordinates: [Number(geoData.longitude), Number(geoData.latitude)],
      }
    : undefined;

  const updateFields = {
    authorId: userId,
    status: "DRAFT" as IPostStatus,
    visibility: "PRIVATE" as PostVisibility,
    location,
    latestCaption: caption ? { caption: caption.trim() } : undefined,
    mediaIds: [],
    topics: topics || [],
  };

  try {
    let draftedGist;

    if (gistId) {
      // Upsert tracking profile ensuring the user can only modify their own draft entries
      draftedGist = await GistModel.findOneAndUpdate(
        { _id: gistId, authorId: userId },
        { $set: updateFields },
        { new: true, runValidators: true },
      );

      if (!draftedGist) {
        res.status(404).json({
          status: "ERROR",
          message:
            "Target draft reference not found or unauthorized access attempt flagged",
        });
        return;
      }
    } else {
      // Fall back to record initialization if no previous draft sequence hash exists
      draftedGist = await GistModel.create(updateFields);
    }

    res.status(gistId ? 200 : 201).json({
      status: "SUCCESS",
      payload: { gistId: draftedGist._id },
      message: gistId
        ? "Draft progress updated successfully."
        : "Gist successfully saved as a draft.",
    });
  } catch (error: any) {
    console.error("❌ Failed to save draft:", error.message);
    res.status(500).json({
      status: "ERROR",
      message: "Failed to preserve draft tracking state",
    });
  }
};
