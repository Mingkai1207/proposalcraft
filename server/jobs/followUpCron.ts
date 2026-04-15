import { getDb } from "../db";
import { proposals, contractorProfiles } from "../../drizzle/schema";
import { eq, and, isNull, lt } from "drizzle-orm";
import { sendEmail } from "../email";
import { ENV } from "../_core/env";
import { decryptSmtpPassword } from "../_core/smtpCrypto";

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Automatic follow-up cron job
 * Sends follow-up emails to clients who haven't opened their proposals after 48 hours
 * Run this every hour via a scheduled task (e.g., node-cron, AWS Lambda, etc.)
 */
export async function sendAutomaticFollowUps() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[FollowUp Cron] Database connection failed");
      return;
    }

    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Find proposals that were sent 48+ hours ago, not yet opened, and no follow-up sent yet.
    // Must still be in "sent" status — accepted/declined proposals must not receive follow-ups
    // even if the tracking pixel never fired (viewedAt stays null in that case).
    const eligibleProposals = await db
      .select()
      .from(proposals)
      .where(
        and(
          eq(proposals.status, "sent"), // Only "sent" — not accepted, declined, draft, etc.
          isNull(proposals.viewedAt), // Not opened
          isNull(proposals.followUpSentAt), // No follow-up sent yet
          lt(proposals.sentAt, fortyEightHoursAgo), // Sent 48+ hours ago
          isNull(proposals.followUpOpenedAt) // Follow-up not yet opened
        )
      );

    console.log(`[FollowUp Cron] Found ${eligibleProposals.length} proposals eligible for follow-up`);

    for (const proposal of eligibleProposals) {
      try {
        const profileRows = await db
          .select()
          .from(contractorProfiles)
          .where(eq(contractorProfiles.userId, proposal.userId));
        const profile = profileRows[0];

        if (!profile || !proposal.clientEmail) {
          console.log(`[FollowUp Cron] Skipping proposal ${proposal.id}: missing profile or client email`);
          continue;
        }

        const businessName = profile.businessName || profile.ownerName || "Your Contractor";
        const portalLink = proposal.clientPortalToken
          ? `${ENV.appUrl}/client-portal?token=${proposal.clientPortalToken}`
          : null;

        // Use custom template if available, otherwise use default
        const template = profile.followUpTemplate || getDefaultFollowUpTemplate();
        const followUpHtml = buildFollowUpEmail(template, {
          clientName: proposal.clientName || "there",
          proposalTitle: proposal.title,
          businessName,
          sentDate: new Date(proposal.sentAt!).toLocaleDateString(),
          portalLink,
        });

        // Build SMTP override from contractor profile if configured
        const smtpOverride = profile.smtpHost && profile.smtpUsername && profile.smtpPassword
          ? {
              host: profile.smtpHost,
              port: profile.smtpPort || 587,
              username: profile.smtpUsername,
              password: decryptSmtpPassword(profile.smtpPassword),
              fromEmail: profile.smtpFromEmail || "",
              fromName: profile.smtpFromName || businessName,
            }
          : undefined;

        // Send via nodemailer
        const sent = await sendEmail({
          to: proposal.clientEmail,
          subject: `Follow-up: ${proposal.title}`,
          html: followUpHtml,
          smtpOverride,
        });

        if (sent) {
          // Record follow-up sent time
          await db
            .update(proposals)
            .set({ followUpSentAt: new Date() })
            .where(eq(proposals.id, proposal.id));

          console.log(`[FollowUp Cron] Follow-up sent for proposal ${proposal.id}`);
        } else {
          console.error(`[FollowUp Cron] Failed to send follow-up for proposal ${proposal.id}`);
        }
      } catch (err) {
        console.error(`[FollowUp Cron] Error processing proposal ${proposal.id}:`, err);
      }
    }

    console.log("[FollowUp Cron] Completed");
  } catch (err) {
    console.error("[FollowUp Cron] Fatal error:", err);
  }
}

function getDefaultFollowUpTemplate(): string {
  return `
Hi {clientName},

I wanted to follow up on the proposal I sent you for {proposalTitle}. I haven't heard back yet, and I wanted to make sure you received it and had a chance to review it.

If you have any questions or would like to discuss the proposal further, I'm happy to help. Feel free to reach out anytime.

Best regards,
{businessName}

---
This is a follow-up to your proposal sent on {sentDate}.
  `.trim();
}

function buildFollowUpEmail(
  template: string,
  vars: {
    clientName: string;
    proposalTitle: string;
    businessName: string;
    sentDate: string;
    portalLink: string | null;
  }
): string {
  let html = template
    .replace(/{clientName}/g, escHtml(vars.clientName))
    .replace(/{proposalTitle}/g, escHtml(vars.proposalTitle))
    .replace(/{businessName}/g, escHtml(vars.businessName))
    .replace(/{sentDate}/g, escHtml(vars.sentDate));

  // Portal link is constructed from trusted ENV.appUrl + random token — safe to embed as href,
  // but escape for display text just in case.
  const safeLink = vars.portalLink ? vars.portalLink.replace(/"/g, "&quot;") : null;
  const ctaSection = safeLink
    ? `<p style="margin:20px 0;"><a href="${safeLink}" style="background:#e8630a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">View &amp; Respond to Proposal</a></p>`
    : "";
  const footerLink = safeLink
    ? `<p>Direct link: <a href="${safeLink}" style="color:#e8630a;">${escHtml(vars.portalLink!)}</a></p>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; }
.header { background: #1a1a2e; color: white; padding: 24px; border-radius: 8px 8px 0 0; }
.content { background: #f9f9f9; padding: 24px; border: 1px solid #e0e0e0; white-space: pre-wrap; }
.footer { color: #888; font-size: 12px; padding: 16px; text-align: center; }
</style></head>
<body>
<div class="header">
<h2 style="margin: 0;">Follow-up: ${escHtml(vars.proposalTitle)}</h2>
</div>
<div class="content">
${html}
${ctaSection}
</div>
<div class="footer">
<p>Sent by ${escHtml(vars.businessName)} via ProposAI</p>
${footerLink}
</div>
</body>
</html>
  `;
}
