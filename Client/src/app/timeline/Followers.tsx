import { useTheme } from "@mui/material/styles";
import { CircularProgress, Stack, Typography } from "@mui/material";
import { useAppContext } from "../AppContext";
import { useUser } from "../user/userHooks";
import React, { useEffect, useState } from "react";
import { HourglassEmptyOutlined } from "@mui/icons-material";
import { FollowerCard } from "./Cards";

export const Followers = () => {
  const theme = useTheme();
  const { authUser } = useAppContext();
  const [followersId, setFollowersId] = useState<any[]>();
  const [message, setMessage] = useState<string | null>(null);
  const { getFollowers } = useUser();

  const renderFollowers = async () => {
    if (!authUser) return null;
    try {
      const idRes = await getFollowers(authUser._id);
      if (idRes.payload) {
        setFollowersId(idRes.payload);
        setMessage(idRes.message);
      }
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    if (authUser) renderFollowers();
  }, [authUser]);

  return (
    <>
      {!authUser ? (
        <CircularProgress size={40} />
      ) : followersId && followersId.length < 1 ? (
        <Stack>
          <HourglassEmptyOutlined
            sx={{ transform: "scale(1.5)", stroke: theme.palette.gray[200] }}
          />
          <Typography variant="h6" component={"h6"}>
            You don't have followers!
          </Typography>
        </Stack>
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
        <Stack>
          <HourglassEmptyOutlined
            sx={{ transform: "scale(1.5)", stroke: theme.palette.gray[200] }}
          />
          <Typography variant="h6" component={"h6"}>
            {message}
          </Typography>
        </Stack>
      )}
    </>
  );
};
