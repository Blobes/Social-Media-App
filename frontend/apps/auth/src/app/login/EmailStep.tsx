"use client"

import { Stack, Typography } from "@mui/material";
import { useGlobalContext } from "@shared-state";
import { AppButton, TextInput, DrawerRef, InlineMsg, ProgressIcon } from "@shared-ui";
import { useTheme } from "@mui/material/styles";
import { GenericObject } from "libs/helper/src/types";
import { Mail } from "lucide-react";
import { useEmail } from "./hooks/useEmail";

interface StepProps {
    modalRef?: React.RefObject<DrawerRef>;
    step?: string;
    setStep?: (step: string) => void;
    existingEmail?: string;
    setEmailProp?: (email: string) => void;
    style?: {
        headline?: GenericObject<string>;
        tagline?: GenericObject<string>;
    };
}

export const EmailStep: React.FC<StepProps> = ({
    setStep,
    existingEmail,
    setEmailProp,
    style = {},
}) => {
    const theme = useTheme();
    const { inlineMsg } = useGlobalContext();

    // Use the controller
    const { email, validity, validationMsg, isAuthLoading, handleChange,
        handleSubmit, isSubmitDisabled } = useEmail({ existingEmail, setStep, setEmailProp });

    return (
        <>
            <Stack>
                <Typography component="h3" variant="h5"
                    sx={{ textAlign: "center", ...style.headline }}>
                    Blobes Socials, A Place For Nigerians
                </Typography>
                <Typography component="p" variant="body2" sx={{
                    color: theme.palette.gray[200],
                    paddingBottom: theme.boxSpacing(8),
                    textAlign: "center",
                    ...style.tagline,
                }}>
                    Enter your email address to continue.
                </Typography>
            </Stack>

            {inlineMsg && <InlineMsg msg={inlineMsg} type="ERROR" />}

            <Stack sx={{ gap: theme.gap(18) }} component="form" onSubmit={handleSubmit}>
                <TextInput
                    defaultValue={email}
                    label="Email"
                    placeholder="Enter your email address"
                    onChange={handleChange}
                    helperText={validationMsg}
                    error={email !== "" && validity === "invalid"}
                    affix={
                        <Mail size={19} style={{ stroke: theme.palette.gray[200] as string }} />
                    }
                    affixPosition="end" />

                <AppButton
                    variant="contained"
                    submit
                    style={{ fontSize: "16px", padding: theme.boxSpacing(5.5, 9), width: "100%" }}
                    options={{ disabled: isSubmitDisabled }}>
                    {isAuthLoading ? <ProgressIcon otherProps={{ size: 25 }} /> : "Continue"}
                </AppButton>
            </Stack>
        </>
    );
};