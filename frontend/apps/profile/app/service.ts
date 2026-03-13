import { fetcher, checkNetworkError, serverApi } from "@repo/helpers";
import { IUser, IListResponse, ISingleResponse } from "@repo/types";
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
    async (userId: string): Promise<ISingleResponse<IUser>> => {
      try {
        const res = await fetcher<ISingleResponse<IUser>>(
          serverApi.getUser(userId),
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
    async (userId: string): Promise<IListResponse<IUser>> => {
      try {
        const res = await fetcher<IListResponse<IUser>>(
          serverApi.followers(userId),
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
    async (userId: string): Promise<ISingleResponse<FollowPayload>> => {
      try {
        const res = await fetcher<ISingleResponse<FollowPayload>>(
          serverApi.follow(userId),
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
