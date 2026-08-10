import nodemailer from "nodemailer";
import { Resend } from "resend";
import { IEmailDispatchTokens } from "../../types";
import {
  EmailOtpParams,
  getEmailOtpVariables,
  getFlatEmailOtpVariables,
} from "./variables";
import { renderEmailOtpHtml } from "./emailTemplate";

/**
 * Dispatches an OTP verification email using Resend templates with a Nodemailer SMTP fallback.
 */
export async function dispatchEmailCode(
  { code, recipient, templateId }: EmailOtpParams,
  dispatchConfig: IEmailDispatchTokens,
) {
  const resendApiKey = dispatchConfig.RESEND_API_KEY;
  const resendFromEmail = dispatchConfig.RESEND_FROM_EMAIL;
  const targetTemplateId = templateId || "account-verification-template";

  // Construct template parameters using structured variable generator
  const variables = getEmailOtpVariables({ code, recipient });
  const flattenedVariables = getFlatEmailOtpVariables({ code, recipient });

  // -----------------------------
  // 1. TRY RESEND FIRST
  // -----------------------------
  try {
    const resend = new Resend(resendApiKey);

    if (!resendFromEmail) {
      throw new Error("RESEND_FROM not set");
    }

    const response = await resend.emails.send({
      from: resendFromEmail,
      to: recipient.email,
      subject: `${code} is your verification code`,
      template: {
        id: targetTemplateId,
        variables: flattenedVariables,
      },
    });

    if (response.error) {
      throw new Error(
        response.error.message || "Resend template dispatch failed",
      );
    }

    return response;
  } catch (err) {
    console.error("❌ Resend failed → will try SMTP fallback:", err);
  }

  // -----------------------------
  // 2. DETERMINE SMTP PROVIDER
  // -----------------------------
  let provider: "gmail" | "outlook" | "yahoo" | "smtp";

  if (recipient.email.includes("@gmail.")) provider = "gmail";
  else if (
    recipient.email.includes("@outlook.") ||
    recipient.email.includes("@hotmail.")
  )
    provider = "outlook";
  else if (recipient.email.includes("@yahoo.")) provider = "yahoo";
  else provider = "smtp";

  // -----------------------------
  // 3. CONFIGURE SMTP TRANSPORTER
  // -----------------------------
  let transporterConfig: Record<string, unknown>;

  switch (provider) {
    case "gmail":
      transporterConfig = {
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: dispatchConfig.GMAIL_USER,
          clientId: dispatchConfig.GMAIL_CLIENT_ID,
          clientSecret: dispatchConfig.GMAIL_CLIENT_SECRET,
          refreshToken: dispatchConfig.GMAIL_REFRESH_TOKEN,
        },
      };
      break;

    case "outlook":
      transporterConfig = {
        service: "hotmail",
        auth: {
          user: dispatchConfig.HOTMAIL_USER,
          pass: dispatchConfig.HOTMAIL_PASSWORD,
        },
      };
      break;

    case "yahoo":
      transporterConfig = {
        service: "yahoo",
        auth: {
          user: dispatchConfig.YAHOO_USER,
          pass: dispatchConfig.YAHOO_PASSWORD,
        },
      };
      break;

    default:
      transporterConfig = {
        host: dispatchConfig.SMTP_HOST_EMAIL || "smtp.ethereal.email",
        port: Number(dispatchConfig.SMTP_PORT) || 587,
        auth: {
          user: dispatchConfig.SMTP_USER,
          pass: dispatchConfig.SMTP_PASSWORD,
        },
      };
  }

  const transporter = nodemailer.createTransport(transporterConfig);

  // -----------------------------
  // 4. SEND WITH STRICT ERROR HANDLING
  // -----------------------------
  try {
    const fallbackFrom =
      dispatchConfig.GMAIL_USER ||
      (transporterConfig.auth as { user?: string })?.user;

    const info = await transporter.sendMail({
      from: fallbackFrom,
      to: recipient.email,
      subject: `${code} is your verification code`,
      html: renderEmailOtpHtml(variables),
    });

    if (info.rejected && info.rejected.length > 0) {
      throw new Error(`SMTP rejected recipients: ${info.rejected.join(", ")}`);
    }

    return info;
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "SMTP email send failed";
    console.error("❌ SMTP failed:", err);
    throw new Error(errorMessage);
  }
}
