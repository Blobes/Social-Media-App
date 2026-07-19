"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { Stack } from "@mui/material";
import { useCachedData } from "@repo/shared-hooks";
import { CACHE_KEYS, TransitData } from "@repo/core";
import { Reset } from "./Reset";

export default function ResetPage() {
  const theme = useTheme();

  const cachedEntries = useCachedData<TransitData<"PASSWORD_RESET">>(
    CACHE_KEYS.PASS_RESET_FINALIZED_TRANSIT_DATA,
  );

  return (
    <Stack
      sx={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.boxSpacing(10),
        minHeight: "fit-content",
      }}>
      <Reset cachedEntries={cachedEntries} />
    </Stack>
  );
}
