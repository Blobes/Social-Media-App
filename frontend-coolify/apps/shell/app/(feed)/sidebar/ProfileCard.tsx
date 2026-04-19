"use client";

import React from "react";
import { Stack, Typography, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Image from "next/image";
import { UserAvatar, AppButton } from "@repo/shared-ui";
import { summarizeNum } from "@repo/helpers";
import { img } from "@repo/assets";
import { useGlobalStore } from "@repo/shared-hooks";

export const ProfileCard = () => {
  const theme = useTheme();
  const authUser = useGlobalStore((state) => state.authUser);

  if (!authUser) return null;
  const {
    firstName,
    lastName,
    coverImage,
    email,
    followersCount,
    followingCount,
  } = authUser;
  return (
    <Stack
      sx={{
        backgroundColor: theme.fixedColors.pTrans,
        alignItems: "center",
        justifyContent: "flex-start",
        borderRadius: theme.radius[2],
        overflow: "hidden",
        height: "fit-content",
        flexShrink: 0,
        flexGrow: 0,
      }}>
      <Image
        src={coverImage || img.defaultCover}
        width={400}
        height={130}
        alt="Image cover"
        style={{ objectFit: "cover", width: "100%" }}
      />
      <UserAvatar
        userInfo={authUser}
        toolTipValue="User profile"
        style={{
          border: `3px solid ${theme.palette.gray[0]}`,
          marginTop: theme.boxSpacing(-20),
          width: "70px",
          height: "70px",
        }}
      />
      <Stack
        sx={{
          width: "100%",
          textAlign: "center",
          padding: theme.boxSpacing(0, 12, 12, 12),
          alignItems: "center",
          justifyContent: "center",
          gap: theme.gap(1),
        }}>
        <Typography
          variant="subtitle1"
          noWrap={true}>{`${firstName} ${lastName}`}</Typography>
        <Typography component="p" variant="body2" noWrap={true}>
          {email}
        </Typography>
        <Divider />
        <Stack flexDirection="row" width="inherit">
          <Stack
            spacing={`${theme.gap(-5)}`}
            sx={{
              width: "inherit",
              borderRight: `1px solid ${theme.palette.gray.trans[1]}`,
            }}>
            <Typography variant="subtitle1">
              {summarizeNum(followersCount ?? 0)}
            </Typography>
            <Typography variant="body3">Followers</Typography>
          </Stack>
          <Stack sx={{ width: "inherit" }} spacing={`${theme.gap(-5)}`}>
            <Typography variant="subtitle1">
              {summarizeNum(followingCount ?? 0)}
            </Typography>
            <Typography variant="body3">Following</Typography>
          </Stack>
        </Stack>
        <Divider />
        <AppButton
          variant="outlined"
          style={{
            alignSelf: "center",
            width: "100%",
            fontSize: "14px",
            padding: theme.boxSpacing(2, 5),
            borderColor: theme.palette.gray.trans[2],
          }}>
          My profile
        </AppButton>
      </Stack>
    </Stack>
  );
};
