/**
 * Transactional email helper.
 * Uses nodemailer with a configurable SMTP transport.
 * Falls back to logging the email content when SMTP is not configured
 * (useful for development / preview environments).
 */
import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Development fallback: log to console instead of sending
  return null;
}

export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  const from = process.env.SMTP_FROM ?? "ProposAI <noreply@proposai.org>";
  const transport = getTransport();

  if (!transport) {
    // Dev mode: print the email to the server console
    console.log(`\n[Email] ── DEV MODE (no SMTP configured) ──`);
    console.log(`[Email] To:      ${opts.to}`);
    console.log(`[Email] Subject: ${opts.subject}`);
    console.log(`[Email] Body:\n${opts.text ?? opts.html}\n`);
    return true;
  }

  try {
    await transport.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    return true;
  } catch (err) {
    console.error("[Email] Failed to send email:", err);
    return false;
  }
}

/** Renders the verification email HTML */
export function buildVerificationEmail(opts: {
  name: string;
  verifyUrl: string;
}): { html: string; text: string } {
  const { name, verifyUrl } = opts;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your ProposAI account</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #334155;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#f59e0b,#f97316);border-radius:10px;width:40px;height:40px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-size:20px;font-weight:bold;">P</span>
                  </td>
                  <td style="padding-left:10px;color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">ProposAI</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 8px;color:#94a3b8;font-size:14px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Welcome aboard</p>
              <h1 style="margin:0 0 16px;color:#f8fafc;font-size:26px;font-weight:700;line-height:1.3;">Verify your email address</h1>
              <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
                Hi ${name}, thanks for signing up! Click the button below to verify your email address and activate your ProposAI account.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#f59e0b,#f97316);border-radius:8px;">
                    <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 28px;word-break:break-all;">
                <a href="${verifyUrl}" style="color:#f59e0b;font-size:13px;text-decoration:none;">${verifyUrl}</a>
              </p>
              <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
                This link expires in <strong style="color:#94a3b8;">24 hours</strong>. If you didn't create a ProposAI account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #334155;background:#0f172a;">
              <p style="margin:0;color:#475569;font-size:12px;text-align:center;">
                © ${new Date().getFullYear()} ProposAI · AI-powered proposals for contractors
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hi ${name},

Welcome to ProposAI! Please verify your email address by clicking the link below:

${verifyUrl}

This link expires in 24 hours. If you didn't create a ProposAI account, you can safely ignore this email.

— The ProposAI Team`;

  return { html, text };
}
