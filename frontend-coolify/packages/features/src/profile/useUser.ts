"use client";

import { useCallback, useState } from "react";
import { useGlobalContext, useSnackbar } from "@repo/shared-state";
import { FollowResponse, UserService } from "./service";
import { IUser } from "@repo/types";
import { delay } from "@repo/helpers";

export const useUser = () => {
  const { fetchUser, fetchFollowers, followUser } = UserService();
  const { setSBMessage } = useSnackbar();
  const { setAuthUser } = useGlobalContext();

  const [updatedUser, setUpdatedUser] = useState<FollowResponse>();
  const [isLoading, setLoading] = useState(false);
  const [followers, setFollowers] = useState<IUser[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const getUser = useCallback(
    async (userId: string) => {
      return await fetchUser(userId);
    },
    [fetchUser],
  );

  const getFollowers = useCallback(
    async (userId: string) => {
      if (!userId) return;
      try {
        setLoading(true);
        setMessage(null);

        const res = await fetchFollowers(userId);

        if (res.status === "SUCCESS" && res.payload) {
          setFollowers(res.payload);
          setMessage(res.message);
        } else {
          setMessage(res.message || "Failed to load followers");
        }
        return res;
      } catch (error: any) {
        setMessage(error.message || "Something went wrong.");
      } finally {
        await delay();
        setLoading(false);
      }
    },
    [fetchFollowers],
  );

  const handleFollow = useCallback(
    async (initialUser: IUser) => {
      if (isLoading) return;
      setLoading(true);
      try {
        const res = await followUser(initialUser._id);
        setSBMessage({
          msg: {
            content: res.message,
            msgStatus: res.status,
          },
        });

        if (res.status === "SUCCESS" && res.payload) {
          setAuthUser(res.payload.currentUser);
          setUpdatedUser(res.payload.targetUser);
        }
        return res;
      } finally {
        setLoading(false);
      }
    },
    [followUser, isLoading, setSBMessage, setAuthUser],
  );

  return {
    handleFollow,
    getFollowers,
    getUser,
    updatedUser,
    isLoading,
    followers,
    message,
  };
};
