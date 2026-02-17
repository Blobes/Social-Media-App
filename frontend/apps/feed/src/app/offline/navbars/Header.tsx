"use client";

import { AppBar, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useGlobalContext } from "@shared-state";
import { useMisc } from "@hooks";
import { img } from "@assets"
import { AnchorLink, AppButton } from "@shared-ui";
import { clientRoutes, zIndexes } from "@helpers";
import Image from "next/image";
import { usePage, usePageScroll } from "@hooks";

interface AppHeaderProps {
  scrollRef?: React.RefObject<HTMLElement | null>;
}
export const Header: React.FC<AppHeaderProps> = ({ scrollRef }) => {
  const { authStatus } = useGlobalContext();
  const { isDesktop } = useMisc();
  const { navigateTo } = usePage();
  const { handlePageScroll } = usePageScroll();
  const theme = useTheme();
  const scrollDir = handlePageScroll(scrollRef);
  const { OfflineAvatar } = img

  /* ---------------------------------- render ---------------------------------- */
  return (
    <AppBar
      position="sticky"
      component="nav"
      aria-label="Main navigation"
      role="navigation"
      sx={{
        zIndex: zIndexes[500],
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: theme.gap(6),
        backdropFilter: "blur(24px)",
        ...(!isDesktop && {
          transform: scrollDir === "down" ? "translateY(-100%)" : "translateY(0)",
          transition: "transform 0.3s ease-in-out",
        }),
      }}>

      {/* Logo */}
      <AnchorLink
        url={clientRoutes.home.path}
        onClick={() => {
          navigateTo(clientRoutes.home);
        }}
        style={{ display: "inline-flex" }}
      ><Image
          src={img.logo}
          alt="logo"
          style={{
            width: 34,
            height: 34,
            borderRadius: `${theme.radius.full}`,
          }}
        /></AnchorLink>

      {/* Right side elements */}
      <Stack direction="row" alignItems="center" spacing={theme.gap(8)}>
        <OfflineAvatar
          style={{
            width: "34px", height: "34px",
            stroke: "none",
            [theme.breakpoints.down("md")]: {
              width: "28px", height: "28px"
            },
          }} />

        {/* Login Button */}
        {authStatus === "UNAUTHENTICATED" && (
          <AppButton
            href={clientRoutes.login.path}
            variant="outlined"
            style={{ fontSize: "14px" }}
            onClick={() =>
              navigateTo(clientRoutes.login,
                { type: "element", savePage: false, loadPage: true })
            }>
            Sign in
          </AppButton>
        )}
      </Stack>
    </AppBar >
  );
};
