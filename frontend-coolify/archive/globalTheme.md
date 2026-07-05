"use client";

import { grey, red } from "@mui/material/colors";
import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import baseUIStyles from "./baseUIStyles";

let designSystem = createTheme({
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
            overlay: (opacity?: number, adaptive: boolean = false) =>
              `rgba(${adaptive ? "8, 27, 95" : "1, 6, 19"}, ${opacity ?? 0.5})`,
          },
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
          trans: "rgba(183, 14, 14, 0.06)",
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
            overlay: (opacity?: number, adaptive: boolean = false) =>
              `rgba(${adaptive ? "40, 57, 217" : "1, 6, 19"}, ${opacity ?? 0.5})`,
          },
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
          trans: "rgba(255, 173, 173, 0.08)",
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
    fontFamily: "'Satoshi','Manrope','Cabinet Grotesk', Arial, sans-serif",
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700, fontSize: "32px" },
    h6: { fontWeight: 700, fontSize: "26px" },
    subtitle1: {
      fontSize: "22px",
      fontWeight: 700,
    },
    body1: { fontSize: "18px", fontWeight: 600 },
    body2: { fontSize: "16px", fontWeight: 500 },
    body3: { fontSize: "15px", fontWeight: 500 },
    caption: {},
    overline: {},
    button: { textTransform: "unset", fontSize: "16px" },
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
    return `${top * 2}px ${right || right === 0 ? right * 2 + "px" : ""} ${
      bottom || bottom === 0 ? bottom * 2 + "px" : ""
    } ${left || left === 0 ? left * 2 + "px" : ""}`;
  },
  gap: (value = 0) => `${value * 2}px`,
});

designSystem = responsiveFontSizes(designSystem);

const globalTheme = createTheme({
  ...designSystem,
  components: {
    ...baseUIStyles.components,
  },
});

export default globalTheme;
