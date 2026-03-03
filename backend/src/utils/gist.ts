import mongoose from "mongoose";

/**
 * Shared Pipeline Stages for Gist Aggregation
 * @param userId - The ID of the user requesting the data (to check likedByMe)
 */
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
