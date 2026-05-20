"use client";

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Guide, TourGuide } from "../types/ui-state";

/**
 * Configuration for input validation messaging.
 */
export const INPUT_GUIDES = {
  EMAIL: {
    id: "email-guide",
    title: "Email address",
    displayAsList: true,
    guideDetails: [
      {
        id: "email-detail1",
        detail: "Must follow standard format (e.g., user@example.com)",
      },
      {
        id: "email-detail2",
        detail: "Domain part cannot contain consecutive dots",
      },
    ],
  },

  PHONE: {
    id: "phone-guide",
    title: "Phone number",
    displayAsList: true,
    guideDetails: [
      {
        id: "phone-detail1",
        detail: "Must contain between 10 and 15 digits",
      },
      {
        id: "phone-detail2",
        detail: "Supports international formats (+, brackets, hyphens)",
      },
      {
        id: "phone-detail3",
        detail: "Must contain at least one numeric digit",
      },
    ],
  },

  USERNAME: {
    id: "username-guide",
    title: "Username",
    displayAsList: true,
    guideDetails: [
      {
        id: "username-detail1",
        detail: "Length must be between 3 and 25 characters",
      },
      {
        id: "username-detail2",
        detail: "Must start with a letter (a-z, A-Z)",
      },
      {
        id: "username-detail3",
        detail: "Only letters, numbers, and underscores (_) are allowed",
      },
    ],
  },

  PASSWORD: {
    id: "password-guide",
    title: "Password",
    displayAsList: true,
    guideDetails: [
      {
        id: "pass-detail1",
        detail: "Minimum 8 characters in length",
      },
      {
        id: "pass-detail2",
        detail: "Include at least one uppercase letter",
      },
      {
        id: "pass-detail3",
        detail: "Include at least one numeric digit",
      },
      {
        id: "pass-detail4",
        detail: "Include one special character (e.g., @, $, !)",
      },
    ],
  },
} satisfies Record<string, Guide>;

export const TOUR_GUIDES = {
  NEW_USER: [
    {
      name: "BEGIN",
      label: "Let's get you started",
      desc: (
        <Stack gap={1}>
          <Typography variant="body2">Welcome to the platform!</Typography>
          <Box sx={{ p: 1, bgcolor: "primary.light", borderRadius: 1 }}>
            🚀 Custom Component Detail
          </Box>
        </Stack>
      ),
      xPosition: 50,
      yPosition: 50,
      allowPrevious: false,
    },
    {
      name: "POST",
      label: "Create a post",
      desc: "To create a post, simply use the icon in the sidebar.",
      xPosition: 20,
      yPosition: 30,
      allowPrevious: true,
    },
  ],
} satisfies Record<string, TourGuide[]>;
