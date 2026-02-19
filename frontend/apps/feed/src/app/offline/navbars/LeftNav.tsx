import { Stack, Typography, useTheme } from "@mui/material";
import { useStyles } from "@funstakes/hooks";
import { useRouter } from "next/navigation";

export const LeftNav = () => {
  const theme = useTheme();
  const { autoScroll } = useStyles();
  const router = useRouter();

  return (
    <Stack
      sx={{
        width: "20%",
        maxWidth: "400px",
        minWidth: "200px",
        padding: theme.boxSpacing(8, 20),
        // borderRight: `1px solid ${theme.palette.gray.trans[1]}`,
        ...autoScroll().base,
        [theme.breakpoints.down("md")]: {
          display: "none",
          ...autoScroll().mobile,
        },
      }}>
      <Typography>Offline Left hand navigation</Typography>
    </Stack>
  );
};
