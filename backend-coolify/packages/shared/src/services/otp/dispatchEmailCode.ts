import nodemailer from "nodemailer";
import { Resend } from "resend";
import { IEmailDispatchTokens } from "../../types";

interface EmailOptions {
  to: string;
  code: string;
}

export async function dispatchEmailCode(
  { to, code }: EmailOptions,
  dispatchConfig: IEmailDispatchTokens,
) {
  const html = `
    <h3>Your verification code</h3>
    <p style="font-size: 22px; font-weight: bold;">${code}</p>
    <p>This code expires in 10 minutes.</p>
  `;

  const resendApiKey = dispatchConfig.RESEND_API_KEY;
  const resendFromEmail = dispatchConfig.RESEND_FROM_EMAIL;

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
      to,
      subject: "Verify Your Email",
      html,
    });

    if (response.error) {
      throw new Error(response.error.message || "Resend failed");
    }

    return response;
  } catch (err) {
    console.error("❌ Resend failed → will try SMTP fallback:", err);
  }

  // -----------------------------
  // 2. DETERMINE SMTP PROVIDER
  // -----------------------------
  let provider: "gmail" | "outlook" | "yahoo" | "smtp";

  if (to.includes("@gmail.")) provider = "gmail";
  else if (to.includes("@outlook.") || to.includes("@hotmail."))
    provider = "outlook";
  else if (to.includes("@yahoo.")) provider = "yahoo";
  else provider = "smtp";

  // -----------------------------
  // 3. CONFIGURE SMTP TRANSPORTER
  // -----------------------------
  let transporterConfig: any;

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
    const info = await transporter.sendMail({
      from: dispatchConfig.GMAIL_USER || transporterConfig.auth.user,
      to,
      subject: "Verify Your Email",
      html,
    });

    // Nodemailer: some failures don't throw but return rejected list
    if (info.rejected && info.rejected.length > 0) {
      throw new Error(`SMTP rejected recipients: ${info.rejected.join(", ")}`);
    }

    return info;
  } catch (err: any) {
    console.error("❌ SMTP failed:", err);
    throw new Error(err.message || "SMTP email send failed");
  }
}
