import { getEmailOtpVariables } from "./variables";

/**
 * Compiles the HTML email template for Nodemailer fallback using provided variables.
 */
export function renderEmailOtpHtml(
  variables: ReturnType<typeof getEmailOtpVariables>,
): string {
  const { recipient, brand, code, verificationUrl, expiresInMinutes } =
    variables;

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Confirm Verification Code</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f5f7; padding: 40px 15px;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 8px; padding: 40px; box-sizing: border-box;">
            <!-- Header: Logo & Social Links -->
            <tr>
              <td style="padding-bottom: 32px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="left" style="vertical-align: middle;">
                      <img src="${brand.logoUrl}" alt="${brand.brandName}" height="38" style="display: block; border: 0; max-height: 38px; width: auto;" />
                    </td>
                    <td align="right" style="vertical-align: middle;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-left: 12px;">
                            <a href="${brand.facebookUrl}" target="_blank" style="text-decoration: none;">
                              <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" width="18" height="18" alt="Facebook" style="display: block; border: 0;" />
                            </a>
                          </td>
                          <td style="padding-left: 12px;">
                            <a href="${brand.twitterUrl}" target="_blank" style="text-decoration: none;">
                              <img src="https://cdn-icons-png.flaticon.com/512/5969/5969020.png" width="18" height="18" alt="X" style="display: block; border: 0;" />
                            </a>
                          </td>
                          <td style="padding-left: 12px;">
                            <a href="${brand.instagramUrl}" target="_blank" style="text-decoration: none;">
                              <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" width="18" height="18" alt="Instagram" style="display: block; border: 0;" />
                            </a>
                          </td>
                          <td style="padding-left: 12px;">
                            <a href="${brand.linkedinUrl}" target="_blank" style="text-decoration: none;">
                              <img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" width="18" height="18" alt="LinkedIn" style="display: block; border: 0;" />
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Heading -->
            <tr>
              <td style="padding-bottom: 20px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.3px;">
                  Confirm Verification Code
                </h1>
              </td>
            </tr>

            <!-- Body Text -->
            <tr>
              <td style="padding-bottom: 20px; font-size: 15px; line-height: 24px; color: #374151;">
                Hi ${recipient.firstName},
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 20px; font-size: 15px; line-height: 24px; color: #374151;">
                This is your verification code:
              </td>
            </tr>

            <!-- 6-Digit OTP Boxes -->
            <tr>
              <td style="padding-bottom: 28px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right: 8px;">
                      <div style="width: 52px; height: 60px; overflow: hidden; border-radius: 12px; text-align: center; line-height: 60px; font-size: 28px; font-weight: 700; color: #111827; background-color: #e5e7eb;">
                        ${code.digit1}
                      </div>
                    </td>
                    <td style="padding-right: 8px;">
                      <div style="width: 52px; height: 60px; overflow: hidden; border-radius: 12px; text-align: center; line-height: 60px; font-size: 28px; font-weight: 700; color: #111827; background-color: #e5e7eb;">
                        ${code.digit2}
                      </div>
                    </td>
                    <td style="padding-right: 8px;">
                      <div style="width: 52px; height: 60px; overflow: hidden; border-radius: 12px; text-align: center; line-height: 60px; font-size: 28px; font-weight: 700; color: #111827; background-color: #e5e7eb;">
                        ${code.digit3}
                      </div>
                    </td>
                    <td style="padding-right: 8px;">
                      <div style="width: 52px; height: 60px; overflow: hidden; border-radius: 12px; text-align: center; line-height: 60px; font-size: 28px; font-weight: 700; color: #111827; background-color: #e5e7eb;">
                        ${code.digit4}
                      </div>
                    </td>
                    <td style="padding-right: 8px;">
                      <div style="width: 52px; height: 60px; overflow: hidden; border-radius: 12px; text-align: center; line-height: 60px; font-size: 28px; font-weight: 700; color: #111827; background-color: #e5e7eb;">
                        ${code.digit5}
                      </div>
                    </td>
                    <td>
                      <div style="width: 52px; height: 60px; overflow: hidden; border-radius: 12px; text-align: center; line-height: 60px; font-size: 28px; font-weight: 700; color: #111827; background-color: #e5e7eb;">
                        ${code.digit6}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Expiration Notice -->
            <tr>
              <td style="padding-bottom: 24px; font-size: 15px; line-height: 22px; color: #374151;">
                We're glad to have you! This code is valid for only the next ${expiresInMinutes} minutes. If the code
                doesn't work, you can use this login verification link instead:
              </td>
            </tr>

            <!-- Action Button -->
            <tr>
              <td style="padding-bottom: 32px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="background-color: #5865F2; border-radius: 500px;">
                      <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                        Verify Email
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Sign-off -->
            <tr>
              <td style="padding-bottom: 32px; font-size: 15px; line-height: 22px; color: #374151;">
                Thanks,<br />
                <strong>${brand.brandName} Team</strong>
              </td>
            </tr>

            <!-- App Download Section -->
            <tr>
              <td style="padding-bottom: 16px; font-size: 14px; line-height: 20px; color: #374151;">
                We are at the touch of a button! Download our app for Google &amp; Mac.
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 32px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right: 10px;">
                      <a href="${brand.playStoreUrl}" target="_blank">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" height="40" alt="Get it on Google Play" style="display: block; border: 0; height: 40px; width: auto;" />
                      </a>
                    </td>
                    <td>
                      <a href="${brand.appStoreUrl}" target="_blank">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" height="40" alt="Download on the App Store" style="display: block; border: 0; height: 40px; width: auto;" />
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer / Support Info -->
            <tr>
              <td style="padding-top: 24px; border-top: 1px solid #f3f4f6; font-size: 13px; line-height: 20px; color: #6b7280;">
                Questions or faq? Contact us at
                <a href="mailto:${brand.supportEmail}" style="color: #5865F2; text-decoration: none;">${brand.supportEmail}</a>.
                Don't want any more emails from ${brand.brandName}?
                <a href="${brand.unsubscribeUrl}" style="color: #5865F2; text-decoration: underline;">Unsubscribe</a>.
              </td>
            </tr>
            <tr>
              <td style="padding-top: 16px; font-size: 13px; color: #9ca3af;">&copy; ${brand.brandName} ${brand.currentYear}.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}
