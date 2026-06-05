"use client";

import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";
import globalTheme from "./globalTheme";

/**
 * Creates an inverted theme variant using the structural properties of an existing theme instance.
 */
const createInvertedTheme = (mode: "light" | "dark") => {
  const invertedTheme = createTheme({
    ...globalTheme,
    palette: {
      ...globalTheme.palette,
      mode: mode,
      // Overwrite palettes explicitly with opposing mode values
      primary:
        mode === "dark"
          ? { light: "#485BC6", main: "#5D71EC", dark: "#8497FF" }
          : { light: "#8395FF", main: "#506AFF", dark: "#162770" },
      gray:
        mode === "dark"
          ? {
              0: "#020A28",
              50: "#11152C",
              100: "#476183",
              200: "#8399B4",
              300: "#ffffff",
              trans: {
                1: "rgba(173, 218, 255, 0.08)",
                2: "rgba(173, 218, 255, 0.2)",
                overlay: (opacity?: number, adaptive = false) =>
                  `rgba(${adaptive ? "40, 57, 217" : "1, 6, 19"}, ${opacity ?? 0.5})`,
              },
            }
          : {
              0: "#ffffff",
              50: "#E8ECF5",
              100: "#BCC8DA",
              200: "#6F7E99",
              300: "#101926",
              trans: {
                1: "rgba(1, 7, 30, 0.06)",
                2: "rgba(1, 14, 24, 0.12)",
                overlay: (opacity?: number, adaptive = false) =>
                  `rgba(${adaptive ? "8, 27, 95" : "1, 6, 19"}, ${opacity ?? 0.5})`,
              },
            },
      info:
        mode === "dark"
          ? { light: "#0A0D1C", main: "#E7EBFF", dark: "#BBC4E8" }
          : { light: "#E8EDFF", main: "#121D4A", dark: "#10142C" },
      error:
        mode === "dark"
          ? {
              light: "#170808",
              main: red[300],
              dark: "#FFA0A9",
              trans: "rgba(255, 173, 173, 0.08)",
            }
          : {
              light: "#FFF2F4",
              main: "#EF5350",
              dark: "#DF3848",
              trans: "rgba(24, 1, 1, 0.06)",
            },
    },
  });

  return invertedTheme;
};

export const useLightModeTheme = createInvertedTheme("light");
export const useDarkModeTheme = createInvertedTheme("dark");
