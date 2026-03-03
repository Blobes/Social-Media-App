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
