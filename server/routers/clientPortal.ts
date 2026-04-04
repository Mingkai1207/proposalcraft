import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { proposals, contractorProfiles, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../email";

function isProposalExpired(proposal: { sentAt: Date | null; expiryDays: number | null }): boolean {
  if (!proposal.sentAt || !proposal.expiryDays) return false;
  const expiresAt = new Date(proposal.sentAt).getTime() + proposal.expiryDays * 24 * 60 * 60 * 1000;
  return Date.now() > expiresAt;
}

export const clientPortalRouter = router({
  // Public: Get proposal by client portal token
  getProposal: publicProcedure
    .input(z.object({ token: z.string().min(1).max(64) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      const rows = await db
        .select()
        .from(proposals)
        .where(eq(proposals.clientPortalToken, input.token));

      const proposal = rows[0];
      if (!proposal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }

      // Fetch contractor name for display (non-fatal if missing)
      let contractorName: string | null = null;
      try {
        const profileRows = await db
          .select({ businessName: contractorProfiles.businessName, ownerName: contractorProfiles.ownerName })
          .from(contractorProfiles)
          .where(eq(contractorProfiles.userId, proposal.userId))
          .limit(1);
        const p = profileRows[0];
        contractorName = p?.businessName || p?.ownerName || null;
      } catch {}

      // Only expose fields needed for the client portal — never leak internal IDs or tokens
      return {
        id: proposal.id,
        title: proposal.title,
        clientName: proposal.clientName,
        clientEmail: proposal.clientEmail,
        clientAddress: proposal.clientAddress,
        tradeType: proposal.tradeType,
        jobScope: proposal.jobScope,
        materials: proposal.materials,
        laborCost: proposal.laborCost,
        materialsCost: proposal.materialsCost,
        totalCost: proposal.totalCost,
        generatedContent: proposal.generatedContent,
        pdfUrl: proposal.pdfUrl,
        status: proposal.status,
        sentAt: proposal.sentAt,
        expiryDays: proposal.expiryDays,
        acceptedAt: proposal.acceptedAt,
        declinedAt: proposal.declinedAt,
        contractorName,
      };
    }),

  // Public: Accept proposal
  acceptProposal: publicProcedure
    .input(z.object({ token: z.string().min(1).max(64) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      const rows = await db
        .select()
        .from(proposals)
        .where(eq(proposals.clientPortalToken, input.token));

      const proposal = rows[0];
      if (!proposal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }

      if (proposal.acceptedAt || proposal.declinedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Proposal already responded to" });
      }

      if (isProposalExpired(proposal)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This proposal has expired and can no longer be accepted." });
      }

      await db
        .update(proposals)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
        })
        .where(eq(proposals.id, proposal.id));

      // Notify contractor by email
      try {
        const contractorRows = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, proposal.userId))
          .limit(1);
        const contractor = contractorRows[0];
        if (contractor?.email) {
          const clientLabel = proposal.clientName || proposal.clientEmail || "Your client";
          await sendEmail({
            to: contractor.email,
            subject: `Proposal Accepted: ${proposal.title}`,
            html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:24px;">
<h2 style="color:#16a34a;">🎉 Proposal Accepted!</h2>
<p>Great news${contractor.name ? `, ${contractor.name.split(" ")[0]}` : ""}!</p>
<p><strong>${clientLabel}</strong> has accepted your proposal <strong>"${proposal.title}"</strong>.</p>
${proposal.totalCost ? `<p>Project value: <strong>$${proposal.totalCost}</strong></p>` : ""}
<p>Log in to ProposAI to view the full details and next steps.</p>
<hr style="margin:24px 0;border:none;border-top:1px solid #e0e0e0;"/>
<p style="color:#888;font-size:12px;">Sent by ProposAI</p>
</body></html>`,
            text: `Proposal Accepted!\n\n${clientLabel} has accepted your proposal "${proposal.title}".\n\nLog in to ProposAI to view details.`,
          });
        }
      } catch {}

      // Also notify admin
      await notifyOwner({
        title: "Proposal Accepted! 🎉",
        content: `Proposal "${proposal.title}" for ${proposal.clientName || proposal.clientEmail} has been accepted.`,
      }).catch(() => {});

      return { success: true };
    }),

  // Public: Decline proposal
  declineProposal: publicProcedure
    .input(z.object({ token: z.string().min(1).max(64) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      const rows = await db
        .select()
        .from(proposals)
        .where(eq(proposals.clientPortalToken, input.token));

      const proposal = rows[0];
      if (!proposal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }

      if (proposal.acceptedAt || proposal.declinedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Proposal already responded to" });
      }

      if (isProposalExpired(proposal)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This proposal has expired." });
      }

      await db
        .update(proposals)
        .set({
          status: "declined",
          declinedAt: new Date(),
        })
        .where(eq(proposals.id, proposal.id));

      // Notify contractor by email
      try {
        const contractorRows = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, proposal.userId))
          .limit(1);
        const contractor = contractorRows[0];
        if (contractor?.email) {
          const clientLabel = proposal.clientName || proposal.clientEmail || "Your client";
          await sendEmail({
            to: contractor.email,
            subject: `Proposal Declined: ${proposal.title}`,
            html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:24px;">
<h2 style="color:#dc2626;">Proposal Declined</h2>
<p>Hi${contractor.name ? ` ${contractor.name.split(" ")[0]}` : ""},</p>
<p><strong>${clientLabel}</strong> has declined your proposal <strong>"${proposal.title}"</strong>.</p>
<p>You may want to follow up with the client to understand their concerns or provide a revised proposal.</p>
<p>Log in to ProposAI to view the proposal details.</p>
<hr style="margin:24px 0;border:none;border-top:1px solid #e0e0e0;"/>
<p style="color:#888;font-size:12px;">Sent by ProposAI</p>
</body></html>`,
            text: `Proposal Declined\n\n${clientLabel} has declined your proposal "${proposal.title}".\n\nLog in to ProposAI to view details.`,
          });
        }
      } catch {}

      // Also notify admin
      await notifyOwner({
        title: "Proposal Declined",
        content: `Proposal "${proposal.title}" for ${proposal.clientName || proposal.clientEmail} has been declined.`,
      }).catch(() => {});

      return { success: true };
    }),

  // Protected: Generate client portal link for a proposal
  generateLink: protectedProcedure
    .input(z.object({ proposalId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      const rows = await db
        .select()
        .from(proposals)
        .where(eq(proposals.id, input.proposalId));

      const proposal = rows[0];
      if (!proposal || proposal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }

      // Generate unique token if not already present
      let token = proposal.clientPortalToken;
      if (!token) {
        token = nanoid(32);
        await db
          .update(proposals)
          .set({ clientPortalToken: token })
          .where(eq(proposals.id, proposal.id));
      }

      const origin = process.env.VITE_APP_URL || "https://proposai.org";
      const portalUrl = `${origin}/client-portal?token=${token}`;

      return { token, portalUrl };
    }),
});
