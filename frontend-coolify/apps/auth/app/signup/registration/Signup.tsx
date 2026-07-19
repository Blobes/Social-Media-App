"use client";

import React from "react";
import { Divider, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Image from "next/image";
import { asset } from "@repo/assets";
import {
  AUTH_BUTTON_LABELS,
  AUTH_FEEDBACK,
  AUTH_INPUT,
  CLIENT_ROUTES,
  COMMON_FEEDBACK,
  GenericStyle,
} from "@repo/core";
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
  TransText,
} from "@repo/shared-ui";
import { useSignup } from "./useSignup";
import { useGuides, useStaticTranslation } from "@repo/shared-hooks";

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
  const { INPUT_GUIDES } = useGuides();

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

  const { translateTxtString } = useStaticTranslation();

  const inlineLinkStyle = {
    color: theme.palette.primary.main,
    flex: "none",
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
        <TransText
          {...COMMON_FEEDBACK.sign_up_to_funstakes}
          component="h3"
          breakWord
          sx={{
            ...theme.typography.h5,
            color: theme.palette.gray[300],
            textAlign: "center",
            ...style.headline,
          }}
        />
        <TransText
          {...COMMON_FEEDBACK.user_terms_agreement}
          component="p"
          inlineComponents={{
            agreement: (
              <AnchorLink href="/user-agreement" style={inlineLinkStyle} />
            ),
            policy: (
              <AnchorLink href="/privacy-policy" style={inlineLinkStyle} />
            ),
          }}
          sx={{
            ...theme.typography.text5,
            color: theme.palette.gray[200],
            paddingBottom: theme.boxSpacing(2),
            textAlign: "center",
            ...style.tagline,
          }}
        />
      </Stack>

      {/* Third Party Providers */}
      <Stack direction="row" gap={theme.gap(4)} sx={{ width: "100%" }}>
        <AppButton
          variant="outlined"
          style={{
            ...theme.typography.text3,
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
            ...theme.typography.text3,
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
          ...theme.typography.text5,
          color: theme.palette.gray[200],
          width: "100%",
          margin: 0,
        }}>
        <TransText {...AUTH_FEEDBACK.or_sign_up_with} noComponent />
      </Divider>

      {inlineMsg && (
        <InlineMsgUI scrollIntoView={true} msg={inlineMsg} type="ERROR" />
      )}

      {/* Input Fields Form Container */}
      <Stack
        sx={{ gap: theme.gap(6), width: "100%" }}
        component="form"
        onSubmit={handleSubmit}
        noValidate>
        <TextInput
          value={email}
          type="email"
          label={translateTxtString(AUTH_INPUT.label.email_address)}
          placeholder={translateTxtString(
            AUTH_INPUT.placeholder.enter_your_email,
          )}
          onChange={handleEmailChange}
          helperText={emailValidationMsg}
          error={email !== "" && emailValidity === "INVALID"}
        />

        <PhoneInput
          value={phone}
          label={translateTxtString(AUTH_INPUT.label.phone_optional)}
          placeholder={translateTxtString(AUTH_INPUT.placeholder.phone_example)}
          includeCountryCode={true}
          onPhoneChange={handlePhoneChange}
          onClearInlineMsg={clearInlineMsg}
          helperText={phoneValidationMsg}
          error={phone !== "" && phoneValidity === "INVALID"}
        />

        <PasswordInput
          label={translateTxtString(AUTH_INPUT.label.password)}
          placeholder={translateTxtString(
            AUTH_INPUT.placeholder.create_password,
          )}
          onChange={handlePasswordChange}
          value={password}
          inputGuideUI={
            <UIGuide
              guides={[INPUT_GUIDES.PASSWORD]}
              showTitle={false}
              detailVisuals={passwordVisualStates}
              containerStyle={{
                backgroundColor: theme.palette.gray.trans[1],
                borderRadaius: theme.radius[2],
              }}
            />
          }
        />

        <AppButton
          variant="contained"
          submit
          style={{
            ...theme.typography.text3,
            padding: theme.boxSpacing(5.5, 9),
            width: "100%",
            marginTop: theme.gap(4),
          }}
          options={{ disabled: isSubmitDisabled }}>
          {isSubmitLoading ? (
            <ProgressIcon otherProps={{ size: 25 }} />
          ) : (
            <TransText {...AUTH_BUTTON_LABELS.signup} noComponent />
          )}
        </AppButton>
      </Stack>
      <Stack
        sx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: theme.boxSpacing(8),
          gap: theme.gap(2),
        }}>
        <TransText
          {...AUTH_FEEDBACK.already_have_an_account}
          component="p"
          sx={{
            ...theme.typography.text4,
            textAlign: "center",
            width: "100%",
            ...style.tagline,
          }}
        />
        <AnchorLink
          onClick={handleLoginClick}
          href={CLIENT_ROUTES.login.path}
          style={{
            ...inlineLinkStyle,
          }}>
          <TransText {...AUTH_BUTTON_LABELS.login} noComponent />
        </AnchorLink>
      </Stack>
    </Stack>
  );
};
