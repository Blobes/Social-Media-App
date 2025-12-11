import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface MsgProps {
  msg: string;
  type?: "SUCCESS" | "ERROR" | "NORMAL";
}

export const InlineMsg: React.FC<MsgProps> = ({ msg, type = "NORMAL" }) => {
  const theme = useTheme();
  return (
    <Typography
      variant="body3"
      sx={{
        p: theme.boxSpacing(3, 5),
        borderRadius: theme.radius[2],
        color:
          type === "NORMAL"
            ? theme.palette.gray[100]
            : type === "SUCCESS"
            ? theme.palette.success.main
            : theme.palette.error.main,
        backgroundColor:
          type === "NORMAL"
            ? theme.palette.gray.trans[2]
            : type === "SUCCESS"
            ? theme.palette.success.light
            : theme.palette.error.light,
      }}>
      {msg}
    </Typography>
  );
};
