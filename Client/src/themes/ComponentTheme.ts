"use client";

import { createTheme } from "@mui/material/styles";

// Theme configuration
const componentTheme = createTheme({
  // Overriding & Setting Components
  components: {
    // Typography
    MuiTypography: {
      styleOverrides: {
        root: ({ theme }) =>
          theme.unstable_sx({
            color: theme.palette.gray[300],
            margin: "0px",
            width: "inherit",
          }),
      },
    },

    // Buttons
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: ({ theme }) =>
          theme.unstable_sx({
            padding: theme.boxSpacing(4, 9),
            borderRadius: theme.radius[2],
            alignSelf: "flex-start",
            height: "40px",
          }),
        contained: ({ theme }) =>
          theme.unstable_sx({
            backgroundColor: theme.palette.primary.main,
            color: theme.fixedColors.gray50,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
          }),
        outlined: ({ theme }) =>
          theme.unstable_sx({
            borderColor: theme.palette.gray[300],
            color: theme.palette.gray[300],
            "&:hover": {
              backgroundColor: theme.fixedColors.mainTrans,
              borderColor: theme.fixedColors.mainTrans,
            },
          }),
      },
    },

    // Tooltip
    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) =>
          theme.unstable_sx({
            padding: theme.boxSpacing(3, 7),
            backgroundColor: theme.fixedColors.gray800,
            color: theme.fixedColors.gray50,
            fontSize: "14px",
            borderRadius: theme.radius[1],
            maxWidth: 420,
            margin: theme.boxSpacing(0, 6),
          }),
        arrow: ({ theme }) =>
          theme.unstable_sx({
            color: theme.fixedColors.gray800,
            fontSize: "16px",
          }),
      },
    },

    // IconButton
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) =>
          theme.unstable_sx({
            padding: theme.boxSpacing(3),
          }),
      },
    },

    // Container
    MuiContainer: {
      styleOverrides: {
        root: ({ theme }) => ({
          overflow: "hidden",
          [theme.breakpoints.down("sm")]: {
            padding: theme.boxSpacing(3),
          },
          [theme.breakpoints.between("sm", "lg")]: {
            padding: theme.boxSpacing(6),
          },
          [theme.breakpoints.up("lg")]: {
            padding: theme.boxSpacing(8),
            maxWidth: "1440px",
          },
        }),
      },
    },

    // Stack
    MuiStack: {
      styleOverrides: {
        root: ({ theme }) => ({
          gap: theme.gap(4),
        }),
      },
    },

    // Grid
    MuiGrid2: {
      styleOverrides: {
        root: ({ theme }) => ({}),
      },
    },

    // Card
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) =>
          theme.unstable_sx({
            backgroundColor: theme.fixedColors.mainTrans,
            borderRadius: theme.radius[4],
            boxShadow: "unset",
          }),
      },
    },
    // Card Header
    MuiCardHeader: {
      styleOverrides: {
        root: ({ theme }) =>
          theme.unstable_sx({
            gap: theme.gap(2),
          }),
        avatar: ({ theme }) =>
          theme.unstable_sx({
            margin: 0,
          }),
      },
    },

    // Paper
    MuiPaper: {
      defaultProps: {
        elevation: 8,
      },
      styleOverrides: {
        root: ({ theme }) =>
          theme.unstable_sx({
            borderRadius: theme.radius[4],
          }),
        elevation: ({ theme }) =>
          theme.unstable_sx({
            backgroundColor: theme.palette.gray[0],
            backgroundImage:
              "linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))",
          }),
        outlined: ({ theme }) =>
          theme.unstable_sx({
            backgroundColor: "unset",
            border: `1px solid ${theme.palette.gray.trans[1]}`,
          }),
        elevation8: {
          boxShadow: "4px 8px 24px rgba(0, 0, 0, 0.2)",
        },
      },
    },

    // Nav Menu Popup
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) =>
          theme.unstable_sx({
            backgroundColor: theme.palette.gray[0],
            borderRadius: theme.radius[4],
          }),
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) =>
          theme.unstable_sx({
            backgroundColor: "unset",
            borderRadius: theme.radius[0],
            boxShadow: "none",
          }),
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: ({ theme }) =>
          theme.unstable_sx({
            width: "100%",
            margin: theme.boxSpacing(4, 0),
          }),
      },
    },
  },
});
export default componentTheme;
