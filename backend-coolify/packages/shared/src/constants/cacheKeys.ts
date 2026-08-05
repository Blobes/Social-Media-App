import { PostType } from "../types";

/**
 * Cache Key Registry
 * Centralizes all key patterns for the Funstakes ecosystem.
 */
export const CACHE_KEYS = {
  // --- Session & Security ---
  USER_SESSION: (userId: string, sessionId: string) =>
    `user:${userId}:session:${sessionId}`,
  USER_PRIMARY_DEVICE: (userId: string) => `user:${userId}:primary_device_id`,
  DEVICE_TRUST_STATUS: (userId: string, deviceId: string) =>
    `user:${userId}:trust_check:${deviceId}`,

  // --- Feed Keys (Dynamic/Personalized) ---
  USER_FOLLOWERS_FEED: (userId: string) => `user:${userId}:feed:followers`,
  USER_PROFILE_FEED: (userId: string) => `user:${userId}:feed:profile`,
  USER_FEED: (userId: string) => `user:${userId}:feed`,

  // --- Static/Global Feeds ---
  GLOBAL_FEED: (page: number, limit: number) =>
    `feed:all:static:p${page}:l${limit}`,
  POST_FEED_TYPE: (postType: PostType, page: number, limit: number) =>
    `feed:${postType.toLowerCase()}s:static:p${page}:l${limit}`,

  // --- Entity Keys ---
  GIST_FEED: (userId?: string) =>
    userId ? `user:${userId}:feed:gist` : `feed:global:gist`,
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
  USER_BLOCKINGS: (userId: string) => `user:${userId}:blockings`,
  USER_BLOCKERS: (userId: string) => `user:${userId}:blockers`,
  USER_PREFERENCES: (userId: string) => `user:${userId}:preferences`,

  // --- Invalidation Patterns (Wildcards) ---
  WILDCARD_GLOBAL_FEED_PAGE_ONE: "feed:*:static:p1:*",
  WILDCARD_USER_FEED_ALL: (userId: string) => `user:${userId}:feed:*`,
  WILDCARD_USER_ALL: (userId: string) => `user:${userId}:*`,
  WILDCARD_FOLLOWERS_ALL: (userId: string) => `user:${userId}:followers:*`,
  WILDCARD_POST_FEED_TYPE: (postType: PostType) =>
    `feed:${postType.toLowerCase()}:*`,
  WILDCARD_USER_SESSIONS: (userId: string) => `user:${userId}:session:*`,
  WILDCARD_DEVICES: (userId: string) => `user:${userId}:trust_check:*`,
  WILDCARD_POST_TRANSLATIONS: (postId: string) =>
    `post:translation:${postId}:*`,
  WILDCARD_TOPICS_LOOKUP: "topics:lookup:*",
} as const;

/**
 * Standard expiration duration constants in seconds.
 */
export const CACHE_EXPIRY = {
  MIN_5: 5 * 60, // 5 minutes
  MIN_20: 20 * 60, // 20 minutes
  HOUR_1: 60 * 60, // 1 hour
  HOUR_24: 24 * 60 * 60, // 24 hours
  DAY_7: 7 * 24 * 60 * 60, // 7 days
  DAY_20: 20 * 24 * 60 * 60, // 20 days
};
