"use client"

import { useTheme } from "@mui/material/styles";
import { Stack } from "@mui/material";
import { sharedRegistry, useGlobalContext } from "@funstakes/shared-state";
import { useEffect, useState } from "react";
import { PersonOffSharp } from "@mui/icons-material";
import { FollowerCard } from "../components/FollowerCard";
import { delay } from "@funstakes/helpers";
import { ProgressIcon, Empty } from "@funstakes/shared-ui";

export const Followers = () => {
  const theme = useTheme();
  const { authUser } = useGlobalContext();
  const [followersId, setFollowersId] = useState<any[]>();
  const [message, setMessage] = useState<string | null>(null);
  const useUser = sharedRegistry.hooks["useUser"];
  const { getFollowers } = useUser();
  const [isLoading, setLoading] = useState(false);

  const renderFollowers = async () => {
    if (!authUser) return null;
    try {
      setLoading(true);
      await delay();

      const idRes = await getFollowers(authUser._id);

      if (idRes.payload) {
        setFollowersId(idRes.payload);
        setMessage(idRes.message);
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authUser?._id) renderFollowers();
  }, [authUser?._id]);

  return (
    <>
      {isLoading ? (
        <Stack
          sx={{
            padding: theme.boxSpacing(12, 4),
            alignItems: "center",
          }}>
          <ProgressIcon otherProps={{ size: 30 }} />
        </Stack>
      ) : authUser && followersId && followersId.length < 1 ? (
        <Empty tagline="You don't have followers!" icon={<PersonOffSharp />} />
      ) : followersId && followersId.length > 0 ? (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            gap: "unset",
            height: "fit-content",
            padding: theme.boxSpacing(0),
          }}>
          {followersId.map((idObject) => {
            return (
              <FollowerCard key={idObject._id} followerId={idObject._id} />
            );
          })}
        </Stack>
      ) : (
        <Empty
          tagline={message || "Something went wrong."}
          icon={<PersonOffSharp />}
        />
      )}
    </>
  );
};
