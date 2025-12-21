"use client";

import { useRef } from "react";
import { Typography, Divider, Stack, svgIconClasses } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { UserAvatar } from "../../components/UserAvatar";
import { AppButton } from "../../components/Buttons";
import { useAppContext } from "@/app/AppContext";
import { Strip } from "../../components/StripBar";
import { summarizeNum } from "@/helpers/others";
import { RenderList } from "../RenderNavLists";
import { MenuRef } from "@/components/Menus";
import { useNavLists } from "../NavLists";
import { useSharedHooks } from "@/hooks";

// Mobile-specific wrapper for the same RenderList
// User info
const UserInfo = () => {
  const theme = useTheme();
  const authUser = useAppContext().authUser;
  if (!authUser) return null;

  const { firstName, lastName, profileImage, username, followers, following } =
    authUser;
  return (
    <Stack>
      <Stack
        sx={{
          gap: theme.gap(4),
          flexDirection: "row",
          alignItems: "center",
        }}>
        <UserAvatar
          style={{ width: "40px", height: "40px" }}
          userInfo={{ firstName, lastName, profileImage }}
        />
        <Stack sx={{ gap: theme.gap(0), width: "100%" }}>
          <Typography variant="body1">
            {firstName} {lastName}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.gray[200] }}>
            {username}
          </Typography>
        </Stack>
        <AppButton
          variant="outlined"
          style={{
            fontSize: "13px",
            padding: theme.boxSpacing(1, 4),
            borderColor: theme.palette.gray[100],
          }}>
          Profile
        </AppButton>
      </Stack>
      <Divider />
      <Strip
        style={{
          paddingX: theme.boxSpacing(4),
          justifyContent: "space-between",
        }}
        items={[
          {
            text: followers?.length! > 1 ? " Followers" : " Follower",
            element: (
              <strong style={{ color: theme.palette.gray[300] as string }}>
                {summarizeNum(followers?.length!)}
              </strong>
            ),
          },
          {
            text: " Following",
            element: (
              <strong style={{ color: theme.palette.gray[300] as string }}>
                {summarizeNum(following?.length!)}
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
      />
    </Stack>
  );
};

export const MobileUserNav = ({}) => {
  const theme = useTheme();
  const { userNavList } = useNavLists();
  const { setLastPage, closeModal } = useSharedHooks();
  const menuRef = useRef<MenuRef>(null);

  return (
    <Stack sx={{ padding: theme.boxSpacing(6) }}>
      <UserInfo />
      <Divider />
      <RenderList
        list={userNavList}
        setLastPage={setLastPage}
        closePopup={() => {
          menuRef.current?.closeMenu();
          closeModal();
        }}
        style={{
          gap: theme.gap(10),
          [`& .${svgIconClasses.root}`]: {
            fill: theme.palette.gray[200],
            width: "22px",
            height: "22px",
          },
        }}
      />
    </Stack>
  );
};
