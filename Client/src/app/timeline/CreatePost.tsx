"use client";

import { Stack, FormControl } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAppContext } from "@/app/AppContext";
import { UserAvatar } from "@/app/user/components/UserAvatar";
import { Image, PlayCircle } from "@mui/icons-material";
import { ResponsiveTextarea } from "@/shared/components/TextArea";
import { CustomButton } from "@/shared/components/Buttons";

export const CreatePost = () => {
  const theme = useTheme();
  const { user } = useAppContext();
  if (!user) {
    return null;
  }
  const { firstName } = user;
  return (
    <Stack
      sx={{
        backgroundColor: theme.palette.gray.trans[1],
        borderRadius: theme.radius[2],
        margin: theme.boxSpacing(8, 8, 0, 8),
        flexDirection: "column",
        padding: theme.boxSpacing(6),
        gap: theme.gap(2),
      }}>
      <Stack
        sx={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyItems: "flex-start",
          gap: theme.gap(2),
        }}>
        <UserAvatar
          user={user}
          style={{
            width: "26px",
            height: "26px",
          }}
        />
        <FormControl fullWidth>
          <ResponsiveTextarea
            placeholder={`${firstName} express yourself today...`}
          />
        </FormControl>
      </Stack>
      <Stack
        sx={{
          paddingLeft: theme.boxSpacing(3),
          borderRadius: theme.radius[2],
          flexDirection: "row",
          alignItems: "center",
        }}>
        <CustomButton
          variant="contained"
          label="Image"
          icon={<Image sx={{ width: "20px", fill: "#E9741B" }} />}
          style={{
            fontSize: "14px",
            backgroundColor: theme.palette.gray.trans[1],
            borderRadius: theme.radius.full,
            "&:hover": {
              backgroundColor: theme.palette.gray.trans[2],
            },
          }}
        />
        <CustomButton
          variant="contained"
          label="Video"
          icon={<PlayCircle sx={{ width: "20px", fill: "#18CD63" }} />}
          style={{
            fontSize: "14px",
            backgroundColor: theme.palette.gray.trans[1],
            borderRadius: theme.radius.full,
            "&:hover": {
              backgroundColor: theme.palette.gray.trans[2],
            },
          }}
        />
      </Stack>
    </Stack>
  );
};
