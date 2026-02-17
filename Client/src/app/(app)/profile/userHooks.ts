"use client";

import { fetcher, checkNetworkError } from "@/helpers/fetcher";
import { serverApi } from "@/helpers/routes";
import { useSnackbar } from "@/hooks/snackbar";
import { IUser, IListResponse, ISingleResponse } from "@/types";

export const useUser = () => {
  const { setSBMessage } = useSnackbar();

  const getUser = async (
    userId: string,
  ): Promise<{
    payload: IUser | null;
    message: string;
  }> => {
    try {
      const res = await fetcher<ISingleResponse<IUser>>(
        serverApi.user(userId),
        {
          method: "GET",
        },
      );
      return { payload: res.payload ?? null, message: res.message };
    } catch (error: any) {
      const networkError = checkNetworkError(error);
      if (networkError) return networkError;
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
      const res = await fetcher<IListResponse<any>>(
        serverApi.followers(userId),
        {
          method: "GET",
        },
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
      const res = await fetcher<FollowResponse>(serverApi.follow(userId), {
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
      const networkError = checkNetworkError(error);
      if (networkError) {
        setSBMessage({
          msg: {
            content: networkError.message,
            duration: 2,
            msgStatus: "ERROR",
          },
        });
        return networkError;
      }

      return {
        payload: null,
        message: error.message ?? "Something went wrong",
      };
    }
  };

  return { handleFollow, getFollowers, getUser };
};
