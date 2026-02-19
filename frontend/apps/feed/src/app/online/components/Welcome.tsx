"use client"

import { AppButton, Footer } from "@funstakes/shared-ui";
import { clientRoutes } from "@funstakes/helpers";
import { usePage } from "@funstakes/hooks";
import { Stack, Typography } from "@mui/material"
import { useTheme } from "@mui/material/styles";

export const Welcome = () => {
    const { navigateTo } = usePage();
    const theme = useTheme();

    return (
        <>
            <Stack
                sx={{
                    alignItems: "center",
                    textAlign: "center",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%",
                    minHeight: "fit-content",
                    padding: theme.boxSpacing(12),
                }}>
                <Typography variant="h5" component="h5">
                    Join millions of stakers on FunStakes
                </Typography>
                <AppButton
                    href={clientRoutes.signup.path}
                    onClick={(e: React.MouseEvent) =>
                        navigateTo(clientRoutes.signup,
                            {
                                type: "element",
                                savePage: false,
                                loadPage: true,
                                event: e
                            })
                    }>
                    Get started
                </AppButton>
            </Stack>
            <Footer />
        </>
    )
}


