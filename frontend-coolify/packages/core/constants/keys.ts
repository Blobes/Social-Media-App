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
};

export const CACHE_KEYS = {
  [KeyType.POST]: {
    GISTS: "gists",
    STAKES: "stakes",
    FEED: "gists",
    SEEN: "seen",
  },
  [KeyType.USER]: {
    SESSION: "auth_sessions",
    TARGET: "user",
    FOLLOWERS: "followers",
  },
  OFFLINE_CACHE: "offline_cache",
  LOGIN_TRANSIT_DATA: ["transit_data", "login"],
  ACCOUNT_UPDATE_TRANSIT_DATA: ["transit_data", "account_update"],
  CACHE_PAGE: "cache_page",
};
