import { PipelineStage } from "mongoose";
import {
  staticPostDecorator,
  dynamicPostDecorator,
} from "../decorators/postDecorator";

/**
 * Generates the full static data pipeline for Posts (Gists & Stakes).
 * Optimized for React frontend consumption with flattened details.
 */
export const getPostStaticData = (): PipelineStage[] => {
  return [
    // Join with Users and Media collections
    ...staticPostDecorator(),

    // Structural Formatting & Author Normalization
    {
      $project: {
        _id: 1,
        authorId: 1,
        postType: 1,
        createdAt: 1,
        media: { $ifNull: ["$media", []] },
        likeCount: { $ifNull: ["$likeCount", 0] },
        commentCount: { $ifNull: ["$commentCount", 0] },
        shareCount: { $ifNull: ["$shareCount", 0] },
        viewCount: { $ifNull: ["$viewCount", 0] },
        topics: { $ifNull: ["$topics", []] },
        visibility: "$visibility",
        location: "$location",

        // Constructing Author object
        author: {
          _id: { $ifNull: ["$authorDetails._id", "$authorId"] },
          username: { $ifNull: ["$authorDetails.username", "user"] },
          firstName: { $ifNull: ["$authorDetails.firstName", ""] },
          lastName: { $ifNull: ["$authorDetails.lastName", ""] },
          profileImage: { $ifNull: ["$authorDetails.profileImage", null] },
          fullName: {
            $let: {
              vars: {
                f: { $ifNull: ["$authorDetails.firstName", ""] },
                l: { $ifNull: ["$authorDetails.lastName", ""] },
                u: { $ifNull: ["$authorDetails.username", "User"] },
              },
              in: {
                $let: {
                  vars: {
                    combined: {
                      $trim: { input: { $concat: ["$$f", " ", "$$l"] } },
                    },
                  },
                  in: {
                    $cond: [{ $eq: ["$$combined", ""] }, "$$u", "$$combined"],
                  },
                },
              },
            },
          },
        },
        // Conditional logic to flatten unique fields based on postType
        details: {
          $cond: [
            { $eq: ["$postType", "GIST"] },
            {
              // Mapping to Gist Schema (latestCaption)
              latestCaption: {
                caption: { $ifNull: ["$latestCaption.caption", ""] },
                captionId: { $ifNull: ["$latestCaption.captionId", "$_id"] },
                updatedAt: {
                  $ifNull: ["$latestCaption.createdAt", "$createdAt"],
                },
              },
              isEdited: { $gt: [{ $ifNull: ["$editCount", 0] }, 0] },
            },
            {
              // Standard Stake structure
              amount: { $ifNull: ["$amount", 0] },
              odds: { $ifNull: ["$odds", 1.0] },
              selection: { $ifNull: ["$selection", ""] },
              market: { $ifNull: ["$market", ""] },
              outcome: { $ifNull: ["$outcome", "PENDING"] },
            },
          ],
        },
      },
    },

    //  Flattening: We move everything inside 'details' to the top level for cleaner frontend access
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ["$$ROOT", "$details"],
        },
      },
    },

    // Final Cleanup: Remove the temporary details object
    {
      $project: {
        details: 0,
      },
    },
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
        likeCount: { $ifNull: ["$likeCount", 0] },
        commentCount: { $ifNull: ["$commentCount", 0] },
        shareCount: { $ifNull: ["$shareCount", 0] },
        viewCount: { $ifNull: ["$viewCount", 0] },

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
