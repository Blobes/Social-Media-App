import { AppBar, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { zIndexes } from "@repo/helpers"
import { usePageScroll } from "../../hooks/usePageScroll";

interface NavProps {
  scrollRef?: React.RefObject<HTMLElement | null>;
}
export const BottomNav: React.FC<NavProps> = ({ scrollRef }) => {
  const theme = useTheme();
  const { handlePageScroll } = usePageScroll();
  const scrollDir = handlePageScroll(scrollRef);

  return (
    <AppBar
      position="absolute"
      component="nav"
      aria-label="Main navigation"
      role="navigation"
      sx={{
        // borderTop: `1px solid ${theme.palette.gray.trans[1]}`,
        zIndex: zIndexes[500],
        padding: theme.boxSpacing(6),
        // backgroundColor: theme.palette.gray[0],
        top: "unset",
        bottom: 0,
        backdropFilter: "blur(24px)",
        transition: "transform 0.3s ease-in-out",
        transform: scrollDir === "down" ? "translateY(100%)" : "translateY(0)",

      }}>
      <Typography>Bottom navigation</Typography>
    </AppBar>
  );
};
