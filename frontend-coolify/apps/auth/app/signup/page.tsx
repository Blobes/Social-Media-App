"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { Signup } from "./registration/Signup";
import { Stack } from "@mui/material";
import { asset } from "@repo/assets";
import { SVGWrapper } from "@repo/shared-ui";
import { applyBGPattern } from "@repo/helpers";

export default function SignupPage() {
  const theme = useTheme();

  return (
    <Stack
      sx={{
        height: "100%",
        width: "100%",
        padding: theme.boxSpacing(30),
        alignItems: "center",
        justifyContent: "center",
        minHeight: "fit-content",
        ...applyBGPattern({ url: asset.zebraPattern, opacity: 0.06 }),
        [theme.breakpoints.down("md")]: {
          minHeight: "unset",
          padding: theme.boxSpacing(0),
        },
      }}>
      <Stack
        sx={{
          width: "60%",
          flexDirection: "row",
          gap: theme.gap(0),
          justifyContent: "space-between",
          background: theme.palette.gray[0],
          borderRadius: theme.radius[5],
          overflow: "hidden",
          boxShadow: `-12px -12px 30px 6px ${theme.palette.gray.trans.overlay(0.06, true)}, 
          18px 18px 30px 6px ${theme.palette.gray.trans.overlay(0.06, true)}`,
          [theme.breakpoints.down(1180)]: {
            width: "80%",
          },
          [theme.breakpoints.down("md")]: {
            width: "100%",
            height: "100%",
            overflow: "auto",
            boxShadow: "none",
            flexDirection: "column",
            padding: theme.boxSpacing(0),
            borderRadius: 0,
            scrollSnapType: "y mandatory",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          },
        }}>
        <Signup
          style={{
            container: {
              width: "50%",
              padding: theme.boxSpacing(16, 10),
              [theme.breakpoints.down("md")]: {
                width: "100%",
                height: "98vh",
                minHeight: "98vh",
                scrollSnapAlign: "start",
              },
            },
          }}
        />
        <SVGWrapper
          src={asset.SignupAnimation}
          preserveColor={true}
          sx={{
            width: "50%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#1F2876",
            [theme.breakpoints.down("md")]: {
              width: "100%",
              height: "100vh",
              scrollSnapAlign: "start",
            },
          }}
        />
      </Stack>
    </Stack>
  );
}
