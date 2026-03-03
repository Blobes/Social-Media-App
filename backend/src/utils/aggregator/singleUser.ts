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
    // 1. Lookup follow status relative to the viewer
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

    // 2. Project and Format: Preserve existing schema while hiding secrets
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
        // Returns true if viewer follows this user, false otherwise
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
        fullName: { $concat: ["$firstName", " ", "$lastName"] },
      },
    },
    // 3. Cleanup temporary lookup array
    { $project: { followDoc: 0 } },
  ];
};
