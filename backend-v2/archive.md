CREATE GIST
import mongoose from "mongoose";
import { UserModel } from "@/models/user";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";
import { GistModel } from "@/models/post/gist";

interface CreateRequest extends AuthRequest {
body: {
content: string;
};
}

export const createGist = async (
req: CreateRequest,
res: Response,
): Promise<void> => {
const userId = req.user?.id;
const { content } = req.body;

// Validate content
if (!content?.trim()) {
res.status(400).json({
message: "Content is required",
status: "ERROR",
payload: null,
});
return;
}

// Validate MongoDB ID format
if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
res.status(400).json({
message: "User ID format not valid",
status: "ERROR",
payload: null,
});
return;
}

try {
const user = await UserModel.findById(userId);
if (!user) {
res.status(404).json({
message: "User not found",
status: "ERROR",
payload: null,
});
return;
}

    const newPost = await GistModel.create({
      authorId: userId,
      content: content.trim(),
    });

    res.status(201).json({
      message: "Post created successfully",
      payload: newPost,
      status: "SUCCESS",
    });

} catch (error: any) {
console.error("Error creating post:", error);
res.status(500).json({
message: error.message || "Failed to create post due to server error",
payload: null,
status: "ERROR",
});
}
};

export default createGist;

EDIT GIST
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

GET ALL GIST
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";
import mongoose from "mongoose";
import { GistLikeModel, GistModel } from "@/models/post/gist";

export const getActiveGists = async (req: AuthRequest, res: Response) => {
const userId = req.user?.id; // Logged-in user

try {
const posts = await GistModel.find()
.sort({ createdAt: -1 })
.select("\_id authorId content likeCount createdAt postImage status")
.lean();

    // Map likedByMe for current user
    const postsWithLikes = await Promise.all(
      posts.map(async (post) => {
        let likedByMe = false;
        if (userId) {
          likedByMe = !!(await GistLikeModel.exists({
            postId: new mongoose.Types.ObjectId(post._id),
            userId,
          }));
        }
        return { ...post, likedByMe };
      }),
    );

    res.status(200).json({
      message:
        posts.length > 0 ? "Posts fetched successfully" : "No posts found",
      payload: postsWithLikes,
      status: "SUCCESS",
    });

} catch (error: any) {
res.status(500).json({
message: error.message || "Failed to fetch posts",
payload: null,
status: "ERROR",
});
}
};

GET GIST
import mongoose from "mongoose";
import { Request, Response } from "express";
import { GistModel } from "@/models/post/gist";

const getGist = async (req: Request, res: Response): Promise<any> => {
const postId = req.params.id;

if (!mongoose.Types.ObjectId.isValid(postId)) {
return res.status(400).json({
message: "Post ID format not valid",
status: "ERROR",
payload: null,
});
}

try {
const post = await GistModel.findById(postId).lean();

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
        status: "ERROR",
        payload: null,
      });
    }

    res.status(200).json({
      message: "Post fetched successfully",
      status: "SUCCESS",
      payload: post,
    });

} catch (error: any) {
res.status(500).json({
message: error.message || "Failed to get post due to server error",
status: "ERROR",
payload: null,
});
}
};

export default getGist;

GIST LIKE
import mongoose from "mongoose";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";
import { GistLikeModel, GistModel } from "@/models/post/gist";

export const gistLike = async (
req: AuthRequest,
res: Response,
): Promise<any> => {
const postId = req.params.id;
const userId = req.user?.id;

if (!userId) {
return res.status(401).json({
status: "ERROR",
message: "Unauthorized",
payload: null,
});
}

if (!mongoose.Types.ObjectId.isValid(postId)) {
return res.status(400).json({
status: "ERROR",
message: "Invalid post ID",
payload: null,
});
}

const session = await mongoose.startSession();

try {
session.startTransaction();

    const post = await GistModel.findById(postId).session(session);
    if (!post) {
      await session.abortTransaction();
      return res.status(404).json({
        status: "ERROR",
        message: "Post not found",
        payload: null,
      });
    }

    const existingLike = await GistLikeModel.findOne({
      postId,
      userId,
    }).session(session);

    let liked: boolean;

    if (existingLike) {
      // UNLIKE
      await GistLikeModel.deleteOne({ _id: existingLike._id }).session(session);

      await GistModel.updateOne(
        { _id: postId },
        { $inc: { likeCount: -1 } },
        { session },
      );
      liked = false;
    } else {
      // LIKE
      await GistLikeModel.create(
        [
          {
            postId,
            userId,
          },
        ],
        { session },
      );

      await GistModel.updateOne(
        { _id: postId },
        { $inc: { likeCount: 1 } },
        { session },
      );
      liked = true;
    }

    await session.commitTransaction();

    const updatedPost = await GistModel.findById(postId).select("likeCount");

    return res.status(200).json({
      status: "SUCCESS",
      message: liked ? "Post liked" : "Post unliked",
      payload: {
        likedByMe: liked,
        likeCount: updatedPost?.likeCount ?? 0,
      },
    });

} catch (error: any) {
await session.abortTransaction();

    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Server error",
      payload: null,
    });

} finally {
session.endSession();
}
};

import mongoose, { PipelineStage } from "mongoose";

/\*\*

- Shared Pipeline Stages for Gist Aggregation
- @param userId - The ID of the user requesting the data (to check likedByMe)
  \*/
  export const getGistAggregation = (userId?: string) => {
  const userObjectId = userId ? new mongoose.Types.ObjectId(userId) : null;

return [
// 1. JOIN: Fetch Author details from "users" collection
{
$lookup: {
        from: "users",
        localField: "authorId",
        foreignField: "_id",
        as: "authorDetails",
      },
    },
    { $unwind: "$authorDetails" },

    // 2. JOIN: Fetch Media details
    {
      $lookup: {
        from: "media",
        localField: "mediaIds",
        foreignField: "_id",
        as: "media",
      },
    },

    // 3. JOIN: Check if requesting user liked this post
    {
      $lookup: {
        from: "gist_likes",
        let: { currentGistId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$gistId", "$$currentGistId"] },
                  { $eq: ["$userId", userObjectId] },
                ],
              },
            },
          },
        ],
        as: "myLike",
      },
    },

    // 4. PROJECT: Shape the final response
    {
      $project: {
        _id: 1,
        authorId: 1,
        content: "$latestContent.content", // Denormalized content
        contentId: "$latestContent.contentId",
        media: 1,
        likeCount: 1,
        commentCount: 1,
        editCount: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        likedByMe: { $gt: [{ $size: "$myLike" }, 0] },
        author: {
          _id: "$authorDetails._id",
          username: "$authorDetails.username",
          firstName: "$authorDetails.firstName",
          lastName: "$authorDetails.lastName",
          profileImage: "$authorDetails.profileImage",
          fullName: {
            $concat: [
              "$authorDetails.firstName",
              " ",
              "$authorDetails.lastName",
            ],
          },
        },
      },
    },

];
};

import { PipelineStage } from "mongoose";

interface ListOptions {
matchFilter: Record<string, any>; // The specific filter (e.g., authorId: ...)
limit?: number;
skip?: number;
}

export const getPostListAggregation = ({
matchFilter,
limit = 20,
skip = 0,
}: ListOptions): PipelineStage[] => {
return [
// 1. Start with Gists matching the filter
{ $match: matchFilter },
{ $addFields: { postType: "Gist" } },

    // 2. Union with Stakes matching the same filter
    {
      $unionWith: {
        coll: "stakes",
        pipeline: [
          { $match: matchFilter },
          { $addFields: { postType: "Stake" } },
        ],
      },
    },

    // 3. Attach Media via the polymorphic sourceId
    {
      $lookup: {
        from: "media",
        localField: "_id",
        foreignField: "sourceId",
        as: "media",
      },
    },

    // 4. Attach Author details
    {
      $lookup: {
        from: "users",
        localField: "authorId",
        foreignField: "_id",
        as: "author",
        pipeline: [
          { $project: { username: 1, profilePicture: 1, fullName: 1 } },
        ],
      },
    },
    { $unwind: "$author" },

    // 5. Global Sort (Unified across all post types)
    { $sort: { createdAt: -1 } },

    // 6. Pagination
    { $skip: skip },
    { $limit: limit },

];
};

import mongoose from "mongoose";
import cors from "cors";

// Configure cors
export const corsConfig = (): any => {
const allowedOrigins = [
"http://localhost:3000",
"http://localhost:3001", // Local Shell
"http://localhost:3002", // Local Auth
"http://localhost:3003", // Local Feed
"http://localhost:3004", // Local Stake
"http://localhost:3005", // Local Profile
"http://localhost:3006",
"https://funstakes.vercel.app",
"https://funstakes-auth.vercel.app",
"https://funstakes.onrender.com",
];

return cors({
origin: (origin, callback) => {
if (!origin) return callback(null, true);

      // Check if the origin is in our hardcoded list
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Pattern match for any localhost port between 3000-3006
      const localhostMatch = origin.match(/^http:\/\/localhost:300[0-6]$/);
      if (localhostMatch) return callback(null, true);

      // Allow Vercel preview deployments
      if (origin.endsWith(".vercel.app")) return callback(null, true);

      return callback(new Error("CORS: Origin not allowed"));
    },
    credentials: true,

});
};

//DB Connector
export const connectDB = async (mongoUri: any) => {
try {
await mongoose.connect(mongoUri, {
serverSelectionTimeoutMS: 10000, // fail fast if cannot connect
socketTimeoutMS: 45000, // drop dead sockets
// keepAlive: true,
});
// prevent query buffer from timing out too fast
mongoose.set("bufferTimeoutMS", 20000);
console.log("✅ DB Connected successfully");
} catch (err: any) {
console.error("❌ Initial DB connection failed:", err.message);
setTimeout(connectDB, 10000); // retry after 10s
}
};

import express from "express";
import { Request, Response } from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "@/routes/auth";
import userRoutes from "@/routes/user";
import gistRoutes from "@/routes/post/gist";
import feedRoutes from "@/routes/post/feed";
import mediaRoutes from "@/routes/media";
import cookieParser from "cookie-parser";
import path from "path";
import { connectDB, corsConfig } from "@/utils/config";

dotenv.config({
path: path.resolve(
process.cwd(),
`.env.${process.env.NODE_ENV || "development"}`,
),
});

const app = express();
const port = process.env.PORT || 8080;
const mongoUri = process.env.MONGO_URI || "";

// ====== Middlewares ======
app.use(corsConfig());
app.use(bodyParser.json({ limit: "30mb", inflate: true }));
app.use(
bodyParser.urlencoded({ limit: "30mb", inflate: true, extended: true }),
);
app.use(cookieParser());

// Site health check
app.get("/healthz", (\_req: Request, res: Response): void => {
res.status(200).send("OK");
});

// ====== Routes ======
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/gists", gistRoutes);
app.use("/api/media", mediaRoutes);

// ====== DB Connection ======
connectDB(mongoUri);

// Reconnect on disconnect
mongoose.connection.on("disconnected", () => {
console.warn("⚠️ MongoDB disconnected. Retrying in 10s...");
setTimeout(connectDB, 10000);
});

mongoose.connection.on("error", (err) => {
console.error("MongoDB runtime error:", err.message);
});

// ====== Start Server ======
const startServer = async () => {
await connectDB(mongoUri); // ensure DB connection before starting server

app.listen(port, () => {
console.log(`🚀 Server running on http://localhost:${port}`);
});
};
startServer();

// ====== Global Error Handlers ======
process.on("uncaughtException", (err) => {
console.error(" Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
console.error(" Unhandled Rejection:", reason);
});

// Preference-based Creation: Receives a list of topics and add only topics that are not existing to the topics collection. It also adds the topics to the user's preferred topics list and increment the userCount field of each of the topic data by 1 in the topics collection. If any of the topic data provided exists in the topics collection but does not exist in the user preferred topics list, it only adds the topics to user preferred topics list and increment the userCount field of each of the topic data in the topic collection by 1.

// Post Creation: Receives a list of topics and add only topics that are not existing to the topics collection. It also adds the topics to the post's topics list and increment the postCount field of each of the topic data by 1 in the topics collection. If any of the topic data provided exists in the topics collection but does not exist in the post topics list, it only adds the topics to post topics list and increment the userCount field of each of the topic data in the topic collection by 1.

// Post Engagement Update: Receives a list of topics from the post, adds topics not existing in the user's preferred topics to the user's preferred topics list, and increment the userCount field of each of the topic data by 1 in the topics collection. If any of the topic data provided exists in the user's preferred topics list, it ignores adding the topic but instead just updates the lastViewed date field of the topic in the user's preferred topics.

// To distinguish on which model to update that is User or Post model we can add a flag to the request body.

import { Request, Response } from "express";
import { UserModel } from "@/models/user/user";
import { hashCode } from "@/utils/tokens";

export const handleEmailChange = async (
req: Request,
res: Response,
): Promise<any> => {
const { email, code } = req.body as { email?: string; code?: string };

// --- VALIDATION ---
if (!email || !code) {
return res.status(400).json({
status: "ERROR",
message: "Email and verification code are required.",
});
}

try {
// 1. Find the user specifically by the PENDING email
const user = await UserModel.findOne({ pendingEmail: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        status: "ERROR",
        message: "No pending email change request found for this address.",
      });
    }

    // 2. Check Expiry & Verification State
    if (!user.verificationCode || !user.verificationExpiry) {
      return res.status(400).json({
        status: "ERROR",
        message: "No verification process is active for this account.",
      });
    }

    if (Date.now() > user.verificationExpiry.getTime()) {
      return res.status(400).json({
        status: "ERROR",
        message: "Verification code has expired. Please request a new one.",
      });
    }

    // 3. Verify Code
    const hashedInput = hashCode(code);
    if (hashedInput !== user.verificationCode) {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid verification code.",
      });
    }

    // --- THE SWAP (ATOMIC UPDATE) ---
    // Move pending to primary and reset security fields
    user.email = user.pendingEmail as string;
    user.pendingEmail = null;
    user.isEmailVerified = true;
    user.lastEmailChangeAt = new Date(); // Start the 30-day cooldown

    user.verificationCode = undefined;
    user.verificationExpiry = undefined;
    user.lastEmailCodeSentAt = null;

    await user.save();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Your email has been successfully updated and verified.",
    });

} catch (error: any) {
console.error("Verify Email Change Error:", error);
return res.status(500).json({
status: "ERROR",
message: error.message || "An error occurred during verification.",
});
}
};

export type Likelihood =
| "UNKNOWN"
| "VERY_UNLIKELY"
| "UNLIKELY"
| "POSSIBLE"
| "LIKELY"
| "VERY_LIKELY";

export const CONTENT_POLICY = {
version: "2026.1",

// Text Rules for LLM Moderation
text: {
categories: {
TOXICITY: [
"Hate speech (race, religion, gender, etc.)",
"Targeted harassment",
"Bullying",
"Slurs",
],
SAFETY: [
"Self-harm encouragement",
"Graphic violence description",
"Sexual solicitation",
"Child safety risks",
],
INTEGRITY: [
"PII (Phone, Home Address, SSN)",
"Spam/Scams",
"Illegal drug/weapon sales",
],
MISINFORMATION: [
"Medical misinformation",
"Deepfake claims without disclosure",
"Election interference",
],
},
thresholds: {
aiConfidence: 0.85, // Block if the model is >85% sure
},
},

// Media Rules for Vision API (SafeSearch)
media: {
thresholds: {
adult: "POSSIBLE" as Likelihood, // Nudity/Pornography
violence: "LIKELY" as Likelihood, // Gore/Physical violence
racy: "VERY_LIKELY" as Likelihood, // Suggestive but not explicit
medical: "POSSIBLE" as Likelihood, // Graphic surgical/medical images
spoof: "VERY_LIKELY" as Likelihood, // Edits intended to be offensive/fake
},
},
};

// src/services/moderation/validateMedia.ts
import vision from "@google-cloud/vision";
import { CONTENT_POLICY, Likelihood } from "./policy";
import { ModerationResponse } from "@/middlewares/moderateContent";
import { validateText } from "./validateText"; // Import existing text service

const client = new vision.ImageAnnotatorClient();

const LIKELIHOOD_WEIGHTS: Record<Likelihood, number> = {
UNKNOWN: 0,
VERY_UNLIKELY: 1,
UNLIKELY: 2,
POSSIBLE: 3,
LIKELY: 4,
VERY_LIKELY: 5,
};

export const validateMedia = async (
imageUrl: string,
shouldExtractTopic: boolean = false,
): Promise<ModerationResponse> => {
const features: any[] = [{ type: "SAFE_SEARCH_DETECTION" }];

if (shouldExtractTopic) {
features.push({ type: "LABEL_DETECTION" });
}

try {
const [result] = await client.annotateImage({
image: { source: { imageUri: imageUrl } },
features,
});

    const detections = result.safeSearchAnnotation;
    const labels = result.labelAnnotations || [];

    // 1. Safety Check against Google Vision Policy
    if (detections) {
      for (const [category, threshold] of Object.entries(
        CONTENT_POLICY.media.thresholds,
      )) {
        const detectedLikelihood = detections[
          category as keyof typeof detections
        ] as Likelihood;

        const weight = LIKELIHOOD_WEIGHTS[detectedLikelihood];
        const thresholdWeight = LIKELIHOOD_WEIGHTS[threshold];

        if (weight >= thresholdWeight) {
          return {
            isFlagged: true,
            isUnsure: false,
            ruleViolated: category.toUpperCase(),
            reason: `Media flagged for ${category.toUpperCase()} content (${detectedLikelihood}).`,
            extractedTopics: [],
          };
        }

        if (weight > 0 && weight === thresholdWeight - 1) {
          return {
            isFlagged: true,
            isUnsure: true,
            ruleViolated: category.toUpperCase(),
            reason: `Potential ${category.toUpperCase()} content detected (${detectedLikelihood}).`,
            extractedTopics: [],
          };
        }
      }
    }

    // 2. Reuse validateText logic for Topic Extraction
    let finalTopics: string[] = [];

    if (shouldExtractTopic && labels.length > 0) {
      // Convert Vision labels into a comma-separated string for the LLM
      const labelString = labels.map((l: any) => l.description).join(", ");

      // We call validateText with the labels.
      // Since Vision already handled safety, we mainly care about the extractedTopics.
      const textRefinement = await validateText(
        `Visual labels from an image: ${labelString}`,
        [], // No user-provided topics
      );

      finalTopics = textRefinement.extractedTopics;
    }

    return {
      isFlagged: false,
      isUnsure: false,
      ruleViolated: null,
      reason: null,
      extractedTopics: finalTopics,
    };

} catch (error) {
console.error("Media Validation Error:", error);
return {
isFlagged: false,
isUnsure: false,
ruleViolated: null,
reason: null,
extractedTopics: [],
};
}
};

// app.get("/healthz", (\_req: Request, res: Response) => {
// res.status(200).send("OK");
// });

ts-node: "^10.9.2"
nodemon: "^3.1.10"
