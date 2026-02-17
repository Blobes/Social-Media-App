"use client"

import { CircularProgress, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { img } from "@funstakes/assets";
import Image from "next/image";
import { rotate } from "@funstakes/helpers";
import { AnimatedWrapper } from "./AnimationWrapper";
import { RootUIContainer } from "./Containers";

interface ProgressProps {
  style?: any;
  otherProps?: any;
  info?: string;
}

export const ProgressIcon = ({ style, otherProps, info }: ProgressProps) => {
  const theme = useTheme();
  return (
    <>
      <CircularProgress enableTrackSlot
        sx={{ color: theme.palette.primary.dark, ...style }}
        {...otherProps} thickness={2.5}
      />
      {info && <Typography variant="body2"
        sx={{
          textAlign: "center",
          fontWeight: "500",
          fontStyle: "italic"
        }}>{info}</Typography>}
    </>
  );
};


export const PageLoaderUI = () => {
  const theme = useTheme();

  return (
    <RootUIContainer
      style={{
        alignItems: "center",
        justifyContent: "center",
      }}>
      <AnimatedWrapper sx={{
        borderRadius: theme.radius.full,
        animation: `${rotate} 1s linear infinite forwards`
      }}>
        <Image
          src={img.logo}
          alt="Loading icon"
          width={54}
          height={54} />
      </AnimatedWrapper>
    </RootUIContainer>
  );
};
