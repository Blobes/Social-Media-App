/\*\*

- Fetches location data with a required User-Agent header for API compatibility.
  \*/
  export async function getLocationFromIp(ip: string | undefined) {
  if (!ip || ip === "::1" || ip === "127.0.0.1") return null;

try {
const response = await fetch(`https://ipwho.is/${ip}`, {
method: "GET",
headers: {
"User-Agent":
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
Accept: "application/json",
"Accept-Language": "en-US,en;q=0.9",
Referer: "https://ipwhois.io/",
Origin: "https://ipwhois.io/",
"Cache-Control": "no-cache",
},
});

    if (!response.ok) {
      console.error(`HTTP Error: ${response.status}`);
      return null;
    }
    const data = (await response.json()) as any;

    if (!data.success) {
      // This will tell you if the random IP was reserved or invalid
      console.warn("IP lookup failed:", data.message);
      return null;
    }

    return {
      country: data.country,
      state: data.region,
      city: data.city,
      isp: data.connection?.isp,
      flag: data.flag?.emoji,
      latitude: data.latitude,
      longitude: data.longitude,
    };

} catch (err) {
console.error("Geo lookup network error:", err);
return null;
}
}

import mongoose from "mongoose";
import { Response } from "express";
import {
IAuthRequest,
createMediaBatch,
IMediaInput,
ISeverity,
invalidatePattern,
CACHE_KEYS,
getClientIp,
generateRandomIp,
getLocationFromIp,
} from "@repo/shared";
import { GistModel, PostCaptionModel } from "@repo/database";

interface CreateRequest extends IAuthRequest {
body: {
caption?: string;
media?: IMediaInput[];
hasSensitiveGraphic?: boolean;
};
}

const createGist = async (req: CreateRequest, res: Response): Promise<void> => {
const userId = req.user?.id;
const { caption, media, hasSensitiveGraphic } = req.body;

const hasCaption = caption && caption.trim().length > 0;
const hasMedia = media && Array.isArray(media) && media.length > 0;

if (!hasCaption && !hasMedia) {
res.status(400).json({
status: "ERROR",
message: "Post must contain either text content or media.",
});
return;
}

const session = await mongoose.startSession();

try {
session.startTransaction();

    // 1. Create Gist Container
    const [newGist] = await GistModel.create(
      [
        {
          authorId: userId,
          mediaIds: [],
          latestCaption: {
            caption: hasCaption ? caption!.trim() : "Pending...",
          },
        },
      ],
      { session },
    );

    // 2. Create media
    let uploadedMediaIds: mongoose.Types.ObjectId[] = [];
    if (hasMedia) {
      uploadedMediaIds = await createMediaBatch(media, userId, session, {
        sourceId: newGist._id as mongoose.Types.ObjectId,
        sourceType: "GIST",
      });
    }

    // 3. Create Caption Version
    const [initialCaption] = await PostCaptionModel.create(
      [
        {
          postId: newGist._id,
          postType: "GIST",
          caption: hasCaption ? caption!.trim() : "",
          version: 1,
          isLatest: true,
        },
      ],
      { session },
    );
    // Media
    newGist.mediaIds = uploadedMediaIds;

    // Finalize the Container
    newGist.latestCaption = {
      captionId: initialCaption._id,
      caption: initialCaption.caption,
    };

    // Add topics
    newGist.topics = req.moderation?.topics || [];

    // User location when the post was created
    const userIp = getClientIp(req);
    const randomIp = generateRandomIp();
    const geoData = await getLocationFromIp(randomIp);

    const location = geoData
      ? {
          name: `${geoData.city}, ${geoData.state}`,
          type: "Point" as const,
          coordinates: [Number(geoData.longitude), Number(geoData.latitude)],
        }
      : undefined;

    if (location) newGist.location = location;

    // Apply AI Moderation Logic
    if (
      req.moderation?.severity === ISeverity.LOW ||
      req.moderation?.needsReview
    ) {
      newGist.status = "SHADOWBANNED";
    }
    const SENSITIVE_RULES = [
      "adult",
      "violence",
      "Severe Violence",
      "NSFW Media",
    ];
    newGist.hasSensitiveGraphic =
      hasSensitiveGraphic === true
        ? true
        : req.moderation
          ? SENSITIVE_RULES.includes(req.moderation.ruleViolated || "") &&
            req.moderation.severity === ISeverity.CRITICAL
          : false;

    await newGist.save({ session });

    // 6. Commit DB changes
    await session.commitTransaction();

    // CACHE INVALIDATION
    await Promise.all([
      invalidatePattern(CACHE_KEYS.WILDCARD_USER_FEED_ALL(userId)),
      invalidatePattern(CACHE_KEYS.GLOBAL_FEED_PAGE_ONE),
    ]);

    // Prepare moderation metadata for the client
    const moderation = req.moderation
      ? {
          extractedTopics: req.moderation.topics || [],
          needsReview: req.moderation.needsReview,
          severity: req.moderation.severity,
          ruleViolated: req.moderation.ruleViolated,
          reason: req.moderation.reason,
        }
      : null;

    res.status(201).json({
      status: "SUCCESS",
      payload: newGist,
      moderation,
      message: "Gist created successfully",
    });

} catch (error: any) {
if (session.inTransaction()) await session.abortTransaction();
console.error("Error in createGist:", error);
res.status(500).json({
status: "ERROR",
message: error.message || "Server error during gist creation",
});
} finally {
session.endSession();
}
};

export default createGist;
