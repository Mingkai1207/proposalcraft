import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getProposalByToken, updateProposal, createEmailEvent, getEmailEventsByProposal, getProposalById } from "../db";
import { notifyOwner } from "../_core/notification";
import { TRPCError } from "@trpc/server";

export const trackingRouter = router({
  // Public endpoint: called when tracking pixel is loaded (client opens email)
  recordOpen: publicProcedure
    .input(z.object({ token: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await getProposalByToken(input.token);
      if (!proposal) return { success: false };

      // Truncate user-agent to 512 chars to prevent large strings from bloating the DB
      const rawUa = ctx.req.headers["user-agent"] || null;
      const userAgent = rawUa ? rawUa.slice(0, 512) : null;

      // Only update to "viewed" if not already viewed or further
      if (proposal.status === "sent") {
        await updateProposal(proposal.id, proposal.userId, {
          status: "viewed",
          viewedAt: new Date(),
        });

        // Record the event
        await createEmailEvent({
          proposalId: proposal.id,
          eventType: "opened",
          ipAddress: ctx.req.ip || ctx.req.socket?.remoteAddress || null,
          userAgent,
        });

        // Notify the contractor
        await notifyOwner({
          title: "Proposal Opened!",
          content: `Your proposal "${proposal.title}" was opened by ${proposal.clientName || proposal.clientEmail || "your client"}.`,
        }).catch(() => {});
      } else if (proposal.followUpSentAt && !proposal.followUpOpenedAt) {
        // Track follow-up email open
        await updateProposal(proposal.id, proposal.userId, {
          followUpOpenedAt: new Date(),
        });

        // Record the event
        await createEmailEvent({
          proposalId: proposal.id,
          eventType: "follow_up_opened",
          ipAddress: ctx.req.ip || ctx.req.socket?.remoteAddress || null,
          userAgent,
        });

        // Notify the contractor
        await notifyOwner({
          title: "Follow-up Email Opened!",
          content: `Your follow-up email for "${proposal.title}" was opened by ${proposal.clientName || proposal.clientEmail || "your client"}.`,
        }).catch(() => {});
      }

      return { success: true };
    }),

  // Get email events for a proposal (for the contractor)
  getEvents: protectedProcedure
    .input(z.object({ proposalId: z.number() }))
    .query(async ({ ctx, input }) => {
      const proposal = await getProposalById(input.proposalId);
      if (!proposal || proposal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }
      return getEmailEventsByProposal(input.proposalId);
    }),
});
