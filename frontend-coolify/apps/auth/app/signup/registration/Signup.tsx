"use client";

import React from "react";
import { Divider, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Image from "next/image";
import { asset } from "@repo/assets";
import { CLIENT_ROUTES, GenericStyle, INPUT_GUIDES } from "@repo/core";
import {
  AppButton,
  TextInput,
  PasswordInput,
  InlineMsgUI,
  ProgressIcon,
  SVGWrapper,
  AnchorLink,
  UIGuide,
  PhoneInput,
} from "@repo/shared-ui";
import { useSignup } from "./useSignup";

interface SignupProps {
  style?: {
    container?: GenericStyle;
    headline?: React.CSSProperties;
    tagline?: React.CSSProperties;
  };
}

/**
 * Unified registration layout showing inputs, country selector popups, and real-time password feedback.
 */
export const Signup: React.FC<SignupProps> = ({ style = {} }) => {
  const theme = useTheme();

  const {
    email,
    phone,
    password,
    emailValidity,
    emailValidationMsg,
    phoneValidity,
    phoneValidationMsg,
    handleEmailChange,
    handlePhoneChange,
    handlePasswordChange,
    passwordVisualStates,
    handleSubmit,
    isSubmitLoading,
    isSubmitDisabled,
    inlineMsg,
    handleLoginClick,
    clearInlineMsg,
  } = useSignup();

  const inlineLinkStyle = {
    color: theme.palette.primary.main,
    "&:hover": { textDecoration: "underline", fontWeight: 600 },
  };

  return (
    <Stack
      sx={{
        backgroundColor: theme.palette.gray[0],
        borderRadius: theme.radius[5],
        justifyContent: "center",
        alignItems: "center",
        gap: theme.gap(10),
        width: "100%",
        maxWidth: "480px",
        margin: "0 auto",
        padding: theme.boxSpacing(8),
        ...style.container,
        [theme.breakpoints.down("md")]: {
          ...style.container?.mdScreen,
        },
        [theme.breakpoints.down("sm")]: {
          width: style.container?.smScreen,
        },
      }}>
      <Image
        alt="logo"
        src={asset.logo}
        width={50}
        height={50}
        style={{
          borderRadius: `${theme.radius.full}`,
          flex: "none",
        }}
      />

      <Stack
        gap={theme.gap(4)}
        sx={{
          width: "100%",
          paddingBottom: theme.boxSpacing(6),
          [theme.breakpoints.down("md")]: {
            paddingBottom: theme.boxSpacing(12),
          },
        }}>
        <Typography
          component="h3"
          variant="h5"
          sx={{
            color: theme.palette.gray[300],
            textAlign: "center",
            ...style.headline,
          }}>
          Sign up to Funstakes
        </Typography>
        <Typography
          component="p"
          variant="body3"
          sx={{
            fontSize: 14,
            color: theme.palette.gray[200],
            textAlign: "center",
            ...style.tagline,
          }}>
          By signing up, you agree to our{" "}
          <AnchorLink url="#" style={inlineLinkStyle}>
            User Agreement
          </AnchorLink>{" "}
          and confirm you look through the{" "}
          <AnchorLink url="#" style={inlineLinkStyle}>
            Privacy Policy
          </AnchorLink>
          .
        </Typography>
      </Stack>

      {/* Third Party Providers */}
      <Stack direction="row" gap={theme.gap(4)} sx={{ width: "100%" }}>
        <AppButton
          variant="outlined"
          style={{
            fontSize: "16px",
            padding: theme.boxSpacing(4.5, 9),
            gap: theme.gap(4),
            width: "100%",
          }}
          options={{ disabled: isSubmitLoading }}>
          <SVGWrapper src={asset.googleLogo} size={20} />
          Google
        </AppButton>
        <AppButton
          variant="outlined"
          style={{
            fontSize: "16px",
            gap: theme.gap(4),
            padding: theme.boxSpacing(4.5, 9),
            width: "100%",
          }}
          options={{ disabled: isSubmitLoading }}>
          <SVGWrapper
            src={asset.appleLogo}
            size={20}
            color={theme.palette.gray[300]}
          />
          Apple
        </AppButton>
      </Stack>

      <Divider
        sx={{
          fontSize: 14,
          color: theme.palette.gray[200],
          width: "100%",
          margin: 0,
        }}>
        Or sign up with
      </Divider>

      {inlineMsg && (
        <InlineMsgUI scrollIntoView={true} msg={inlineMsg} type="ERROR" />
      )}

      {/* Input Fields Form Container */}
      <Stack
        sx={{ gap: theme.gap(6), width: "100%" }}
        component="form"
        onSubmit={handleSubmit}>
        <TextInput
          value={email}
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          onChange={handleEmailChange}
          helperText={emailValidationMsg}
          error={email !== "" && emailValidity === "INVALID"}
        />

        <PhoneInput
          value={phone}
          label="Phone Number (Optional)"
          placeholder="e.g. +1234567890"
          includeCountryCode={true}
          onPhoneChange={handlePhoneChange}
          onClearInlineMsg={clearInlineMsg}
          helperText={phoneValidationMsg}
          error={phone !== "" && phoneValidity === "INVALID"}
        />

        <Stack gap={theme.gap(4)}>
          <PasswordInput
            label="Password"
            placeholder="Create password"
            onChange={handlePasswordChange}
            value={password}
          />
          <UIGuide
            guides={[INPUT_GUIDES.PASSWORD]}
            showTitle={false}
            detailVisuals={passwordVisualStates}
            containerStyle={{
              backgroundColor: theme.palette.gray.trans[1],
              borderRadius: theme.radius[2],
            }}
          />
        </Stack>

        <AppButton
          variant="contained"
          submit
          style={{
            fontSize: "16px",
            padding: theme.boxSpacing(5.5, 9),
            width: "100%",
            marginTop: theme.gap(4),
          }}
          options={{ disabled: isSubmitDisabled }}>
          {isSubmitLoading ? (
            <ProgressIcon otherProps={{ size: 25 }} />
          ) : (
            "Sign up"
          )}
        </AppButton>
      </Stack>

      <Typography
        component="p"
        variant="body3"
        sx={{
          textAlign: "center",
          width: "100%",
          paddingTop: theme.boxSpacing(8),
          ...style.tagline,
        }}>
        Already have an account?
        <AnchorLink
          variant="text"
          onClick={handleLoginClick}
          url={CLIENT_ROUTES.login.path}
          style={{
            ...inlineLinkStyle,
            marginLeft: theme.boxSpacing(2),
          }}>
          Login
        </AnchorLink>
      </Typography>
    </Stack>
  );
};
