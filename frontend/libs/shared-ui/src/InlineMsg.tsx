"use client"

import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface MsgProps {
  msg: string;
  type?: "SUCCESS" | "ERROR";
}

export const InlineMsg: React.FC<MsgProps> = ({ msg, type = "ERROR" }) => {
  const theme = useTheme();
  return (
    <Typography
      variant="body3"
      sx={{
        p: theme.boxSpacing(3, 5),
        borderRadius: theme.radius[2],
        border: `1px solid ${theme.palette.gray.trans[1]}`,
        backgroundColor:
          type === "SUCCESS"
            ? theme.palette.info.main
            : theme.palette.info.light,
      }}>
      {msg}
    </Typography>
  );
};
