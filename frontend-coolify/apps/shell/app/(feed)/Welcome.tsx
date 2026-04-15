"use client";

import React from "react";
import { AppButton, Footer } from "@repo/shared-ui";
import { usePage } from "@repo/shared-hooks";
import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { CLIENT_ROUTES, LISTS } from "@repo/core";

export const Welcome = () => {
  const { navigateTo } = usePage();
  const { FOOTER_NAV_LIST } = LISTS();
  const theme = useTheme();

  return (
    <>
      <Stack
        sx={{
          alignItems: "center",
          textAlign: "center",
          justifyContent: "center",
          height: "100%",
          width: "100%",
          minHeight: "fit-content",
          padding: theme.boxSpacing(12),
        }}>
        <Typography variant="h5" component="h5">
          Join millions of stakers on FunStakes
        </Typography>
        <AppButton
          href={CLIENT_ROUTES.signup.path}
          onClick={() => navigateTo(CLIENT_ROUTES.signup, { savePage: false })}>
          Get started
        </AppButton>
      </Stack>
      <Footer navList={FOOTER_NAV_LIST} navigateTo={navigateTo} />
    </>
  );
};
