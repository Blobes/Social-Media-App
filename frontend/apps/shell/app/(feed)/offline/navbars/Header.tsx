"use client";

import { AppBar, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMisc, usePageScroll } from "@repo/shared-state";
import { img } from "@repo/assets"
import Image from "next/image";

interface AppHeaderProps {
  scrollRef?: React.RefObject<HTMLElement | null>;
}
export const Header: React.FC<AppHeaderProps> = ({ scrollRef }) => {
  const { isDesktop } = useMisc();
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
        zIndex: 100,
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
      <Image
        src={img.logo}
        alt="logo"
        style={{
          width: 34,
          height: 34,
          borderRadius: `${theme.radius.full}`,
        }}
      />

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
      </Stack>
    </AppBar >
  );
};
