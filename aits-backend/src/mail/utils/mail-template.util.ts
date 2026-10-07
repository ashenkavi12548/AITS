/**
 * Helper to build the master email template wrapper
 */
export function buildEmailTemplate(options: {
  badgeText: string;
  headline: string;
  preheader?: string;
  contentHtml: string;
}): string {
  const currentYear = new Date().getFullYear();
  const { badgeText, headline, preheader, contentHtml } = options;

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${headline}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    a { color: #10a37f; text-decoration: none; }
    a:hover { text-decoration: underline; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: 0 !important; }
      .mobile-padding { padding: 24px 18px !important; }
      .otp-text { font-size: 32px !important; letter-spacing: 8px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  ${preheader ? `<div style="display: none; font-size: 1px; color: #f1f5f9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">${preheader}</div>` : ''}
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; width: 100%;">
    <tr>
      <td align="center" style="padding: 40px 12px 40px 12px;">
        
        <!-- Main Card Container -->
        <table role="presentation" class="email-container" width="580" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; width: 100%; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.03);">
          
          <!-- Top Emerald Brand Accent Bar -->
          <tr>
            <td height="6" style="background: #10a37f; line-height: 6px; font-size: 6px;">&nbsp;</td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td class="mobile-padding" style="padding: 28px 36px 20px 36px; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <!-- Logo Mark -->
                        <td valign="middle" style="padding-right: 12px;">
                          <div style="width: 38px; height: 38px; background-color: #10a37f; border-radius: 12px; text-align: center; line-height: 38px; color: #ffffff; font-weight: 800; font-size: 18px; box-shadow: 0 4px 12px rgba(16, 163, 127, 0.25);">
                            &#128225;
                          </div>
                        </td>
                        <!-- Brand Text -->
                        <td valign="middle">
                          <span style="font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; display: block; line-height: 1.2;">AITS</span>
                          <span style="font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.2px; display: block; text-transform: uppercase;">Livestock Traceability</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: 700; padding: 6px 12px; border-radius: 9999px; border: 1px solid #a7f3d0; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content Section -->
          <tr>
            <td class="mobile-padding" style="padding: 32px 36px 36px 36px; color: #334155; font-size: 15px; line-height: 24px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Security Footer Notice -->
          <tr>
            <td class="mobile-padding" style="padding: 20px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; line-height: 18px; color: #64748b;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="top" width="20" style="padding-right: 8px; font-size: 14px;">
                    &#128737;
                  </td>
                  <td valign="top" style="color: #64748b; font-size: 12px; line-height: 18px;">
                    <strong style="color: #475569;">Security Tip:</strong> AITS administrators will never ask for your password or verification code. If you did not initiate this request, you can safely ignore this email.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Platform Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #f1f5f9; text-align: center; font-size: 12px; line-height: 18px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #64748b;">
                Animal Identification & Traceability System (AITS)
              </p>
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #94a3b8;">
                National Livestock Traceability & Cloud Platform &bull; Sri Lanka
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${currentYear} AITS. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
        <!-- End Main Card -->

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
