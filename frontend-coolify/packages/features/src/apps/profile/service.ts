"use client";

import { apiClient, checkNetworkError } from "@repo/helpers";
import { IUser, IListPayload, ISinglePayload, SERVER_API } from "@repo/core";
import { useCallback } from "react";

export interface FollowResponse extends IUser {
  isFollowing: boolean;
  followsMe: boolean;
  fullName: string;
}

interface FollowPayload {
  currentUser: IUser;
  targetUser: FollowResponse;
}

export const UserService = () => {
  const fetchUser = useCallback(
    async (userId: string): Promise<ISinglePayload<IUser>> => {
      try {
        const res = await apiClient<ISinglePayload<IUser>>(
          SERVER_API.getUser(userId),
          { method: "GET" },
        );
        return {
          payload: res.payload ?? null,
          message: res.message,
          status: "SUCCESS",
        };
      } catch (error: any) {
        return (
          checkNetworkError(error) || {
            payload: null,
            message: error.message ?? "Something went wrong",
            status: "ERROR",
          }
        );
      }
    },
    [],
  );

  const fetchFollowers = useCallback(
    async (userId: string): Promise<IListPayload<IUser>> => {
      try {
        const res = await apiClient<IListPayload<IUser>>(
          SERVER_API.followers(userId),
          { method: "GET" },
        );
        return {
          payload: res.payload ?? [],
          message: res.message,
          status: "SUCCESS",
        };
      } catch (error: any) {
        return (
          checkNetworkError(error) || {
            payload: null,
            message: error.message ?? "Something went wrong",
            status: "ERROR",
          }
        );
      }
    },
    [],
  );

  const followUser = useCallback(
    async (userId: string): Promise<ISinglePayload<FollowPayload>> => {
      try {
        const res = await apiClient<ISinglePayload<FollowPayload>>(
          SERVER_API.follow(userId),
          { method: "PUT" },
        );
        return {
          payload: res.payload ?? null,
          message: res.message,
          status: "SUCCESS",
        };
      } catch (error: any) {
        return (
          checkNetworkError(error) || {
            payload: null,
            message: error.message ?? "Something went wrong",
            status: "ERROR",
          }
        );
      }
    },
    [],
  );

  return { fetchUser, fetchFollowers, followUser };
};
