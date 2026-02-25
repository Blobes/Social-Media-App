"use client"

import { IconButton, Stack, Typography } from "@mui/material";
import { AppButton, PasswordInput, InlineMsg, BasicTooltip, ProgressIcon } from "@repo/shared-ui";
import { useTheme } from "@mui/material/styles";
import { GenericObject } from "@repo/types";
import { Pencil } from "lucide-react";
import { useLogin } from "./hooks/useLogin";
import { clientRoutes } from "@repo/helpers";


interface StepProps {
    email: string;
    step?: string;
    setStep?: (step: string) => void;
    redirectTo?: string;
    style?: {
        headline?: GenericObject<string>;
        tagline?: GenericObject<string>;
    };
}

export const PasswordStep: React.FC<StepProps> = ({ email, setStep, style = {} }) => {
    const theme = useTheme();

    // Consuming the controller
    const {
        password,
        passwordValidity,
        errorMsg,
        onPasswordChange,
        handleSubmit,
        isAuthLoading,
        inlineMsg,
        isLocked,
    } = useLogin({ email, setStep });

    return (
        <>
            <Stack>
                <Typography component="h4" variant="h5" sx={{ textAlign: "center", ...style.headline }}>
                    Welcome back buzzer!
                </Typography>
                <Typography
                    component="p"
                    variant="body2"
                    sx={{
                        color: theme.palette.gray[200],
                        paddingBottom: theme.boxSpacing(8),
                        textAlign: "center",
                        ...style.tagline
                    }}>
                    Enter your password to login.
                </Typography>
            </Stack>

            {!isAuthLoading && inlineMsg && <InlineMsg msg={inlineMsg} type="ERROR" />}

            <Stack sx={{ gap: theme.gap(18) }}
                component="form"
                onSubmit={handleSubmit}>
                <Stack gap={theme.gap(8)}>
                    <Stack direction="row">
                        <Typography component="p" variant="body2" sx={{
                            textAlign: "left",
                            padding: theme.boxSpacing(6, 8),
                            borderRadius: theme.radius[3],
                            color: theme.palette.primary.dark,
                            border: `1px solid ${theme.fixedColors.mainTrans}`,
                            backgroundColor: theme.fixedColors.mainTrans,
                            width: "100%",
                            fontWeight: "500",
                            fontSize: "16px"
                        }}>
                            {email}
                        </Typography>
                        <BasicTooltip title={"Change email"}>
                            <IconButton
                                sx={{
                                    padding: theme.boxSpacing(3, 4),
                                    color: theme.palette.gray[200],
                                    border: `1px solid ${theme.palette.gray.trans[1]}`,
                                    borderRadius: theme.radius[3],
                                    width: "48px",
                                    backgroundColor: theme.fixedColors.mainTrans,
                                }}
                                onClick={() => setStep?.("email")}>
                                <Pencil style={{ width: "20px", stroke: theme.palette.gray[200] }} />
                            </IconButton>
                        </BasicTooltip>
                    </Stack>
                    <PasswordInput
                        label="Password"
                        placeholder="Password"
                        onChange={onPasswordChange}
                        helperText={errorMsg}
                        error={password === "" && passwordValidity === "invalid"} />
                </Stack>

                <AppButton
                    variant="contained"
                    submit
                    style={{ fontSize: "16px", padding: theme.boxSpacing(6, 9), width: "100%" }}
                    options={{
                        disabled:
                            passwordValidity === "invalid" ||
                            password === "" ||
                            isLocked || // Now using the boolean from controller
                            isAuthLoading,
                    }}>
                    {isAuthLoading ? <ProgressIcon otherProps={{ size: 25 }} /> : "Login"}
                </AppButton>
            </Stack>
        </>
    );
};