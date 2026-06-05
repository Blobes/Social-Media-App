"use client";

import { PostType } from "../types/payloads/post";
import { KeyType } from "../types/ui-props";

export const QUEUE_KEYS = {
  [KeyType.POST]: {
    LIKE: "post_like",
    PENDING_LIKES: "pending_post_likes",
    POST_BOOKMARK: "pending_bookmarks",
  },
  [KeyType.USER]: {
    USER_FOLLOW: "pending_follows",
  },
  MEDIA_UPLOAD: "media-upload-progress",
  MEDIA_COMPRESSION: "media-compression-progress",
};

export const STORAGE_KEYS = {
  POST_DRAFT: (postId: string, type: PostType) =>
    `draft:${type.toLowerCase()}:${postId}`,
};

export const CACHE_KEYS = {
  [KeyType.POST]: {
    GISTS: "gists",
    STAKES: "stakes",
    FEED: "gists",
    SEEN: "seen",
    LOOKUP_TOPICS: "lookup_topics",
  },
  [KeyType.USER]: {
    SESSION: "auth_sessions",
    TARGET: "user",
    FOLLOWERS: "followers",
  },
  OFFLINE_CACHE: "offline_cache",
  LOGIN_TRANSIT_DATA: ["transit_data", "login"],
  ONBOARDING_TRANSIT_DATA: ["transit_data", "onboarding"],
  ACCOUNT_UPDATE_TRANSIT_DATA: ["transit_data", "account_update"],
  CACHE_PAGE: "cache_page",
};
