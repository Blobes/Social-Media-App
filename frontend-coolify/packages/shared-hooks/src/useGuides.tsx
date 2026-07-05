"use client";

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AUTH_INPUT,
  COMMON_INPUT_VALIDATION,
  COMMON_TOUR_GUIDES,
  Guide,
  TourGuide,
} from "@repo/core";
import { useStaticTranslation } from "./useTrans";
import { TransText } from "@repo/shared-ui";

/**
 * Configuration for input validation messaging.
 */
export const useGuides = () => {
  const { translateTxtString } = useStaticTranslation();
  const theme = useTheme();

  const INPUT_GUIDES = {
    EMAIL: {
      id: "email-guide",
      title: translateTxtString(AUTH_INPUT.label.email_address),
      displayAsList: true,
      guideDetails: [
        {
          id: "email-detail1",
          detail: translateTxtString(
            COMMON_INPUT_VALIDATION.email_standard_format,
          ),
        },
        {
          id: "email-detail2",
          detail: translateTxtString(
            COMMON_INPUT_VALIDATION.email_domain_double_dot,
          ),
        },
      ],
    },

    PHONE: {
      id: "phone-guide",
      title: translateTxtString(AUTH_INPUT.label.phone_number),
      displayAsList: true,
      guideDetails: [
        {
          id: "phone-detail1",
          detail: translateTxtString(
            COMMON_INPUT_VALIDATION.phone_length_range,
          ),
        },
        {
          id: "phone-detail2",
          detail: translateTxtString(
            COMMON_INPUT_VALIDATION.phone_international_format,
          ),
        },
        {
          id: "phone-detail3",
          detail: translateTxtString(COMMON_INPUT_VALIDATION.atleast_one_digit),
        },
      ],
    },

    USERNAME: {
      id: "username-guide",
      title: translateTxtString(AUTH_INPUT.label.username),
      displayAsList: true,
      guideDetails: [
        {
          id: "username-detail1",
          detail: translateTxtString(
            COMMON_INPUT_VALIDATION.length_range_3_to_25,
          ),
        },
        {
          id: "username-detail2",
          detail: translateTxtString(COMMON_INPUT_VALIDATION.start_with_letter),
        },
        {
          id: "username-detail3",
          detail: translateTxtString(
            COMMON_INPUT_VALIDATION.only_letters_numbers_underscores,
          ),
        },
      ],
    },

    PASSWORD: {
      id: "password-guide",
      title: translateTxtString(AUTH_INPUT.label.password),
      displayAsList: true,
      guideDetails: [
        {
          id: "pass-detail1",
          detail: translateTxtString(
            COMMON_INPUT_VALIDATION.minimum_8_characters,
          ),
        },
        {
          id: "pass-detail2",
          detail: translateTxtString(
            COMMON_INPUT_VALIDATION.atleast_one_uppercase,
          ),
        },
        {
          id: "pass-detail3",
          detail: translateTxtString(COMMON_INPUT_VALIDATION.atleast_one_digit),
        },
        {
          id: "pass-detail4",
          detail: translateTxtString(
            COMMON_INPUT_VALIDATION.atleast_one_special_character,
          ),
        },
      ],
    },
  } satisfies Record<string, Guide>;

  const TOUR_GUIDES = {
    NEW_USER: [
      {
        name: "BEGIN",
        label: translateTxtString(COMMON_TOUR_GUIDES.new_user_begin_label),
        desc: (
          <Stack gap={1}>
            <TransText sx={theme.typography.body2}>
              {" "}
              {translateTxtString(COMMON_TOUR_GUIDES.new_user_begin_desc)}
            </TransText>
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
        label: translateTxtString(COMMON_TOUR_GUIDES.new_user_post_label),
        desc: translateTxtString(COMMON_TOUR_GUIDES.new_user_post_desc),
        xPosition: 20,
        yPosition: 30,
        allowPrevious: true,
      },
    ],
  } satisfies Record<string, TourGuide[]>;

  return { INPUT_GUIDES, TOUR_GUIDES };
};
