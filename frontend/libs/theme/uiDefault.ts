"use client";

import { createTheme } from "@mui/material/styles";
import { outlinedInputClasses } from "@mui/material/OutlinedInput";

const componentTheme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        body: {
          WebkitTapHighlightColor: "transparent",
          "--theme-transition": theme.transitions.create(
            ["background-color", "stroke", "fill"],
            { duration: theme.transitions.duration.standard },
          ),
        },
        "div, svg": {
          transition: "var(--theme-transition)",
        },
        svg: {
          stroke: theme.palette.gray?.[200],
        },
      }),
    },

    MuiUseMediaQuery: {
      defaultProps: {
        noSsr: true, // Prevents media query crashes during build
      },
    },

    MuiTypography: {
      styleOverrides: {
        root: () => ({
          color: "inherit",
          margin: "0px",
          width: "inherit",
        }),
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.boxSpacing(4, 9),
          borderRadius: theme.radius.full,
          alignSelf: "flex-start",
          height: "40px",
          fontWeight: "600",
        }),
        contained: ({ theme }) => ({
          backgroundColor: theme.palette.primary.main,
          color: theme.fixedColors.gray50,
          "&:hover": { backgroundColor: theme.palette.primary.dark },
          "&:disabled": {
            backgroundColor: theme.palette.primary.main,
            color: theme.fixedColors.gray50,
            opacity: 0.6,
          },
        }),
        outlined: ({ theme }) => ({
          borderColor: theme.palette.gray.trans[2],
          color: theme.palette.gray[300],
          "&:hover": {
            backgroundColor: theme.fixedColors.mainTrans,
            borderColor: theme.fixedColors.mainTrans,
          },
        }),
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) => ({
          padding: theme.boxSpacing(3, 5),
          backgroundColor: theme.fixedColors.gray800,
          color: theme.fixedColors.gray50,
          fontSize: "12px",
          borderRadius: theme.radius[2],
          boxShadow: theme.shadows[1],
          maxWidth: 420,
          margin: theme.boxSpacing(0, 6),
          border: `1px solid ${theme.palette.gray.trans[1]}`,
        }),
        arrow: ({ theme }) => ({
          color: theme.fixedColors.gray800,
          fontSize: "13px",
        }),
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.boxSpacing(3),
          margin: 0,
        }),
      },
    },

    MuiContainer: {
      styleOverrides: {
        root: ({ theme }) => ({
          overflow: "hidden",
          [theme.breakpoints.down("sm")]: { padding: theme.boxSpacing(3) },
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

    MuiStack: {
      styleOverrides: {
        root: ({ theme }) => ({
          gap: theme.gap(4),
        }),
      },
    },

    MuiGrid: {
      styleOverrides: {
        root: () => ({}),
      },
    },

    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.fixedColors.mainTrans,
          borderRadius: theme.radius[4],
          boxShadow: "unset",
        }),
      },
    },

    MuiCardHeader: {
      styleOverrides: {
        root: ({ theme }) => ({ gap: theme.gap(2) }),
        avatar: () => ({ margin: 0 }),
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 8 },
      styleOverrides: {
        root: ({ theme }) => ({ borderRadius: theme.radius[4] }),
        elevation: ({ theme }) => ({
          backgroundColor: theme.palette.gray[0],
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))",
        }),
        outlined: ({ theme }) => ({
          backgroundColor: "unset",
          border: `1px solid ${theme.palette.gray.trans[1]}`,
        }),
        elevation8: {
          boxShadow: "4px 8px 24px rgba(0, 0, 0, 0.2)",
        },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: theme.palette.gray[0],
          borderRadius: theme.radius[4],
        }),
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: "unset",
          borderRadius: theme.radius[0],
          boxShadow: "none",
          minHeight: "44px",
          padding: theme.boxSpacing(4, 18),
          [theme.breakpoints.down("md")]: {
            minHeight: "32px",
            padding: theme.boxSpacing(5),
          },
        }),
      },
    },

    MuiToolbar: {
      styleOverrides: {
        root: ({ theme }) => ({
          [theme.breakpoints.down("lg")]: {
            minHeight: "32px",
            padding: theme.boxSpacing(3),
          },
        }),
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: ({ theme }) => ({
          width: "100%",
          margin: theme.boxSpacing(4, 0),
        }),
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          "--TextField-default": theme.palette.gray[50],
          "--TextField-success": theme.palette.info.main,
          "--TextField-error": theme.palette.error.main,
          "& .MuiInputBase-input": { fontSize: "15px" },
          "& label": {
            fontSize: "14px",
            transform: "translate(14px, 14px)",
          },
          "& label.Mui-error": { color: "var(--TextField-error)" },
          "& label.Mui-focused, & label.MuiInputLabel-shrink": {
            transform: "translate(14px, -9px) scale(0.95)",
          },
          "& .MuiFormHelperText-root": {
            fontSize: "13px",
            lineHeight: "1.2em",
            margin: theme.boxSpacing(2, 0, 0, 0),
          },
        }),
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderColor: "var(--TextField-default)",
          borderRadius: theme.radius[3],
          maxWidth: "600px",
          minWidth: "150px",
          padding: theme.boxSpacing(3, 6, 3, 0),
          [`& .Mui-error .${outlinedInputClasses.notchedOutline}`]: {
            borderColor: "var(--TextField-error)",
          },
          "&.Mui-focused": {
            outline: `2px solid ${theme.fixedColors.mainTrans}`,
            outlineOffset: "2px",
            boxShadow: `0 0 0 6px var(--TextField-default)`,
          },
        }),
      },
    },
  },
});

export default componentTheme;
