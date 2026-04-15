/**
 * Merges cached static post data with fresh social/metric data from the DB.
 */
export const hydrateSocialState = (
  staticPosts: any[],
  socialMap: Map<string, any>,
) => {
  return staticPosts.map((post: any) => {
    const postIdStr = String(post._id);
    const social = socialMap.get(postIdStr);

    // Ensure we handle Mongoose documents or plain JSON objects
    const postObj = post.toObject ? post.toObject() : post;

    return {
      ...postObj,
      // Fresh metrics from DB (Social Map) or fallback to Stale metrics (Cache)
      likeCount: social ? social.likeCount : (postObj.likeCount ?? 0),
      commentCount: social ? social.commentCount : (postObj.commentCount ?? 0),
      viewCount: social ? social.viewCount : (postObj.viewCount ?? 0),
      shareCount: social ? social.shareCount : (postObj.shareCount ?? 0),

      // User-specific relation flags
      likedByMe: social?.likedByMe ?? false,

      author: {
        ...(postObj.author || {}),
        isFollowing: social?.isFollowing ?? false,
        followsMe: social?.followsMe ?? false,
      },
    };
  });
};
