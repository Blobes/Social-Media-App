"use client";

import { green, grey, red } from "@mui/material/colors";
import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import componentTheme from "./ComponentTheme";

// Theme configuration
let designSystem = createTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: "#5f8a2e",
          dark: "#416a24",
        },
        gray: {
          0: "#ffffff",
          50: grey[50],
          100: grey[200],
          200: grey[700],
          300: grey[900],
          trans: {
            1: "rgba(0, 0, 0, 0.06)",
            2: "rgba(0, 0, 0, 0.20)",
            overlay: "rgba(0, 0, 0, 0.50)",
          },
        },
        success: {
          light: green[100],
          main: green["A700"],
          dark: "#1C300F",
        },
        error: {
          light: red[50],
          main: red[400],
          dark: "#1D0505",
        },
        tonalOffset: 0.6,
        contrastThreshold: 4.5,
      },
    },
    dark: {
      palette: {
        primary: {
          main: "#78B44E",
          dark: "#588c35",
        },
        gray: {
          0: grey[900],
          50: grey[800],
          100: grey[700],
          200: grey[50],
          300: "#ffffff",
          trans: {
            1: "rgba(255, 255, 255, 0.09)",
            2: "rgba(255, 255, 255, 0.20)",
            overlay: "rgba(0, 0, 0, 0.50)",
          },
        },
        success: {
          light: "#142509",
          main: "#0AB936",
          dark: green[100],
        },
        error: {
          light: "#1D0505",
          main: red[400],
          dark: red[100],
        },
        tonalOffset: 0.6,
        contrastThreshold: 4.5,
      },
    },
  },
  // Fixed colors
  fixedColors: {
    gray50: grey[50],
    gray800: grey[800],
    mainTrans: "rgba(72, 118, 38, 0.16)",
  },

  // Overriding & Setting Typography
  typography: {
    fontFamily: "'Cabinet Grotesk', Arial, sans-serif",
    h1: { fontWeight: 400 },
    h2: { fontWeight: 400 },
    h4: { fontWeight: 500 },
    h5: { fontWeight: 400 },
    h6: { fontSize: "24px" },
    subtitle1: {
      fontSize: "20px",
      fontWeight: 600,
    },
    body1: { fontSize: "18px" },
    body2: { fontSize: "16px" },
    body3: { fontSize: "14px" },
    caption: {},
    overline: {},
    button: { textTransform: "unset", fontSize: "16px" },
  },

  // Radius
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
  // Padding & Margin Spacing
  boxSpacing: (val1, val2, val3, val4) => {
    return `${val1 * 2}px ${val2 || val2 === 0 ? val2 * 2 + "px" : ""} ${
      val3 || val3 === 0 ? val3 * 2 + "px" : ""
    } ${val4 || val4 === 0 ? val4 * 2 + "px" : ""}`;
  },

  // Spacing Between Elements
  gap: (value: number) => `${value * 2}px`,
});

designSystem = responsiveFontSizes(designSystem);

// Merge both the design system theme and the component theme
const theme = createTheme({
  ...designSystem,
  components: {
    ...componentTheme.components,
  },
});
export default theme;
