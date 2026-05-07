"use client";

import React, { useRef } from "react";
import { Typography, Divider, Stack, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Strip,
  RenderItemList,
  ThemeSwitcher,
  StatusSwitcher,
  DisplayList,
} from "@repo/shared-ui";
import { summarizeNum } from "@repo/helpers";
import { SlidersHorizontal, WalletMinimal } from "lucide-react";
import { useGlobalStore, useMisc, usePage } from "@repo/shared-hooks";
import { LISTS, MenuRef } from "@repo/core";
import { Logout } from "../../apps/auth/logout/Logout";

export const DesktopNav = ({
  menuRef,
}: {
  menuRef: React.RefObject<MenuRef | null>;
}) => {
  const theme = useTheme();
  const { USER_NAV_LIST } = LISTS();
  const { closeDrawer } = useMisc();

  return (
    <Stack
      sx={{
        display: {
          xs: "none",
          md: "flex",
        },
        position: "absolute",
        gap: theme.gap(4),
      }}>
      <DisplayList
        menuRef={menuRef}
        list={USER_NAV_LIST}
        usePage={usePage}
        onItemClick={closeDrawer}
      />
    </Stack>
  );
};

// Mobile-specific wrapper for the same RenderList
// User info
const UserInfo = () => {
  const theme = useTheme();
  const authUser = useGlobalStore((state) => state.authUser);

  if (!authUser) return null;

  const { firstName, lastName, username, followersCount, followingCount } =
    authUser;
  return (
    <Stack>
      <Stack
        sx={{
          gap: theme.gap(4),
          flexDirection: "row",
          alignItems: "center",
        }}>
        <Stack sx={{ gap: theme.gap(0), width: "100%" }}>
          <Typography variant="body1" sx={{ fontWeight: "600" }}>
            {firstName} {lastName}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.gray[200] }}>
            {username}
          </Typography>
        </Stack>
        <IconButton sx={{ fontSize: "20px", fontWeight: "500" }}>
          <WalletMinimal style={{ width: "20px", height: "20px" }} />
          12K
        </IconButton>
      </Stack>
      <Divider />
      <Strip
        items={[
          {
            text: (followersCount ?? 0 > 1) ? " Followers" : " Follower",
            element: (
              <strong style={{ color: theme.palette.gray[300] as string }}>
                {summarizeNum(followersCount ?? 0)}
              </strong>
            ),
          },
          {
            text: " Following",
            element: (
              <strong style={{ color: theme.palette.gray[300] as string }}>
                {summarizeNum(followingCount ?? 0)}
              </strong>
            ),
          },
          {
            text: " Likes",
            element: (
              <strong style={{ color: theme.palette.gray[300] as string }}>
                {summarizeNum(3)}
              </strong>
            ),
          },
        ]}
        style={{
          justifyContent: "space-between",
          fontSize: "13px",
        }}
      />
    </Stack>
  );
};

export const MobileNav = ({}) => {
  const theme = useTheme();
  const { USER_NAV_LIST } = LISTS();
  const menuRef = useRef<MenuRef>(null);
  const { closeDrawer } = useMisc();

  return (
    <Stack>
      <UserInfo />
      <Divider />
      <Stack gap={theme.gap(10)}>
        <RenderItemList
          list={USER_NAV_LIST}
          onItemClick={() => {
            menuRef.current?.closeMenu();
            closeDrawer();
          }}
          usePage={usePage}
          showActiveItem={false}
          style={{
            gap: theme.gap(10),
            padding: 0,
            background: "transparent",
            width: "100%",
            textAlign: "left",
            fontSize: "18px",
            "&:hover": {
              background: "transparent",
              color: theme.palette.primary.dark + "!important",
            },
            "& svg": {
              width: "22px",
              height: "22px",
            },
          }}
        />
        <Divider />
        <StatusSwitcher />
        <ThemeSwitcher />
        <Stack direction="row" gap={theme.gap(10)} alignItems="center">
          <SlidersHorizontal style={{ width: "18px", height: "18px" }} />
          <Typography variant="body2" sx={{ fontWeight: "600" }}>
            Filter feed
          </Typography>
        </Stack>
        <Logout />
      </Stack>
    </Stack>
  );
};
