"use client";

import React from "react";
import { AppButton, Footer } from "@repo/shared-ui";
import { clientRoutes } from "@repo/helpers";
import { useNavLists, usePage } from "@repo/shared-state";
import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export const Welcome = () => {
  const { navigateTo } = usePage();
  const { footerNavList } = useNavLists();
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
          href={clientRoutes.signup.path}
          onClick={() => navigateTo(clientRoutes.signup, { savePage: false })}>
          Get started
        </AppButton>
      </Stack>
      <Footer navList={footerNavList} navigateTo={navigateTo} />
    </>
  );
};
