import nodemailer from "nodemailer";
import { Resend } from "resend";
import { IEmailDispatchTokens } from "../../types";
import { EmailOtpParams, getEmailOtpVariables } from "./variables";
import { renderEmailOtpHtml } from "./emailTemplate";

/\*\*

- Dispatches an OTP verification email using Resend with a Nodemailer SMTP fallback.
  \*/
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
// 1. TRY RESEND FIRST
// -----------------------------
if (resendApiKey && resendFromEmail) {
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
      console.error("❌ Resend failed → attempting SMTP fallback:", message);
    }

} else {
console.warn(
"⚠️ Skipping Resend: RESEND_API_KEY or RESEND_FROM_EMAIL missing in config",
);
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

// Helper fallback transporter for missing service credentials
const getDefaultSmtpConfig = () => ({
host: dispatchConfig.SMTP_HOST_EMAIL || "smtp.ethereal.email",
port: Number(dispatchConfig.SMTP_PORT) || 587,
auth: {
user: dispatchConfig.SMTP_USER,
pass: dispatchConfig.SMTP_PASSWORD,
},
});

switch (provider) {
case "gmail":
if (
!dispatchConfig.GMAIL_USER ||
!dispatchConfig.GMAIL_CLIENT_ID ||
!dispatchConfig.GMAIL_CLIENT_SECRET ||
!dispatchConfig.GMAIL_REFRESH_TOKEN
) {
console.warn(
"⚠️ Missing Gmail OAuth tokens → falling back to default SMTP configuration",
);
transporterConfig = getDefaultSmtpConfig();
} else {
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
}
break;

    case "outlook":
      if (!dispatchConfig.HOTMAIL_USER || !dispatchConfig.HOTMAIL_PASSWORD) {
        console.warn(
          "⚠️ Missing Hotmail/Outlook credentials → falling back to default SMTP configuration",
        );
        transporterConfig = getDefaultSmtpConfig();
      } else {
        transporterConfig = {
          service: "hotmail",
          auth: {
            user: dispatchConfig.HOTMAIL_USER,
            pass: dispatchConfig.HOTMAIL_PASSWORD,
          },
        };
      }
      break;

    case "yahoo":
      if (!dispatchConfig.YAHOO_USER || !dispatchConfig.YAHOO_PASSWORD) {
        console.warn(
          "⚠️ Missing Yahoo credentials → falling back to default SMTP configuration",
        );
        transporterConfig = getDefaultSmtpConfig();
      } else {
        transporterConfig = {
          service: "yahoo",
          auth: {
            user: dispatchConfig.YAHOO_USER,
            pass: dispatchConfig.YAHOO_PASSWORD,
          },
        };
      }
      break;

    default:
      transporterConfig = getDefaultSmtpConfig();

}

const transporter = nodemailer.createTransport(transporterConfig);

// -----------------------------
// 4. SEND WITH STRICT ERROR HANDLING
// -----------------------------
try {
const fallbackFrom =
dispatchConfig.GMAIL_USER ||
dispatchConfig.HOTMAIL_USER ||
dispatchConfig.YAHOO_USER ||
(transporterConfig.auth as { user?: string })?.user ||
resendFromEmail;

    if (!fallbackFrom) {
      throw new Error("No sender email available for SMTP fallback");
    }

    const info = await transporter.sendMail({
      from: fallbackFrom,
      to: recipient.email,
      subject: `${code} is your verification code`,
      html: htmlContent,
    });

    if (info.rejected && info.rejected.length > 0) {
      const rejectedList = info.rejected.join(", ");
      console.error(`❌ SMTP rejected recipients: ${rejectedList}`);
      throw new Error(`SMTP rejected recipients: ${rejectedList}`);
    }

    return info;

} catch (err: unknown) {
const errorMessage =
err instanceof Error ? err.message : "SMTP email send failed";
console.error("❌ Both Resend and SMTP fallback failed:", errorMessage);
throw new Error(`Email dispatch failed completely: ${errorMessage}`);
}
}

/\*\*

- Dispatches an OTP verification SMS via Telnyx for global and fallback routes.
  \*/
  async function sendGlobalSms(
  { phoneNumber, code }: PhoneRecipient,
  dispatchConfig: IPhoneDispatchTokens,
  ): Promise<Record<string, unknown>> {
  const apiKey = dispatchConfig.GLOBAL_SMS_API_KEY;
  const senderId = dispatchConfig.GLOBAL_SMS_SENDER_ID;

if (!apiKey || !senderId) {
const errInfo = MESSAGES_REGISTRY.AUTH.OTP_GLOBAL_SMS_CONFIG_INVALID;
throw createDomainError(errInfo.message, errInfo.i18nKey);
}

const response = await fetch("https://api.telnyx.com/v2/messages", {
method: "POST",
headers: {
Authorization: `Bearer ${apiKey}`,
"Content-Type": "application/json",
},
body: JSON.stringify({
messaging_profile_id: senderId,
to: phoneNumber,
text: `${code} is your verification code. Valid for 10 minutes.`,
}),
});

const data = (await response.json()) as Record<string, unknown>;

if (!response.ok) {
const detail = (data?.errors as Array<{ detail?: string }>)?.[0]?.detail;
const errInfo =
MESSAGES_REGISTRY.AUTH.OTP_GLOBAL_SMS_DISPATCH_FAILED(detail);
throw createDomainError(errInfo.message, errInfo.i18nKey);
}

return data;
}
