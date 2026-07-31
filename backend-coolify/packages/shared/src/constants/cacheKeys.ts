import { PostType } from "../types";

/**
 * Cache Key Registry
 * Centralizes all key patterns for the Funstakes ecosystem.
 */
export const CACHE_KEYS = {
  // --- Session & Security ---
  USER_SESSION: (userId: string, sessionId: string) =>
    `session:${userId}:${sessionId}`,
  USER_PRIMARY_DEVICE: (userId: string) => `user:${userId}:primary_device_id`,
  WILDCARD_USER_SESSIONS: (userId: string) => `session:${userId}:*`,
  DEVICE_TRUST_STATUS: (userId: string, deviceId: string) =>
    `trust_check:${userId}:${deviceId}`,

  // --- Feed Keys (Dynamic/Personalized) ---
  USER_FOLLOWERS_FEED: (userId: string, page: number, limit: number) =>
    `user:${userId}:feed:followers:p${page}:l${limit}`,
  USER_PROFILE_FEED: (userId: string, page: number, limit: number) =>
    `user:${userId}:feed:profile:p${page}:l${limit}`,

  // --- Static/Global Feeds ---
  GLOBAL_FEED: (page: number, limit: number) =>
    `feed:all:static:p${page}:l${limit}`,
  POST_FEED_TYPE: (postType: PostType, page: number, limit: number) =>
    `feed:${postType.toLowerCase()}s:static:p${page}:l${limit}`,

  // --- Entity Keys ---
  POST: (postType: PostType, postId: string) =>
    `post:${postType.toLowerCase()}:${postId}`,

  POST_TRANSLATION: (postId: string, targetLang: string) =>
    `post:translation:${postId}:${targetLang}`,

  // --- Taxonomy & Search Discovery ---
  TOPICS_LOOKUP: (
    keyword: string,
    excludedHash: string,
    page: number,
    limit: number,
  ) =>
    `topics:lookup:k:${keyword || "none"}:ex:${excludedHash || "none"}:p${page}:l${limit}`,

  // --- Social & Identity (O(1) lookups) ---
  USER_BASE: (userId: string) => `user:${userId}`,
  USER_PROFILE: (userId: string) => `user:${userId}:profile`,
  USER_FOLLOWING: (userId: string) => `user:${userId}:following`,
  USER_FOLLOWERS: (userId: string, page: number, limit: number) =>
    `user:${userId}:followers:${userId}:p:${page}:l:${limit}`,
  USER_BLOCKINGS: (userId: string) => `user:${userId}:blockings`, // List of users blocked by this user
  USER_BLOCKERS: (userId: string) => `user:${userId}:blockers`, // List of users that has blocked this user

  USER_PREFERENCES: (userId: string) => `user:${userId}:prefs`,

  // --- Invalidation Patterns (Wildcards) ---
  // Wipes all global first pages (Gists, Stakes, All)
  GLOBAL_FEED_PAGE_ONE: "feed:*:static:p1:*",
  // Wipes every paginated feed chunk authored or viewed by the user
  WILDCARD_USER_FEED_ALL: (userId: string) => `user:${userId}:feed:*`,
  // The complete account wipe pattern
  WILDCARD_USER_ALL: (userId: string) => `user:${userId}:*`,
  WILDCARD_POST_FEED_TYPE: (postType: PostType) =>
    `feed:${postType.toLowerCase()}:*`,
};

/**
 * Standard expiration duration constants in seconds.
 */
export const CACHE_EXPIRY = {
  MIN_3: 60 * 5, // 5 minutes
  HOUR_1: 60 * 60, // 1 hour
  HOUR_24: 60 * 60 * 24, // 24 hours
  DAY_7: 7 * 24 * 60 * 60, // 7 days
  DAY_20: 20 * 24 * 60 * 60, // 20 days
};
