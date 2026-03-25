import { PipelineStage } from "mongoose";
import {
  staticPostDecorator,
  dynamicPostDecorator,
} from "../decorators/postDecorator";

// Static post data
export const getPostStaticData = (): PipelineStage[] => {
  return [
    // 1. Add Static Lookups (Author, Media)
    ...staticPostDecorator(),

    // 2. Format the Structural Data
    {
      $project: {
        _id: 1,
        authorId: 1,
        postType: 1,
        media: 1,
        likeCount: { $ifNull: ["$likeCount", 0] },
        commentCount: { $ifNull: ["$commentCount", 0] },
        createdAt: 1,

        author: {
          _id: "$authorDetails._id",
          username: "$authorDetails.username",
          firstName: "$authorDetails.firstName",
          lastName: "$authorDetails.lastName",
          profileImage: "$authorDetails.profileImage",
          fullName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$authorDetails.firstName", ""] },
                  " ",
                  { $ifNull: ["$authorDetails.lastName", ""] },
                ],
              },
            },
          },
        },

        // Merge Gist vs Stake fields
        details: {
          $cond: [
            { $eq: ["$postType", "GIST"] },
            {
              content: "$latestContent.content",
              contentId: "$latestContent.contentId",
              updatedAt: "$latestContent.createdAt",
              isEdited: { $gt: [{ $ifNull: ["$editCount", 0] }, 0] },
            },
            {
              amount: "$amount",
              odds: "$odds",
              selection: "$selection",
              market: "$market",
              outcome: "$outcome",
              isPublic: "$isPublic",
            },
          ],
        },
      },
    },
    { $replaceRoot: { newRoot: { $mergeObjects: ["$details", "$$ROOT"] } } },
    { $project: { details: 0 } },
  ] as PipelineStage[];
};

// Dynamic Post data
export const getPostSocialData = ({
  userId,
}: {
  userId: string;
}): PipelineStage[] => {
  return [
    ...dynamicPostDecorator({ userId }),
    {
      $project: {
        likedByMe: {
          $gt: [
            {
              $size: {
                $setUnion: [
                  { $ifNull: ["$gistLikeDoc", []] },
                  { $ifNull: ["$stakeLikeDoc", []] },
                ],
              },
            },
            0,
          ],
        },
        isFollowing: { $gt: [{ $size: { $ifNull: ["$followDoc", []] } }, 0] },
        followsMe: { $gt: [{ $size: { $ifNull: ["$followerDoc", []] } }, 0] },
      },
    },
  ];
};
