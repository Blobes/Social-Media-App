import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { Resend } from "resend";
import { IEmailDispatchTokens } from "../../../types";
import { EmailOtpParams, getEmailOtpVariables } from "./variables";
import { renderEmailOtpHtml } from "./emailTemplate";

const FORCE_SMTP_TEST = false;

/**
 * Dispatches an OTP verification email using Resend with a self-hosted Stalwart SMTP fallback.
 */
export async function dispatchEmailCode(
  { code, recipient }: EmailOtpParams,
  dispatchConfig: IEmailDispatchTokens,
) {
  const resendApiKey = dispatchConfig.RESEND_API_KEY;
  const resendFromEmail = dispatchConfig.RESEND_FROM_EMAIL;

  // Construct template parameters and render HTML
  const variables = getEmailOtpVariables({ code, recipient });
  const htmlContent = renderEmailOtpHtml(variables);

  // -----------------------------
  // 1. PRIMARY: RESEND DISPATCH
  // -----------------------------
  if (!FORCE_SMTP_TEST && resendApiKey && resendFromEmail) {
    try {
      const resend = new Resend(resendApiKey);

      const response = await resend.emails.send({
        from: resendFromEmail,
        to: recipient.email,
        subject: `${code} is your verification code`,
        html: htmlContent,
      });

      // Explicitly check for Resend API errors
      if (response.error) {
        console.error("❌ Resend API returned error:", response.error);
        throw new Error(
          `Resend error: ${response.error.name} - ${response.error.message}`,
        );
      }

      if (!response.data?.id) {
        console.error("❌ Resend dispatch missing email ID:", response);
        throw new Error("Resend response missing dispatch confirmation ID");
      }

      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        "❌ Resend failed → attempting Stalwart SMTP fallback:",
        message,
      );
    }
  } else {
    console.warn(
      "⚠️ Skipping Resend: RESEND_API_KEY or RESEND_FROM_EMAIL missing in config",
    );
  }

  // -----------------------------
  // 2. FALLBACK: STALWART SMTP
  // -----------------------------
  const smtpHost = dispatchConfig.SMTP_HOST_EMAIL;
  const smtpPort = Number(dispatchConfig.SMTP_PORT) || 587;
  const smtpUser = dispatchConfig.SMTP_USER;
  const smtpPassword = dispatchConfig.SMTP_PASSWORD;

  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.error(
      "❌ Stalwart SMTP fallback skipped: missing configuration tokens.",
    );
    throw new Error(
      "Email dispatch failed completely: Resend failed and SMTP configuration is incomplete.",
    );
  }

  const isProduction = process.env.NODE_ENV === "production";
  const transportOptions: SMTPTransport.Options = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // True for port 465, false for 587 (STARTTLS)
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    // Enforce TLS connection security
    tls: {
      rejectUnauthorized: isProduction,
    },
  };

  const transporter = nodemailer.createTransport(transportOptions);

  try {
    const info = await transporter.sendMail({
      from: smtpUser,
      to: recipient.email,
      subject: `${code} is your verification code`,
      html: htmlContent,
    });

    if (info.rejected && info.rejected.length > 0) {
      const rejectedList = info.rejected.join(", ");
      console.error(`❌ Stalwart SMTP rejected recipients: ${rejectedList}`);
      throw new Error(`SMTP rejected recipients: ${rejectedList}`);
    }

    return info;
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "SMTP email send failed";
    console.error(
      "❌ Both Resend and Stalwart SMTP fallback failed:",
      errorMessage,
    );
    throw new Error(`Email dispatch failed completely: ${errorMessage}`);
  }
}
