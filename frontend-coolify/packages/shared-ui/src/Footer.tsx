"use client";

import React from "react";
import { Divider, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AnchorLink } from "./Buttons";
import { Fragment } from "react";
import { IMenuItem, IPage } from "@repo/core";
import { LanguageSelector } from "./Localize";

interface footerProps {
  navList: IMenuItem[];
  navigateTo: (savePage: IPage, options: any) => void;
}

/**
 * Renders the application footer link ecosystem with dynamic localization routing.
 */
export const Footer = ({ navList, navigateTo }: footerProps) => {
  const theme = useTheme();

  return (
    <Stack
      sx={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.gap(2),
        width: "100%",
        padding: theme.boxSpacing(6, 12),
      }}>
      {navList.map((item, index) => (
        <Fragment key={index}>
          <AnchorLink
            size="x-small"
            href={item.url ?? "#"}
            onClick={() => {
              if (item.title && item.url)
                navigateTo(
                  { title: item.title, path: item.url },
                  { loadPage: true },
                );
            }}
            style={{
              color: theme.palette.gray[200],
              "&:hover": { color: theme.palette.gray[300] },
            }}>
            {item.title}
          </AnchorLink>

          {index !== navList.length - 1 && (
            <Divider
              orientation="vertical"
              flexItem
              sx={{ mx: theme.gap(4), height: "14px", width: "unset" }}
            />
          )}
        </Fragment>
      ))}
      <Divider
        orientation="vertical"
        flexItem
        sx={{ ml: theme.gap(4), height: "14px", width: "unset" }}
      />
      <LanguageSelector />
    </Stack>
  );
};
