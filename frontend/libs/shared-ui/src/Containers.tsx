"use client"

import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";


interface UIProps {
  children: React.ReactNode;
  style?: any
}
export const RootUIContainer = ({ children, style }: UIProps) => {
  const theme = useTheme();
  return (
    <Stack
      sx={{
        position: "fixed",
        height: "100svh",
        width: "100%",
        gap: 0,
        backgroundColor: theme.palette.gray[0],
        ...style
      }}>
      {children}
    </Stack>
  )
}