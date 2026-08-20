import { getEmailOtpVariables } from "./variables";

/**
 * Compiles the HTML email template for Nodemailer fallback with non-wrapping OTP digit containers.
 */
export function renderEmailOtpHtml(
  variables: ReturnType<typeof getEmailOtpVariables>,
): string {
  const { recipient, appInfo, code, verificationUrl, expiresInMinutes } =
    variables;

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Confirm Verification Code</title>
    <style>
      body {
        margin: 0;
        padding: 20px 0;
        background-color: transparent;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      .container-card {
        background-color: #f7f8fb;
        border-radius: 16px;
        padding: 40px;
        box-sizing: border-box;
        width: 100%;
        margin: 0 auto;
      }

      /* Header & Branding */
      .brand-logo {
        display: block;
        border: 0;
        height: 48px;
        width: auto;
      }

      /* Typography */
      .heading-title {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        color: #28303c;
        letter-spacing: -0.3px;
      }
      .text-body {
        font-size: 16px;
        line-height: 24px;
        color: #28303c;
      }

      /* Spacing Helpers */
      .pb-16 { padding-bottom: 16px; }
      .pb-20 { padding-bottom: 20px; }
      .pb-24 { padding-bottom: 24px; }
      .pb-28 { padding-bottom: 28px; }
      .pb-32 { padding-bottom: 32px; }
      .pt-16 { padding-top: 16px; }
      .pt-24 { padding-top: 24px; }
      .pt-40 { padding-top: 40px; }

      /* OTP Container & Boxes */
      .otp-container {
        white-space: nowrap;
        word-break: keep-all;
      }
      .otp-cell {
        padding-right: 8px;
      }
      .otp-cell-last {
        padding-right: 0;
      }
      .otp-box {
        width: 44px;
        height: 52px;
        border-radius: 10px;
        text-align: center;
        line-height: 52px;
        font-size: 24px;
        font-weight: 700;
        color: #0a0e17;
        background-color: #e7e9ee;
      }

      /* Action Button */
      .btn-primary {
        display: inline-block;
        padding: 12px 28px;
        font-size: 16px;
        font-weight: 500;
        color: #ffffff!important;
        background-color: #5865F2;
        text-decoration: none;
        border-radius: 500px;
      }

      /* App Download Badges */
      .store-badge {
        display: inline-block;
        border: 0;
        height: 46px;
        width: auto;
        border-radius: 8px;
        background-color: #111213;
        padding: 4px;
        margin-right: 10px;
        vertical-align: middle;
      }

      /* Footer Links, Social Icons & Credits */
      .footer-container {
        border-top: 1px solid #e5e7eb;
        font-size: 14px;
        line-height: 20px;
        color: #6b7280;
      }
      .footer-link-primary {
        color: #5865F2;
        text-decoration: none;
      }
      .footer-link-underline {
        color: #5865F2;
        text-decoration: underline;
      }
      .social-link {
       text-decoration: none;
      }
      .social-icon {
        display: inline-block;
        border: 0;
        width: 20px;
        height: 20px;
        margin-right: 16px;
        vertical-align: middle;
      }
      .footer-copyright {
        font-size: 14px;
        color: #6b7280;
      }
    </style>
  </head>
  <body>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="container-card">
            
            <!-- Header Logo -->
            <tr>
              <td class="pb-32" align="left">
                <img src="${appInfo.logoUrl}" alt="${appInfo.appName}" class="brand-logo" />
              </td>
            </tr>

            <!-- Heading -->
            <tr>
              <td class="pb-20" align="left">
                <h1 class="heading-title">Confirm Verification Code</h1>
              </td>
            </tr>

            <!-- Body Text -->
            <tr>
              <td class="text-body pb-20" align="left">Hi ${recipient.firstName},</td>
            </tr>
            <tr>
              <td class="text-body pb-20" align="left">This is your verification code:</td>
            </tr>

            <!-- 6-Digit OTP Table (Guaranteed Non-Wrapping) -->
            <tr>
              <td class="pb-28" align="left">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="otp-container">
                  <tr>
                    <td class="otp-cell"><div class="otp-box">${code.digit1}</div></td>
                    <td class="otp-cell"><div class="otp-box">${code.digit2}</div></td>
                    <td class="otp-cell"><div class="otp-box">${code.digit3}</div></td>
                    <td class="otp-cell"><div class="otp-box">${code.digit4}</div></td>
                    <td class="otp-cell"><div class="otp-box">${code.digit5}</div></td>
                    <td class="otp-cell-last"><div class="otp-box">${code.digit6}</div></td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Expiration Notice -->
            <tr>
              <td class="text-body pb-24" align="left">
                We're glad to have you! This code is valid for the next ${expiresInMinutes} minutes. If the code
                doesn't work, you can click the "Verify Email" button below instead:
              </td>
            </tr>

            <!-- Action Button -->
            <tr>
              <td class="pb-32" align="left">
                <a href="${verificationUrl}" target="_blank" class="btn-primary">
                  Verify Email
                </a>
              </td>
            </tr>

            <!-- Sign-off -->
            <tr>
              <td class="text-body pt-40 pb-32" align="left">
                Thanks,<br />
                <strong>${appInfo.appName} Team</strong>
              </td>
            </tr>

            <!-- App Download Section -->
            <tr>
              <td class="text-body pb-16" style="font-size: 14px;" align="left">
                Download our app for Mobile App from Google Play &amp; App Store.
              </td>
            </tr>
            <tr>
              <td class="pb-32" align="left">
                <a href="${appInfo.playStoreUrl}" target="_blank">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" class="store-badge" />
                </a>
                <a href="${appInfo.appStoreUrl}" target="_blank">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" class="store-badge" />
                </a>
              </td>
            </tr>

            <!-- Footer Section -->
            <tr>
              <td class="footer-container pt-24" align="left">
                <div class="pb-20">
                  <a href="${appInfo.facebookUrl}" target="_blank" class="social-link">
                    <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" class="social-icon" />
                  </a>
                  <a href="${appInfo.twitterUrl}" target="_blank" class="social-link">
                    <img src="https://cdn-icons-png.flaticon.com/512/5969/5969020.png" alt="X" class="social-icon" />
                  </a>
                  <a href="${appInfo.instagramUrl}" target="_blank" class="social-link">
                    <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" class="social-icon" />
                  </a>
                  <a href="${appInfo.linkedinUrl}" target="_blank" class="social-link">
                    <img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" alt="LinkedIn" class="social-icon" />
                  </a>
                </div>

                Questions or faq? Contact us at
                <a href="mailto:${appInfo.supportEmail}" class="footer-link-primary">${appInfo.supportEmail}</a>.
                Don't want any more emails from ${appInfo.appName}?
                <a href="${appInfo.unsubscribeUrl}" class="footer-link-underline">Unsubscribe</a>.
              </td>
            </tr>
            <tr>
              <td class="footer-copyright pt-16" align="left">&copy; ${appInfo.appName} ${appInfo.currentYear}.</td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}
