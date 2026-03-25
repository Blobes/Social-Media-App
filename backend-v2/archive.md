// app.get("/healthz", (\_req: Request, res: Response) => {
// res.status(200).send("OK");
// });

ts-node: "^10.9.2"
nodemon: "^3.1.10"

services:

# --- API Gateway (The "Front Door") ---

- type: web
  name: funstakes-gateway
  env: node
  plan: free
  rootDir: backend-v2
  buildCommand: corepack enable && pnpm install && pnpm --filter @repo/gateway build
  startCommand: pnpm --filter @repo/gateway start
  domains:
  - api.funstakes.net
    envVars:
  - key: NODE_VERSION
    value: "22"
  - key: PORT
    value: "8000"
  - fromGroup: funstakes-common-secrets

  # --- Automatic Internal Service Discovery ---
  - key: AUTH_SERVICE_URL
    fromService:
    type: web
    name: funstakes-auth
    property: hostport
    # envVarKey: RENDER_DISCOVERY_SERVICE
  - key: POST_SERVICE_URL
    fromService:
    name: funstakes-post
    type: web
    property: hostport
  - key: USER_SERVICE_URL
    fromService:
    name: funstakes-user
    type: web
    property: hostport
  - key: WORKER_SERVICE_URL
    fromService:
    name: funstakes-worker
    type: web
    property: hostport
  - key: ADMIN_SERVICE_URL
    fromService:
    name: funstakes-admin
    type: web
    property: hostport

        import { UserModel } from "@repo/database";

    import {
    IAuthRequest,
    getUserAggregation,
    userPrivateFields,
    userSensitiveFields,
    } from "@repo/shared";
    import { Response } from "express";
    import mongoose, { PipelineStage } from "mongoose";

const getUserProfile = async (
req: IAuthRequest,
res: Response,
): Promise<any> => {
const targetUserId = req.params.id as string;
const authUserId = req.user?.id;

if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
return res.status(400).json({
message: "Invalid user ID format",
status: "ERROR",
payload: null,
});
}

try {
const isOwner = authUserId === targetUserId;

    // Aggregation ignores the pre('find') middleware, allowing us to find deactivated users
    const pipeline: PipelineStage[] = [
      { $match: { _id: new mongoose.Types.ObjectId(String(targetUserId)) } },
      ...getUserAggregation({ authUserId }),
    ];

    const users = await UserModel.aggregate(pipeline);

    if (!users || users.length === 0) {
      return res.status(404).json({
        message: "User not found",
        status: "ERROR",
        payload: null,
      });
    }

    const userProfile = users[0];

    // CASE 1: ACCOUNT IS DEACTIVATED
    if (userProfile.isDeleted) {
      return res.status(200).json({
        message: "This account has been deactivated",
        status: "DEACTIVATED",
        payload: {
          _id: userProfile._id,
          username: userProfile.username,
          profileImage: userProfile.profileImage,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          isDeleted: true,
          isOwner,
        },
      });
    }

    // Always remove internal security fields (password, codes, etc.)
    userSensitiveFields().forEach((field) => {
      delete userProfile[field];
    });

    // CASE 2: VISITING SOMEONE ELSE'S PROFILE (Privacy Filter)
    if (!isOwner) {
      // Remove PII (Phone, Email, DOB, etc.) for visitors
      userPrivateFields().forEach((field) => {
        delete userProfile[field];
      });
    }

    // CASE 3: SUCCESSFUL VIEW (Owner gets full profile, Visitor gets public profile)
    res.status(200).json({
      message: "User fetched successfully",
      status: "SUCCESS",
      payload: userProfile,
    });

} catch (error: any) {
console.error("Get User Error:", error);
res.status(500).json({
message: error.message || "Failed to get user due to server error",
status: "ERROR",
payload: null,
});
}
};

export default getUserProfile;

import mongoose from "mongoose";
import { Response } from "express";
import { IAuthRequest, getUserListAggregation } from "@repo/shared";
import { FollowModel } from "@repo/database";

export const getFollowers = async (
req: IAuthRequest,
res: Response,
): Promise<any> => {
const targetUserId = req.params.id as string;
const authUserId = req.user?.id; // Viewer context for isFollowing

if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
return res.status(400).json({
message: "User ID format is not valid",
status: "ERROR",
payload: null,
});
}

try {
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 20;
const skip = (page - 1) \* limit;

    // We start with the FollowModel to find everyone following the targetUserId
    const followers = await FollowModel.aggregate([
      // 1. Initial filter on the relationship collection
      {
        $match: {
          followingId: new mongoose.Types.ObjectId(String(targetUserId)),
        },
      },

      // 2. Join with the Users collection to get the profile of the "follower"
      {
        $lookup: {
          from: "users",
          localField: "followerId",
          foreignField: "_id",
          as: "followerDetails",
        },
      },

      // 3. Flatten the joined user array
      { $unwind: "$followerDetails" },

      // 4. Transform the document so the followerDetails are at the top level.
      // This is crucial so our User Aggregator can find fields like firstName, lastName, etc.
      { $replaceRoot: { newRoot: "$followerDetails" } },

      // 5. Apply the User List Aggregator logic (Social context + Formatting)
      ...getUserListAggregation({
        matchFilter: {}, // Already filtered by the FollowModel match above
        authUserId,
        skip,
        limit,
      }),
    ]);

    return res.status(200).json({
      message:
        followers.length > 0
          ? "Followers fetched successfully"
          : "No followers found",
      status: "SUCCESS",
      payload: followers,
      meta: {
        page,
        limit,
        count: followers.length,
      },
    });

} catch (error: any) {
console.error("Get Followers Error:", error);
return res.status(500).json({
message: error.message || "Failed to fetch followers",
status: "ERROR",
payload: null,
});
}
};

import mongoose, { PipelineStage } from "mongoose";

interface UserOptions {
authUserId?: string;
}

export const getUserAggregation = ({
authUserId,
}: UserOptions): PipelineStage[] => {
const viewerId = authUserId
? new mongoose.Types.ObjectId(String(authUserId))
: null;

return [
// Lookup: Does the viewer follow this user? (isFollowing logic)
{
$lookup: {
        from: "follows",
        let: { tId: "$\_id" },
pipeline: [
{
$match: {
              $expr: {
                $and: [
                  { $eq: ["$followerId", viewerId] },
{ $eq: ["$followingId", "$$tId"] },
],
},
},
},
],
as: "followDoc",
},
},

    // Lookup: Does this user follow the viewer? (followsMe logic)
    {
      $lookup: {
        from: "follows",
        let: { tId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$followerId", "$$tId"] },
                  { $eq: ["$followingId", viewerId] },
                ],
              },
            },
          },
        ],
        as: "followerDoc",
      },
    },

    // Project and Format
    {
      $project: {
        password: 0,
        verificationCode: 0,
        verificationExpiry: 0,
        __v: 0,
      },
    },
    {
      $addFields: {
        // Viewer follows Target
        isFollowing: {
          $cond: {
            if: {
              $and: [
                { $ne: [viewerId, null] },
                { $gt: [{ $size: "$followDoc" }, 0] },
              ],
            },
            then: true,
            else: false,
          },
        },
        // Target follows Viewer
        followsMe: {
          $cond: {
            if: {
              $and: [
                { $ne: [viewerId, null] },
                { $gt: [{ $size: "$followerDoc" }, 0] },
              ],
            },
            then: true,
            else: false,
          },
        },
        fullName: { $concat: ["$firstName", " ", "$lastName"] },
      },
    },
    // 4. Cleanup temporary lookup arrays
    { $project: { followDoc: 0, followerDoc: 0 } },

];
};

export const genAccessTokens = (
user: any,
req: IAuthRequest,
res: Response,
) => {
const origin = req.get("origin") || "";
const isLocalDev = origin.includes("localhost");

if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
throw new Error("JWT_SECRET is not defined in environment variables");
}
const userId = user.\_id?.toString() || user.id?.toString();
const accessToken = jwt.sign(
{ id: userId },
process.env.JWT_SECRET as string,
{
expiresIn: "15m",
},
);

res.cookie("access*token", accessToken, {
httpOnly: true,
secure: true,
sameSite: !isLocalDev ? "lax" : "none",
path: "/",
maxAge: 15 * 60 \_ 1000,
});

return accessToken;
};

export const genRefreshTokens = (
user: any,
req: IAuthRequest,
res: Response,
) => {
const origin = req.get("origin") || "";
const isLocalDev = origin.includes("localhost");

if (!process.env.JWT*SECRET || !process.env.REFRESH_TOKEN_SECRET) {
throw new Error(
"REFRESH_TOKEN_SECRET is not defined in environment variables",
);
}
const userId = user.\_id?.toString() || user.id?.toString();
const refreshToken = jwt.sign(
{ id: userId },
process.env.REFRESH_TOKEN_SECRET as string,
{ expiresIn: "7d" },
);
// Set token in cookie
res.cookie("refresh_token", refreshToken, {
httpOnly: true,
secure: true,
sameSite: !isLocalDev ? "lax" : "none",
path: "/",
maxAge: 7 * 24 _ 60 _ 60 \_ 1000, // 7 days
});
return refreshToken;
};

import jwt, { JwtPayload } from "jsonwebtoken";
import { Response, NextFunction, RequestHandler } from "express";
import { IAuthRequest, IJwtUser } from "../types/types";

export const verifyAuthToken: RequestHandler = (
req: IAuthRequest,
res: Response,
next: NextFunction,
) => {
const token = req.cookies.access_token;

if (!token) {
res
.status(401)
.json({ message: "No token provided", status: "UNAUTHORIZED" });
return;
}

jwt.verify(
token,
process.env.JWT_SECRET as string,
(
err: jwt.VerifyErrors | null,
payload: JwtPayload | string | undefined,
) => {
if (err) {
res
.status(401)
.json({ message: "Invalid token", status: "UNAUTHORIZED" });
return;
}

      req.user = payload as IJwtUser; //attach user data to the request
      next();
    },

);
};

import { UserModel } from "@repo/database";
import { IAuthRequest, userSensitiveFields } from "@repo/shared";
import { RequestHandler, Response } from "express";

export const verifyUserAuth: RequestHandler = async (
req: IAuthRequest,
res: Response,
) => {
const userId = req.user?.id;

if (!userId) {
res.status(401).json({
status: "ERROR",
message: "Invalid or expired token",
payload: null,
});
return;
}

try {
// findById respects the global pre('find') middleware.
// If the user is deactivated, this will return null.
const user = await UserModel.findById(userId);

    if (!user) {
      res.status(401).json({
        status: "ERROR",
        message: "User account not found or deactivated",
        payload: null,
      });
      return;
    }

    // Convert to plain object for cleaning
    const safePayload = user.toObject();

    // Use the helper to strip all internal/security fields
    userSensitiveFields().forEach((field) => {
      delete (safePayload as any)[field];
    });

    // Success response
    res.status(200).json({
      status: "SUCCESS",
      message: "Session is valid",
      payload: safePayload,
    });
    return;

} catch (error: any) {
res.status(500).json({
status: "ERROR",
message: error.message || "Server error during session check",
payload: null,
});
return;
}
};

import mongoose, { PipelineStage } from "mongoose";

interface AggregatorOptions {
userId?: string;
postType: "GIST" | "STAKE";
}

export const getPostAggregation = ({
userId,
postType,
}: AggregatorOptions): PipelineStage[] => {
const userObjectId = userId
? new mongoose.Types.ObjectId(String(userId))
: null;

const likesCollection = postType === "GIST" ? "gist_likes" : "stake_likes";
const likeIdField = postType === "GIST" ? "gistId" : "stakeId";

return [
// 1. Author Details
{
$lookup: {
        from: "users",
        localField: "authorId",
        foreignField: "_id",
        as: "authorDetails",
      },
    },
    { $unwind: "$authorDetails" },

    // 2. Media
    {
      $lookup: {
        from: "media",
        localField: "_id",
        foreignField: "sourceId",
        as: "media",
      },
    },

    // 3. Check if likedByMe
    {
      $lookup: {
        from: likesCollection,
        let: { currentId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: [`$${likeIdField}`, "$$currentId"] },
                  { $eq: ["$userId", userObjectId] },
                ],
              },
            },
          },
        ],
        as: "myLike",
      },
    },

    // --- NEW: Social Relationship Lookups ---

    // 4. Does the viewer follow the author?
    {
      $lookup: {
        from: "follows",
        let: { authorId: "$authorId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$followerId", userObjectId] },
                  { $eq: ["$followingId", "$$authorId"] },
                ],
              },
            },
          },
        ],
        as: "followDoc",
      },
    },

    // 5. Does the author follow the viewer?
    {
      $lookup: {
        from: "follows",
        let: { authorId: "$authorId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$followerId", "$$authorId"] },
                  { $eq: ["$followingId", userObjectId] },
                ],
              },
            },
          },
        ],
        as: "followerDoc",
      },
    },

    // 6. Final Projection
    {
      $project: {
        _id: 1,
        authorId: 1,
        postType: { $literal: postType },
        media: 1,
        likeCount: 1,
        commentCount: 1,
        createdAt: 1,
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
          // Relational Booleans attached to author object
          isFollowing: { $gt: [{ $size: "$followDoc" }, 0] },
          followsMe: { $gt: [{ $size: "$followerDoc" }, 0] },
        },

        // --- Gist Specific Fields ---
        ...(postType === "GIST"
          ? {
              content: "$latestContent.content",
              contentId: "$latestContent.contentId",
              updatedAt: "$latestContent.createdAt",
              editCount: 1,
              isEdited: { $gt: ["$editCount", 0] },
            }
          : {}),

        // --- Stake Specific Fields ---
        ...(postType === "STAKE"
          ? {
              amount: 1,
              odds: 1,
              selection: 1,
              market: 1,
              outcome: 1,
              isPublic: 1,
            }
          : {}),
      },
    },

] as PipelineStage[];
};

const proxyOptions: Options = {
changeOrigin: true,
proxyTimeout: 60000,
timeout: 60000,
on: {
proxyReq: (proxyReq, req, res) => {
// Logic to run before request is sent
},
error: (err: any, req, res) => {
console.error(`[Proxy Error]: ${err.message}`);
(res as any).status(502).json({
error: "Bad Gateway",
debug_code: err.code,
message:
"The service is currently waking up or unavailable. Please retry in 30 seconds.",
});
},
},
};
