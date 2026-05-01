"use client";

import { useCallback } from "react";
import { useSnackbar, useGlobalStore } from "@repo/shared-hooks";
import { UserService } from "./service";
import { IUser, CACHE_KEYS } from "@repo/core";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Manages user data fetching, follower lists, and follow/unfollow mutations.
 */
export const useUser = (userId?: string) => {
  const { fetchUser, fetchFollowers, followUser } = UserService();
  const { setSBMessage } = useSnackbar();
  const queryClient = useQueryClient();

  // Accessing global state via selectors for stable references
  const setAuthUser = useGlobalStore((state) => state.setAuthUser);

  /**
   * Fetches specific user profile data.
   * Query is enabled only if a userId is provided.
   */
  const userQuery = useQuery({
    queryKey: [CACHE_KEYS.USER.TARGET, userId],
    queryFn: () => fetchUser(userId!),
    enabled: !!userId,
  });

  /**
   * Fetches the list of followers for a user.
   */
  const followersQuery = useQuery({
    queryKey: [CACHE_KEYS.USER.FOLLOWERS, userId],
    queryFn: async () => {
      const res = await fetchFollowers(userId!);
      if (res.status !== "SUCCESS") throw new Error(res.message);
      return res.payload || [];
    },
    enabled: !!userId,
  });

  /**
   * Mutation for following/unfollowing a user.
   * Updates global auth state and invalidates relevant queries on success.
   */
  const followMutation = useMutation({
    mutationFn: (targetId: string) => followUser(targetId),
    onSuccess: (res) => {
      setSBMessage({
        msg: {
          tagline: res.message,
          msgStatus: res.status,
        },
      });

      if (res.status === "SUCCESS" && res.payload) {
        // Update global session user
        setAuthUser(res.payload.currentUser);

        // Invalidate queries to trigger fresh data fetch across the app
        queryClient.invalidateQueries({
          queryKey: [CACHE_KEYS.USER.TARGET, res.payload.targetUser._id],
        });
        queryClient.invalidateQueries({
          queryKey: [CACHE_KEYS.USER.FOLLOWERS, res.payload.targetUser._id],
        });
      }
    },
    onError: (error: any) => {
      setSBMessage({
        msg: {
          tagline: error.message || "Failed to update follow status",
          msgStatus: "ERROR",
        },
      });
    },
  });

  /**
   * Wrapper for follow logic to maintain compatibility with existing components.
   */
  const handleFollow = useCallback(
    async (initialUser: IUser) => {
      if (!initialUser._id) return;
      return followMutation.mutateAsync(initialUser._id);
    },
    [followMutation],
  );

  return {
    // Follow Mutation
    handleFollow,
    followedUser: followMutation.data?.payload?.targetUser,

    // User Data
    userRes: userQuery.data,
    isUserLoading: userQuery.isLoading,
    userError: userQuery.error,

    // Followers Data
    followers: followersQuery.data || [],
    isFollowersLoading: followersQuery.isLoading,
    message: followersQuery.error?.message || null,

    // Aggregated loading state for backward compatibility
    isLoading:
      userQuery.isLoading ||
      followersQuery.isLoading ||
      followMutation.isPending,
  };
};
