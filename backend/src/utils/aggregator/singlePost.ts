import mongoose, { PipelineStage } from "mongoose";

interface AggregatorOptions {
  userId?: string;
  sourceType: "GIST" | "STAKE";
}

export const getPostAggregation = ({
  userId,
  sourceType,
}: AggregatorOptions): PipelineStage[] => {
  // Ensure we handle the string to ObjectId conversion correctly
  const userObjectId = userId
    ? new mongoose.Types.ObjectId(String(userId))
    : null;

  // Dynamic configuration based on type (Mapping the uppercase type to collection names)
  const likesCollection = sourceType === "GIST" ? "gist_likes" : "stake_likes";
  const likeIdField = sourceType === "GIST" ? "gistId" : "stakeId";

  return [
    // 1. Common JOIN: Author Details
    {
      $lookup: {
        from: "users",
        localField: "authorId",
        foreignField: "_id",
        as: "authorDetails",
      },
    },
    { $unwind: "$authorDetails" },

    // 2. Common JOIN: Media (Linked via sourceId)
    {
      $lookup: {
        from: "media",
        localField: "_id",
        foreignField: "sourceId",
        as: "media",
      },
    },

    // 3. Common JOIN: Check if likedByMe
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

    // 4. Dynamic Projection: Merging Common + Unique Fields
    {
      $project: {
        // --- Common Fields ---
        _id: 1,
        authorId: 1,
        // Now returns "GIST" or "STAKE" to the frontend
        postType: { $literal: sourceType },
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
        },

        // --- Gist Specific Fields ---
        ...(sourceType === "GIST"
          ? {
              content: "$latestContent.content",
              contentId: "$latestContent.contentId",
              updatedAt: "$latestContent.createdAt",
              editCount: 1,
              isEdited: { $gt: ["$editCount", 0] },
            }
          : {}),

        // --- Stake Specific Fields ---
        ...(sourceType === "STAKE"
          ? {
              amount: 1,
              odds: 1,
              selection: 1,
              market: 1,
              outcome: 1, // WIN/LOSS/PENDING
              isPublic: 1,
            }
          : {}),
      },
    },
  ] as PipelineStage[];
};
