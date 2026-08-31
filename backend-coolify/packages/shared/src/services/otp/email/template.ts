import { getEmailOtpVariables } from "../variables";
import {
  AppStoreBadges,
  EmailFooter,
  EmailHeader,
  EmailLayout,
  OtpDigitsBox,
} from "./components";

/**
 * Compiles the HTML email template for Nodemailer fallback with single-box OTP container.
 */
export function renderEmailOtpHtml(
  variables: ReturnType<typeof getEmailOtpVariables>,
): string {
  const { recipient, appInfo, code, expiresInMinutes } = variables;

  const fullCode = `${code.digit1}${code.digit2}${code.digit3}${code.digit4}${code.digit5}${code.digit6}`;

  const content = `
    ${EmailHeader({ appInfo })}

    <!-- Heading -->
    <tr>
      <td class="pb-20" align="left">
        <h1 class="heading-title">Confirm Verification Code</h1>
      </td>
    </tr>

    <!-- Body Text -->
    <tr>
      <td class="text-body pb-20 bold" align="left">Hi ${recipient.firstName},</td>
    </tr>
    <tr>
      <td class="text-body pb-20" align="left">This is your verification code:</td>
    </tr>

    ${OtpDigitsBox({ code: fullCode })}

    <!-- Expiration Notice -->
    <tr>
      <td class="text-body pb-24" align="left">
        We're glad to have you! This code is valid for the next ${expiresInMinutes} minutes. If the code
        doesn't work, you can click the "Verify Email" button below instead:
      </td>
    </tr>

    <!-- Sign-off -->
    <tr>
      <td class="text-body pt-40 pb-32" align="left">
        Thanks,<br />
        <strong>${appInfo.appName} Team</strong>
      </td>
    </tr>

    ${AppStoreBadges({ appInfo })}
    ${EmailFooter({ appInfo })}
  `;

  return EmailLayout({ content });
}

//  ${EmailButton({ label: "Verify Email", url: verificationUrl || "#" })}
