"use client";

import React from "react";
import { Box, IconButton, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AppButton } from "./Buttons";
import { useGlobalStore } from "@repo/core";
import { ArrowLeft, Delete, Space, X } from "lucide-react";
import { TransText } from "./Text";

// Centralized keyboard matrix dictionary managed entirely inside the component
const KEYBOARD_CONFIGS: Record<
  string,
  { label: string; matrix: string[][]; rtl?: boolean }
> = {
  ar: {
    label: "لوحة مفاتيح عربية",
    rtl: true,
    matrix: [
      ["١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩", "٠"],
      ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د"],
      ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط"],
      ["ئ", "ء", "ؤ", "ر", "لا", "ى", "ة", "و", "ز", "ظ"],
    ],
  },
  ru: {
    label: "Русская раскладка",
    rtl: false,
    matrix: [
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
      ["й", "ц", "у", "к", "е", "н", "г", "ш", "щ", "з", "х", "ъ"],
      ["ф", "ы", "в", "а", "п", "р", "о", "л", "д", "ж", "э"],
      ["я", "ч", "с", "м", "и", "т", "ь", "б", "ю"],
    ],
  },
};

export interface VirtualKeyboardProps {
  onKeyClick: (char: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onClose: () => void;
}

/**
 * Standalone virtual keyboard component that manages its own language matrices via the global store.
 */
export const VirtualKeyboard = ({
  onKeyClick,
  onBackspace,
  onSpace,
  onClose,
}: VirtualKeyboardProps) => {
  const theme = useTheme();
  const currentLanguage = useGlobalStore((state) => state.currentLanguage);

  const currentConfig = KEYBOARD_CONFIGS[currentLanguage || ""] || {
    label: `${currentLanguage?.toUpperCase() || "EN"} Layout`,
    rtl: false,
    matrix: [["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]],
  };

  const sharedStyle = {
    color: theme.palette.gray[300],
    backgroundColor: theme.palette.gray.trans[1],
    borderRadius: theme.radius[3],
    height: 38,
    "&:hover": {
      backgroundColor: theme.palette.gray[50],
    },
  };

  return (
    <Box
      dir={currentConfig.rtl ? "rtl" : "ltr"}
      sx={{
        position: "absolute",
        top: "100%",
        right: 60,
        zIndex: theme.zIndex?.modal || 1300,
        width: "100%",
        maxWidth: "460px",
        marginTop: theme.gap(2),
        backgroundColor: theme.palette.gray[0],
        border: `1px solid ${theme.palette.gray.trans[1]}`,
        borderRadius: theme.radius[4],
        padding: theme.boxSpacing(4),
        boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.12)",
        display: "flex",
        flexDirection: "column",
        gap: theme.gap(3),
        [theme.breakpoints.down("md")]: {
          borderRadius: 0,
          border: "none",
        },
      }}>
      <Stack
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ padding: theme.boxSpacing(2) }}>
        <TransText
          sx={{
            ...theme.typography.caption,
            color: theme.palette.gray[200],
            fontWeight: 600,
          }}>
          {currentConfig.label}
        </TransText>
        <IconButton
          onClick={onClose}
          sx={{ backgroundColor: theme.palette.gray.trans[1], flex: "none" }}>
          <X size={18} />
        </IconButton>
      </Stack>

      {currentConfig.matrix.map((row, rowIndex) => (
        <Stack
          key={rowIndex}
          flexDirection="row"
          gap={theme.gap(2)}
          justifyContent="center">
          {row.map((char) => (
            <AppButton
              key={char}
              onClick={() => onKeyClick(char)}
              style={{
                minWidth: 30,
                fontSize: "14px",
                width: "100%",
                ...sharedStyle,
              }}>
              {char}
            </AppButton>
          ))}
        </Stack>
      ))}

      <Stack flexDirection="row" gap={theme.gap(2)}>
        <AppButton
          onClick={onSpace}
          style={{
            width: "100%",
            ...sharedStyle,
          }}>
          <Space size={28} />
        </AppButton>
        <AppButton
          onClick={onBackspace}
          style={{
            ...sharedStyle,
          }}>
          <Delete size={24} />
        </AppButton>
      </Stack>
    </Box>
  );
};
