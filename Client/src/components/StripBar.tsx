import { GenericObject } from "@/types";
import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import React from "react";

interface Item {
  text?: string;
  element?: React.ReactNode;
}

interface StripProps {
  items: Item[];
  style?: GenericObject<string>;
}

export const Strip = ({ items = [], style = {} }: StripProps) => {
  const theme = useTheme();
  return (
    <Stack
      sx={{
        gap: theme.gap(4),
        flexDirection: "row",
        alignItems: "center",
        ...style,
      }}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <Typography
            variant="body2"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: theme.gap(3),
              color: theme.palette.gray[200],
              textAlign: "center",
            }}>
            {item.element && item.element}
            {item.text && item.text}
          </Typography>

          {index < items.length - 1 && (
            <Box
              sx={{
                width: "3px",
                height: "3px",
                backgroundColor: theme.palette.gray[200],
                borderRadius: theme.radius["full"],
              }}
            />
          )}
        </React.Fragment>
      ))}
    </Stack>
  );
};
