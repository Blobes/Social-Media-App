"use client";

import React from "react";
import { Stack, Fade } from "@mui/material";
import { IsolatedProps } from "./IsolatedMedia";

export const IsolatedFooter = ({
  isDesktop,
  postEngagment,
  postHeader,
  postCaption,
  hideInfo,
}: Partial<IsolatedProps>) => {
  return (
    <Fade in={!hideInfo}>
      {isDesktop ? (
        <Stack sx={{ p: 2 }}>
          {postHeader}
          {postCaption}
        </Stack>
      ) : (
        <Stack sx={{ p: 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start">
            <Stack>
              {postHeader}
              {postCaption}
            </Stack>
            {postEngagment}
          </Stack>
        </Stack>
      )}
    </Fade>
  );
};
