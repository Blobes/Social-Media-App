import nodemailer from "nodemailer";
import { Resend } from "resend";

interface EmailOptions {
  to: string;
  code: string;
}

export async function sendVerificationEmail({ to, code }: EmailOptions) {
  const html = `
    <h3>Your verification code</h3>
    <p style="font-size: 22px; font-weight: bold;">${code}</p>
    <p>This code expires in 10 minutes.</p>
  `;

  // -----------------------------
  // 1. TRY RESEND FIRST
  // -----------------------------
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!process.env.RESEND_FROM) {
      throw new Error("RESEND_FROM not set");
    }

    const response = await resend.emails.send({
      from: process.env.RESEND_FROM,
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
          user: process.env.GMAIL_USER,
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        },
      };
      break;

    case "outlook":
      transporterConfig = {
        service: "hotmail",
        auth: {
          user: process.env.HOTMAIL_USER,
          pass: process.env.HOTMAIL_PASS,
        },
      };
      break;

    case "yahoo":
      transporterConfig = {
        service: "yahoo",
        auth: {
          user: process.env.YAHOO_USER,
          pass: process.env.YAHOO_PASS,
        },
      };
      break;

    default:
      transporterConfig = {
        host: process.env.SMTP_HOST || "smtp.ethereal.email",
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      };
  }

  const transporter = nodemailer.createTransport(transporterConfig);

  // -----------------------------
  // 4. SEND WITH STRICT ERROR HANDLING
  // -----------------------------
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || transporterConfig.auth.user,
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
