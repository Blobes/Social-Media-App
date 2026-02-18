"use client"

import { AppButton } from "@funstakes/shared-ui";
import { clientRoutes } from "@funstakes/helpers";
import { Stack, Typography } from "@mui/material"
import { useTheme } from "@mui/material/styles";
import { useMisc } from "@funstakes/hooks";
import { LogOut, LogOutIcon } from "lucide-react";
import { useLogout } from "./useLogout";

export const ComfirmLogout = () => {
    const { closeModal } = useMisc();
    const { handleLogout } = useLogout()

    return (
        <Stack
            sx={{
                alignItems: "center",
                textAlign: "center",
                justifyContent: "center",
            }}>
            <LogOutIcon />
            <Typography variant="h4" component="h4">
                Do you really want to logout?
            </Typography>
            <Stack direction="row">
                <AppButton variant="outlined" href={clientRoutes.signup.path}
                    onClick={closeModal}>
                    Not really
                </AppButton>
                <AppButton href={clientRoutes.signup.path}
                    onClick={async () => await handleLogout()}>
                    Sure I do
                </AppButton>
            </Stack>
        </Stack>
    )
}

export const Logout = () => {
    const { openModal } = useMisc();
    const theme = useTheme();

    return (
        <AppButton
            variant="text"
            onClick={() => openModal({ content: <ComfirmLogout /> })}
            style={{
                width: "100%",
                gap: theme.gap(10),
                padding: theme.boxSpacing(0),
                "& svg": { width: "22px", height: "22px" },
                "&:hover": {
                    background: "none"
                },
            }}>
            <LogOut />
            <Typography variant="body2"
                sx={{
                    fontWeight: "600",
                    fontSize: "18px",
                    textAlign: "left",
                    "&:hover": {
                        color: theme.palette.primary.dark,
                    },
                }}>
                Logout
            </Typography>
        </AppButton>
    )
}

