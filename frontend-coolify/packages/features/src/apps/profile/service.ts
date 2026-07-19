"use client";

import { apiClient } from "@repo/helpers";
import { IUser, IListPayload, ISinglePayload, SERVER_API } from "@repo/core";
import { useCallback } from "react";

export interface FollowResponse extends IUser {
  isFollowing: boolean;
  followsMe: boolean;
  fullName: string;
}

export interface FollowPayload {
  currentUser: IUser;
  targetUser: FollowResponse;
}

export const UserService = () => {
  // Fetches a specific user profile profile record.
  const fetchUser = useCallback(
    async (userId: string): Promise<ISinglePayload<IUser>> => {
      return await apiClient<ISinglePayload<IUser>>(
        SERVER_API.getUser(userId),
        { method: "GET" },
      );
    },
    [],
  );

  // Fetches a paginated roster listing all followers for a designated profile.
  const fetchFollowers = useCallback(
    async (userId: string): Promise<IListPayload<IUser>> => {
      return await apiClient<IListPayload<IUser>>(
        SERVER_API.followers(userId),
        { method: "GET" },
      );
    },
    [],
  );

  // Dispatches an interaction request event toggling the connection index state of a specific member account.
  const followUser = useCallback(
    async (userId: string): Promise<ISinglePayload<FollowPayload>> => {
      return await apiClient<ISinglePayload<FollowPayload>>(
        SERVER_API.follow(userId),
        { method: "PUT" },
      );
    },
    [],
  );

  return { fetchUser, fetchFollowers, followUser };
};
