"use client";

import { fetcher } from "@/helpers/fetcher";
import { useSharedHooks } from "@/hooks";
import { IUser, ListResponse, SingleResponse } from "@/types";

export const useUser = () => {
  const { setSBMessage } = useSharedHooks();

  const getUser = async (
    userId: string
  ): Promise<{
    payload: IUser | null;
    message: string;
  }> => {
    try {
      const res = await fetcher<SingleResponse<IUser>>(`/users/${userId}`, {
        method: "GET",
      });
      return { payload: res.payload ?? null, message: res.message };
    } catch (error: any) {
      return {
        payload: null,
        message: error.message ?? "Something went wrong",
      };
    }
  };

  interface Followers {
    payload: any[] | null;
    message: string;
  }
  const getFollowers = async (userId: string): Promise<Followers> => {
    try {
      const res = await fetcher<ListResponse<any>>(
        `/users/${userId}/followers`,
        { method: "GET" }
      );

      return { payload: res.payload ?? null, message: res.message };
    } catch (error: any) {
      return {
        payload: null,
        message: error.message ?? "Something went wrong",
      };
    }
  };

  interface FollowResponse {
    payload: { currentUser: IUser; targetUser: IUser } | null;
    message: string;
  }
  const handleFollow = async (userId: string): Promise<FollowResponse> => {
    try {
      const res = await fetcher<FollowResponse>(`/users/${userId}/follow`, {
        method: "PUT",
      });
      setSBMessage({
        msg: {
          content: res.message,
          duration: 2,
          msgStatus: "SUCCESS",
        },
      });
      return { payload: res.payload ?? null, message: res.message };
    } catch (error: any) {
      setSBMessage({
        msg: {
          content: error.message,
          duration: 2,
          msgStatus: "ERROR",
        },
      });
      return {
        payload: null,
        message: error.message ?? "Something went wrong",
      };
    }
  };

  return { handleFollow, getFollowers, getUser };
};
