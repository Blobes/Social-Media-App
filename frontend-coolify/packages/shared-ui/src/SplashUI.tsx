"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { asset } from "@repo/assets";
import Image from "next/image";
import { RootUIContainer } from "./Containers";

export const SplashUI = () => {
  const theme = useTheme();

  return (
    <RootUIContainer
      style={{
        alignItems: "center",
        justifyContent: "center",
      }}>
      <Image
        src={asset.logo}
        alt="Splash icon"
        width={56}
        height={56}
        style={{ borderRadius: `${theme.radius.full}` }}
      />
    </RootUIContainer>
  );
};
