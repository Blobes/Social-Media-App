"use client";

import { Divider, Stack, } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavLists, usePage } from "@funstakes/hooks";
import { AnchorLink } from "./Buttons";
import React from "react";


export const Footer = () => {
  const theme = useTheme();

  const { footerNavList } = useNavLists();
  const { navigateTo } = usePage();


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
      {footerNavList.map((item, index) => (
        <React.Fragment key={index}>
          <AnchorLink
            url={item.url ?? "#"}
            onClick={() => {
              if (item.title && item.url)
                navigateTo({ title: item.title, path: item.url, }, { loadPage: true })
            }}
            style={{
              color: theme.palette.gray[200],
              fontSize: "12px",
              fontWeight: "600",
              "&:hover": { color: theme.palette.gray[300] },
            }}>
            {item.title}
          </AnchorLink>

          {index !== footerNavList.length - 1 && (
            <Divider
              orientation="vertical"
              flexItem
              sx={{ mx: 1, height: "14px", width: "unset" }}
            />
          )}
        </React.Fragment>
      ))}
    </Stack>
  );
};
