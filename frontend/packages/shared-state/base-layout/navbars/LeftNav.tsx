import { Stack, Typography, useTheme } from "@mui/material";
import { autoScroll } from "@repo/helpers";


export const LeftNav = () => {
  const theme = useTheme();

  return (
    <Stack
      sx={{
        width: "24%",
        maxWidth: "400px",
        minWidth: "200px",
        padding: theme.boxSpacing(8, 20),
        //  borderRight: `1px solid ${theme.palette.gray.trans[1]}`,
        //  backgroundColor: theme.palette.gray.trans[1],
        ...autoScroll().base,
        [theme.breakpoints.down("md")]: {
          display: "none",
          ...autoScroll().mobile,
        },
      }}>
      <Typography>Left hand navigation</Typography>
    </Stack>
  );
};
