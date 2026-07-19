"use client";

import { green, grey, red } from "@mui/material/colors";
import { createTheme, PaletteColor } from "@mui/material/styles";
import defaultUIStyles from "./defaultUIStyles";

const baseTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: "class",
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          light: "#8395FF",
          main: "#506AFF",
          dark: "#3D4CD1",
        },
        gray: {
          0: "#ffffff",
          50: "#E8ECF5",
          100: "#BCC8DA",
          200: "#6F7E99",
          300: "#101926",
          trans: {
            1: "rgba(1, 7, 30, 0.06)",
            2: "rgba(1, 14, 24, 0.12)",
            overlay: {
              default: "1, 6, 19",
              adaptive: "8, 27, 95",
            },
          },
        },
        success: {
          light: green[300],
          main: green[500],
          dark: green[700],
        },
        info: {
          light: "#E8EDFF",
          main: "#121D4A",
          dark: "#10142C",
        },
        error: {
          light: "#FFF2F4",
          main: "#EF5350",
          dark: "#DF3848",
          trans: {
            1: "rgba(183, 14, 14, 0.06)",
            2: "rgba(208, 56, 56, 0.16)",
          },
        },
        tonalOffset: 0.6,
        contrastThreshold: 4.5,
      },
    },
    dark: {
      palette: {
        primary: {
          light: "#485BC6",
          main: "#5D71EC",
          dark: "#8396FF",
        },
        gray: {
          0: "#121421",
          50: "#272D4F",
          100: "#476183",
          200: "#8399B4",
          300: "#ffffff",
          trans: {
            1: "rgba(173, 218, 255, 0.08)",
            2: "rgba(173, 218, 255, 0.2)",
            overlay: {
              default: "1, 6, 19",
              adaptive: "40, 57, 217",
            },
          },
        },
        success: {
          light: green[700],
          main: green[500],
          dark: green[300],
        },
        info: {
          light: "#0A0D1C",
          main: "#E7EBFF",
          dark: "#BBC4E8",
        },
        error: {
          light: "#170808",
          main: red[300],
          dark: "#FFA0A9",
          trans: {
            1: "rgba(255, 173, 173, 0.08)",
            2: "rgba(255, 153, 153, 0.4)",
          },
        },
        tonalOffset: 0.6,
        contrastThreshold: 4.5,
      },
    },
  },
  fixedColors: {
    gray50: grey[50],
    gray800: "#121421",
    grayTrans: (opacity?: number) => `rgba(103, 126, 145, ${opacity ?? 0.18})`,
    primary: "#9FAEFF",
    pTrans: "rgba(72, 107, 246, 0.12)",
  } as const,
  typography: {
    fontFamily:
      "var(--ui-font-family, 'Satoshi','Manrope','Cabinet Grotesk', Arial, sans-serif)",
    h1: { fontWeight: 600, textAlign: "var(--ui-text-align, inherit)" as any },
    h2: { fontWeight: 600, textAlign: "var(--ui-text-align, inherit)" as any },
    h4: {
      fontSize: "calc(2.5rem * var(--ui-font-scale, 1))", // 40px
      fontWeight: 700,
      lineHeight: 1.2,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
    h5: {
      fontWeight: 700,
      fontSize: "calc(2rem * var(--ui-font-scale, 1))", // 32px
      lineHeight: 1.4,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
    h6: {
      fontWeight: 700,
      fontSize: "calc(1.625rem * var(--ui-font-scale, 1))", // 26px
      lineHeight: 1.4,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
    text1: {
      fontSize: "calc(1.375rem * var(--ui-font-scale, 1))", // 22px
      fontWeight: 700,
      lineHeight: 1.4,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
    text2: {
      fontSize: "calc(1.125rem * var(--ui-font-scale, 1))", // 18px
      fontWeight: 600,
      lineHeight: 1.3,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
    text3: {
      fontSize: "calc(1rem * var(--ui-font-scale, 1))", // 16px
      fontWeight: 500,
      lineHeight: 1.4,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
    text4: {
      fontSize: "calc(0.9375rem * var(--ui-font-scale, 1))", // 15px
      fontWeight: 500,
      lineHeight: 1.4,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
    text5: {
      fontSize: "calc(0.875rem * var(--ui-font-scale, 1))", // 14px
      fontWeight: 500,
      lineHeight: 1.4,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
    text6: {
      fontSize: "calc(0.8125rem * var(--ui-font-scale, 1))", // 13px
      fontWeight: 600,
      letterSpacing: 0.05,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
    text6Caps: {
      fontSize: "calc(0.8125rem * var(--ui-font-scale, 1))", // 13px
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.05,
      textAlign: "var(--ui-text-align, inherit)" as any,
    },
  },
  radius: {
    0: "0px",
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    full: "1000px",
  },
  boxSpacing: (top, right, bottom, left) => {
    const multi = "var(--ui-density-base, 2px)";
    return `calc(${top} * ${multi}) ${right || right === 0 ? `calc(${right} * ${multi})` : ""} ${
      bottom || bottom === 0 ? `calc(${bottom} * ${multi})` : ""
    } ${left || left === 0 ? `calc(${left} * ${multi})` : ""}`;
  },
  gap: (value = 0) => `calc(${value} * var(--ui-density-base, 2px))`,
});

baseTheme.palette.primary = {
  light: "var(--mui-palette-primary-light)",
  main: "var(--mui-palette-primary-main)",
  dark: "var(--mui-palette-primary-dark)",
} as PaletteColor;

baseTheme.palette.gray = {
  0: "var(--mui-palette-gray-0)",
  50: "var(--mui-palette-gray-50)",
  100: "var(--mui-palette-gray-100)",
  200: "var(--mui-palette-gray-200)",
  300: "var(--mui-palette-gray-300)",
  trans: {
    1: "var(--mui-palette-gray-trans-1)",
    2: "var(--mui-palette-gray-trans-2)",
    overlay: (opacity?: number, adaptive: boolean = false) => {
      const activeVariable = adaptive
        ? "var(--mui-palette-gray-trans-overlay-adaptive)"
        : "var(--mui-palette-gray-trans-overlay-default)";
      return `rgba(${activeVariable}, ${opacity ?? 0.5})`;
    },
  },
};

baseTheme.palette.success = {
  light: "var(--mui-palette-success-light)",
  main: "var(--mui-palette-success-main)",
  dark: "var(--mui-palette-success-dark)",
} as PaletteColor;

baseTheme.palette.info = {
  light: "var(--mui-palette-info-light)",
  main: "var(--mui-palette-info-main)",
  dark: "var(--mui-palette-info-dark)",
} as PaletteColor;

baseTheme.palette.error = {
  light: "var(--mui-palette-error-light)",
  main: "var(--mui-palette-error-main)",
  dark: "var(--mui-palette-error-dark)",
  trans: {
    1: "var(--mui-palette-error-trans-1)",
    2: "var(--mui-palette-error-trans-2)",
  },
} as PaletteColor;

baseTheme.components = defaultUIStyles.components as any;

export default baseTheme;
