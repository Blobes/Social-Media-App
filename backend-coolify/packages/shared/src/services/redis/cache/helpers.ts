import {
  PermissionModel,
  PermissionName,
  RoleModel,
  RoleName,
  RolePermissionModel,
} from "@repo/database";
import { CacheService } from "./service";
import Redis from "ioredis";
import { CACHE_EXPIRY, CACHE_KEYS } from "../../../constants/cacheKeys";

export const initCacheClient = async (redisUrl?: string): Promise<Redis> => {
  const client = CacheService.getClient(redisUrl);
  try {
    const status = await client.ping();
    console.log(`✅ Redis cache connected: ${status}`);
  } catch (err: unknown) {
    console.error("⚠️ Redis cache connectivity check failed:", err);
  }
  return client;
};

/**
 * Direct fetch wrapper from Redis.
 */
export const getCache = <T = unknown>(key: string): Promise<T | null> =>
  CacheService.get<T>(key);

/**
 * Direct set wrapper for Redis.
 */
export const setCache = <T = unknown>(
  key: string,
  value: T,
  expiryInSeconds = CACHE_EXPIRY.HOUR_1,
): Promise<void> => CacheService.set(key, value, expiryInSeconds);

/**
 * High-performance wrapper for cached data requests.
 */
export const getOrSetCache = <T>(
  key: string,
  cb: () => Promise<T>,
  expiryInSeconds = CACHE_EXPIRY.MIN_5,
): Promise<T> => CacheService.getOrSet(key, cb, expiryInSeconds);

/**
 * Optimized for Sets (Block lists, Muted users).
 */
export const getOrSetCacheSet = (
  key: string,
  cb: () => Promise<string[]>,
  expiryInSeconds = CACHE_EXPIRY.HOUR_24,
): Promise<string[]> => CacheService.getOrSetSet(key, cb, expiryInSeconds);

/**
 * Invalidates a single key.
 */
export const invalidateCache = (key: string): Promise<void> =>
  CacheService.invalidate(key);

/**
 * Invalidates keys matching a specific string pattern.
 */
export const invalidatePattern = (pattern: string): Promise<void> =>
  CacheService.invalidatePattern(pattern);

/**
 * Atomic set update handlers.
 */
export const atomicCacheSetUpdate = {
  add: (key: string, value: string) => CacheService.setAdd(key, value),
  remove: (key: string, value: string) => CacheService.setRemove(key, value),
};

/**
 * Checks if a key exists in Redis cache.
 */
export const existsInCache = (key: string): Promise<boolean> =>
  CacheService.exists(key);

/**
 * Deletes one or more keys from Redis cache.
 */
export const deleteCache = (keys: string | string[]): Promise<number> =>
  CacheService.del(keys);

/**
 * Scans keys matching a specific pattern using cursor-based iteration.
 */
export const scanCache = (
  cursor: string,
  pattern: string,
  count = 100,
): Promise<[string, string[]]> => CacheService.scan(cursor, pattern, count);

/**
 * Executes a batch GET pipeline for multiple keys.
 */
export const pipelineGetCache = <T = unknown>(
  keys: string[],
): Promise<(T | null)[]> => CacheService.pipelineGet<T>(keys);

/**
 * Stores pre-scored candidate items in a Redis Sorted Set.
 */
export const setCacheSortedSet = (
  key: string,
  items: Array<{ member: string; score: number }>,
  expiryInSeconds = CACHE_EXPIRY.MIN_20,
): Promise<void> => CacheService.zaddMany(key, items, expiryInSeconds);

/**
 * Retrieves paginated items from a Redis Sorted Set ordered by highest score first.
 */
export const getCacheSortedSet = (
  key: string,
  start: number,
  stop: number,
): Promise<string[]> => CacheService.zrevrange(key, start, stop);

/**
 * Evaluates sliding window rate limits using Redis pipelines.
 */
export const checkSlidingWindow = (
  identifier: string,
  limit: number,
  windowSeconds = 60,
): Promise<{ isAllowed: boolean; currentUsage: number }> =>
  CacheService.checkSlidingWindow(identifier, limit, windowSeconds);

/**
 * Fetches permissions for given roles using read-aside Redis caching.
 */
export const getCachedPermissionsForRoles = async (
  roles: RoleName[],
): Promise<Set<PermissionName>> => {
  if (!roles || roles.length === 0) {
    return new Set<PermissionName>();
  }

  const sortedRoles = [...roles].sort();
  const cacheKey = CACHE_KEYS.ROLE_PERMISSIONS(sortedRoles);

  const cachedPermissions = await getCache<PermissionName[]>(cacheKey);
  if (cachedPermissions) {
    return new Set<PermissionName>(cachedPermissions);
  }

  const roleDocs = await RoleModel.find({ name: { $in: roles } }).lean();
  const roleIds = roleDocs.map((r) => r._id);

  const rolePermissions = await RolePermissionModel.find({
    roleId: { $in: roleIds },
  }).lean();

  const permissionIds = rolePermissions.map((rp) => rp.permissionId);
  const permissions = await PermissionModel.find({
    _id: { $in: permissionIds },
  }).lean();

  const permissionNames = permissions.map((p) => p.name as PermissionName);

  await setCache(cacheKey, permissionNames, CACHE_EXPIRY.HOUR_1 || 3600);

  return new Set<PermissionName>(permissionNames);
};
