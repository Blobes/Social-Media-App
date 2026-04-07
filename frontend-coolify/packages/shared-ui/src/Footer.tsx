"use client";

import React from "react";
import { Divider, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AnchorLink } from "./Buttons";
import { Fragment } from "react";
import { INavItem, IPage } from "@repo/types";

interface footerProps {
  navList: INavItem[];
  navigateTo: (savePage: IPage, options: any) => void;
}

export const Footer = ({ navList, navigateTo }: footerProps) => {
  const theme = useTheme();

  return (
    <Stack
      sx={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        padding: theme.boxSpacing(6, 12),
      }}>
      {navList.map((item, index) => (
        <Fragment key={index}>
          <AnchorLink
            url={item.url ?? "#"}
            onClick={() => {
              if (item.title && item.url)
                navigateTo(
                  { title: item.title, path: item.url },
                  { loadPage: true },
                );
            }}
            style={{
              color: theme.palette.gray[200],
              fontSize: "12px",
              fontWeight: "600",
              "&:hover": { color: theme.palette.gray[300] },
            }}>
            {item.title}
          </AnchorLink>

          {index !== navList.length - 1 && (
            <Divider
              orientation="vertical"
              flexItem
              sx={{ mx: 1, height: "14px", width: "unset" }}
            />
          )}
        </Fragment>
      ))}
    </Stack>
  );
};
