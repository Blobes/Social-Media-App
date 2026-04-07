"use client";

import React, { useRef } from "react";
import { Typography, Divider, Stack, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Strip,
  RenderItemList,
  MenuPopup,
  ThemeSwitcher,
  StatusSwitcher,
} from "@repo/shared-ui";
import { summarizeNum } from "@repo/helpers";
import { SlidersHorizontal, WalletMinimal } from "lucide-react";
import {
  useGlobalContext,
  useMisc,
  useNavLists,
  usePage,
} from "@repo/shared-state";
import { MenuRef } from "@repo/types";
import { Logout } from "../../auth/Logout";
import { useLogout } from "../../auth/useLogout";

export const DesktopNav = ({
  menuRef,
}: {
  menuRef: React.RefObject<MenuRef | null>;
}) => {
  const theme = useTheme();
  const { userNavList } = useNavLists();
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
      <MenuPopup
        ref={menuRef}
        contentElement={
          <RenderItemList
            list={userNavList}
            itemAction={() => {
              menuRef.current?.closeMenu();
              closeDrawer();
            }}
            hook={usePage}
            style={{
              padding: theme.boxSpacing(4, 8),
              gap: theme.gap(8),
              textAlign: "left",
              width: "100%",
              "& svg": {
                width: "20px",
                height: "20px",
                flex: "none",
              },
            }}
          />
        }
      />
    </Stack>
  );
};

// Mobile-specific wrapper for the same RenderList
// User info
const UserInfo = () => {
  const theme = useTheme();
  const { authUser } = useGlobalContext();

  if (!authUser) return null;

  const {
    firstName,
    lastName,
    profileImage,
    username,
    followersCount,
    followingCount,
  } = authUser;
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
            text: followersCount > 1 ? " Followers" : " Follower",
            element: (
              <strong style={{ color: theme.palette.gray[300] as string }}>
                {summarizeNum(followersCount)}
              </strong>
            ),
          },
          {
            text: " Following",
            element: (
              <strong style={{ color: theme.palette.gray[300] as string }}>
                {summarizeNum(followingCount)}
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
  const { userNavList } = useNavLists();
  const menuRef = useRef<MenuRef>(null);
  const { closeDrawer } = useMisc();
  const { handleLogout } = useLogout();

  return (
    <Stack>
      <UserInfo />
      <Divider />
      <Stack gap={theme.gap(10)}>
        <RenderItemList
          list={userNavList}
          itemAction={() => {
            menuRef.current?.closeMenu();
            closeDrawer();
          }}
          hook={usePage}
          showCurrentPage={false}
          style={{
            gap: theme.gap(10),
            padding: 0,
            background: "none",
            width: "100%",
            textAlign: "left",
            fontSize: "18px",
            "&:hover": {
              background: "none",
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
