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
          main: "#506AFF",
          dark: "#4355DC",
        },
        gray: {
          0: "#ffffff",
          50: grey[50],
          100: grey[300],
          200: grey[600],
          300: grey[900],
          trans: {
            1: "rgba(0, 0, 0, 0.06)",
            2: "rgba(0, 0, 0, 0.12)",
            overlay: "rgba(0, 0, 0, 0.50)",
          },
        },
        success: {
          light: "#CBD3F1",
          main: "#425BEF",
          dark: "#161C3D",
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
          main: "#6F81EE",
          dark: "#4355DC",
        },
        gray: {
          0: grey[900],
          50: grey[800],
          100: grey[700],
          200: grey[500],
          300: "#ffffff",
          trans: {
            1: "rgba(255, 255, 255, 0.08)",
            2: "rgba(255, 255, 255, 0.20)",
            overlay: "rgba(0, 0, 0, 0.50)",
          },
        },
        success: {
          light: "#10142C",
          main: "#506AFF",
          dark: "#BBC4E8",
        },
        error: {
          light: "#1D0505",
          main: red[300],
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
    gray800: "#333437",
    mainTrans: "rgba(63, 121, 228, 0.14)",
  },

  // Overriding & Setting Typography
  typography: {
    fontFamily: "'Manrope','Cabinet Grotesk', Arial, sans-serif",
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600, fontSize: "26px" },
    h6: { fontSize: "24px" },
    subtitle1: {
      fontSize: "20px",
      fontWeight: 600,
    },
    body1: { fontSize: "18px" },
    body2: { fontSize: "15px" },
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
