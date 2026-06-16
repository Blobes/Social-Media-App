"use client";

import React, { useState, useTransition } from "react";
import { Trans } from "react-i18next";
import { Typography, TypographyProps } from "@mui/material";
import {
  MenuItem,
  Select,
  SelectChangeEvent,
  ListItemText,
} from "@mui/material";
import { LANGUAGES } from "@repo/core";

/**
 * Decoupled reusable dropdown interface dispatching events over the main window stream.
 */
export const LanguageSelector: React.FC = () => {
  const [isPending, startTransition] = useTransition();
  const [currentLang, setCurrentLang] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("app_lang") || "en";
    }
    return "en";
  });

  const handleLangChange = (e: SelectChangeEvent<string>) => {
    const nextLang = e.target.value;
    startTransition(() => {
      localStorage.setItem("app_lang", nextLang);
      setCurrentLang(nextLang);
      window.dispatchEvent(
        new CustomEvent("GLOBAL_LANG_CHANGED", { detail: nextLang }),
      );
    });
  };

  return (
    <Select
      value={currentLang}
      onChange={handleLangChange}
      disabled={isPending}
      size="small"
      renderValue={(selected) => {
        const lang = LANGUAGES.find((l) => l.iso === selected);
        return lang ? `${lang.flag} ${lang.title}` : selected;
      }}>
      {LANGUAGES.map((lang) => (
        <MenuItem key={lang.iso} value={lang.iso}>
          <ListItemText>
            {lang.flag} &nbsp; {lang.title}
          </ListItemText>
        </MenuItem>
      ))}
    </Select>
  );
};

interface TextProps extends Omit<TypographyProps, "children"> {
  i18nKey: string;
  values?: Record<string, string | number>;
  children?: React.ReactNode;
}
/**
 * Global reusable text wrapper supporting complex child interpolation and node substitution.
 */
export const StaticText: React.FC<TextProps> = ({
  i18nKey,
  values,
  children,
  ...typographyProps
}) => {
  return (
    <Typography {...typographyProps}>
      <Trans i18nKey={i18nKey} values={values}>
        {children}
      </Trans>
    </Typography>
  );
};
