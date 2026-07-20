import { PipelineStage } from "mongoose";

// We no longer need UserOptions or authUserId here because
// the aggregation is now "neutral" for better caching.
export const getUserStaticData = (): PipelineStage[] => {
  return [
    // Project and Format static fields
    {
      $project: {
        password: 0,
        otpCode: 0,
        otpCodeExpiresAt: 0,
        __v: 0,
      },
    },
    {
      $addFields: {
        fullName: { $concat: ["$firstName", " ", "$lastName"] },
        // We set these to false as defaults for the cached version
        isFollowing: false,
        followsMe: false,
      },
    },
  ];
};
