"use client";

import { Components, Theme } from "@mui/material/styles";

interface BaseStylesContainer {
  components: Components<Omit<Theme, "components">>;
}

const defaultUIStyles: BaseStylesContainer = {
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        ":root": {
          "--ui-font-scale": "1.00",
          "--ui-density-base": "2px",
        },
        "[data-ui-density='compact']": {
          "--ui-density-base": "1.3px",
        },
        "[data-ui-dyslexia='true']": {
          "--ui-font-family":
            "'OpenDyslexic', 'Comic Sans MS', sans-serif !important",
        },
        "[data-ui-motion='reduced'] *": {
          transitionDuration: "0s !important",
          animationDuration: "0s !important",
          transitionDelay: "0s !important",
          animationIterationCount: "1 !important",
          scrollBehavior: "auto !important",
        },
        "[data-ui-contrast='high']": {
          "--mui-palette-primary-main": "#0516FA !important",
          "--mui-palette-primary-dark": "#010A80 !important",
          "--mui-palette-gray-300": "#000000 !important",
          "--mui-palette-gray-200": "#222222 !important",
          borderWidth: "2px !important",
        },
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
          stroke: "var(--mui-palette-gray-200)",
          flexShrink: "0!important",
        },
        "input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active":
          {
            WebkitBoxShadow: `0 0 0 1000px rgba(1, 14, 24, 0) inset !important`,
            transition: "background-color 5000s ease-in-out 0s",
          },
      }),
    },

    MuiUseMediaQuery: {
      defaultProps: {
        noSsr: true,
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
          fontWeight: "500",
          "&:disabled": {
            cursor: "not-allowed",
            pointerEvents: "auto",
          },
        }),
        contained: () => ({
          backgroundColor: "var(--mui-palette-primary-main)",
          color: "var(--mui-fixedColors-gray50)",
          "&:hover": { backgroundColor: "var(--mui-palette-primary-dark)" },
          "&:disabled": {
            backgroundColor: "var(--mui-palette-primary-main)",
            color: "var(--mui-fixedColors-gray50)",
            opacity: 0.6,
          },
        }),
        outlined: () => ({
          borderColor: "var(--mui-palette-gray-trans-2)",
          color: "var(--mui-palette-gray-300)",
          "&:hover": {
            backgroundColor: "var(--mui-fixedColors-pTrans)",
            borderColor: "var(--mui-fixedColors-pTrans)",
          },
          "&:disabled": {
            color: "var(--mui-palette-gray-300)",
            backgroundColor: "var(--mui-palette-gray-trans-2)",
            borderColor: "transparent",
            opacity: 0.6,
          },
        }),
        text: () => ({
          "&:disabled": {
            color: "var(--mui-palette-gray-300)",
            opacity: 0.7,
          },
        }),
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) => ({
          ...theme.typography.text6,
          padding: theme.boxSpacing(3, 5),
          backgroundColor: "var(--mui-fixedColors-gray800)",
          color: "var(--mui-fixedColors-gray50)",
          borderRadius: theme.radius[3],
          boxShadow: "var(--mui-shadows-1)",
          maxWidth: 420,
          margin: theme.boxSpacing(0, 6),
          border: `1px solid var(--mui-palette-gray-trans-2)`,
        }),
        arrow: ({ theme }) => ({
          ...theme.typography.text6,
          color: "var(--mui-fixedColors-gray800)",
        }),
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.boxSpacing(3),
          margin: 0,
          "&:hover": { backgroundColor: "var(--mui-fixedColors-pTrans)" },
          "&:disabled": {
            backgroundColor: "var(--mui-palette-gray-trans-overlay)",
            opacity: 0.6,
          },
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

    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: "var(--mui-fixedColors-pTrans)",
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
        elevation: () => ({
          backgroundColor: "var(--mui-palette-gray-0)",
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))",
        }),
        outlined: () => ({
          backgroundColor: "unset",
          border: `1px solid var(--mui-palette-gray-trans-1)`,
        }),
        elevation8: {
          boxShadow: "4px 8px 24px rgba(0, 0, 0, 0.2)",
        },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: "var(--mui-palette-gray-0)",
          borderRadius: theme.radius[4],
        }),
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: "none",
          "--AppBar-background": "none",
          "--mui-palette-AppBar-darkBg": "none",
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
          "--TextField-main": "var(--mui-palette-primary-main)",
          "--TextField-default": "var(--mui-palette-gray-200)",
          "--TextField-success": "var(--mui-palette-info-main)",
          "--TextField-error": "var(--mui-palette-error-main)",
          "--TextField-gray0": "var(--mui-palette-gray-0)",
          "--TextField-gray50": "var(--mui-palette-gray-50)",
          "--TextField-fontSize": "calc(1rem * var(--ui-font-scale, 1))",

          "& .MuiInputBase-input": {
            fontSize: "var(--TextField-fontSize)",
            fontWeight: "501",
            textAlign: "var(--ui-text-align, inherit)" as any,
          },

          "& .MuiInputLabel-root": {
            maxWidth: "calc(90% - 24px)",
            fontSize: "var(--TextField-fontSize)",
            transform: "translate(16px, 17px)",
            fontWeight: "500",
            color: "var(--TextField-default)",
          },
          "& label.Mui-focused, & label.MuiInputLabel-shrink": {
            color: "var(--TextField-default)",
            transform: "translate(16px, 7px) scale(0.83)",
            borderRadius: theme.radius[1],
            padding: 0,
          },
          "& label.MuiInputLabel-root.Mui-error.Mui-focused, & label.MuiInputLabel-root.Mui-error":
            {
              color: "var(--TextField-error)",
            },
          "& .MuiFormHelperText-root": {
            fontSize: "calc(0.875rem * var(--ui-font-scale, 1))",
            lineHeight: "1.2em",
            fontWeight: "500",
            color: "var(--TextField-default)",
            margin: theme.boxSpacing(4, 0, 0, 0),
            textAlign: "var(--ui-text-align, inherit)" as any,
          },
          "& .MuiFormHelperText-root.Mui-focused": {
            padding: 0,
          },
        }),
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          maxWidth: "600px",
          minWidth: "150px",
          borderRadius: theme.radius[4],
          border: "1px solid var(--TextField-gray50)",
          backgroundColor: "var(--TextField-gray50)",
          padding: theme.boxSpacing(4.5, 5, 4.5, 0),
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: "transparent",
            borderColor: "var(--TextField-main)",
          },
          "&.Mui-focused": {
            backgroundColor: "transparent",
            borderColor: "var(--TextField-main)",
            outline: `2px solid var(--mui-fixedColors-pTrans)`,
            boxShadow: `0 0 0 4px var(--mui-fixedColors-pTrans)`,
            outlineOffset: "1px",
          },
          "&.Mui-error, &.Mui-error:hover": {
            borderColor: "var(--TextField-error)",
            backgroundColor: "var(--mui-palette-error-trans)",
          },
          "&.Mui-error.Mui-focused": {
            boxShadow: `0 0 0 4px var(--mui-palette-error-trans)`,
            backgroundColor: "transparent",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            display: "none",
          },
        }),
      },
    },
  },
};

export default defaultUIStyles;
