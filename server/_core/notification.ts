import { TRPCError } from "@trpc/server";
import { sendEmail } from "../email";
import { ENV } from "./env";

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  return { title, content };
};

/**
 * Sends an owner notification via email.
 * Returns `true` if the email was accepted, `false` on failure.
 * Validation errors bubble up as TRPC errors so callers can fix the payload.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  const ownerEmail = ENV.ownerEmail;
  if (!ownerEmail) {
    // No owner email configured — log and continue (non-fatal)
    console.warn("[Notification] OWNER_EMAIL not set; skipping owner notification.");
    return false;
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:24px;">
  <h2 style="color:#1a1a2e;">${escHtml(title)}</h2>
  <div style="white-space:pre-wrap;line-height:1.6;">${escHtml(content)}</div>
  <hr style="margin-top:32px;border:none;border-top:1px solid #e0e0e0;" />
  <p style="color:#888;font-size:12px;">Sent by ProposAI</p>
</body>
</html>`;

  try {
    return await sendEmail({
      to: ownerEmail,
      subject: `[ProposAI] ${title}`,
      html,
      text: `${title}\n\n${content}`,
    });
  } catch (error) {
    console.warn("[Notification] Error sending owner notification email:", error);
    return false;
  }
}
