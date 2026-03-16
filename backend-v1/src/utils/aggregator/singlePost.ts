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
