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
    // 1. Lookup: Does the viewer follow this user? (isFollowing logic)
    {
      $lookup: {
        from: "follows",
        let: { tId: "$_id" },
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

    // 2. Lookup: Does this user follow the viewer? (followsMe logic)
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

    // 3. Project and Format
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
