import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { proposals } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { notifyOwner } from "../_core/notification";

export const clientPortalRouter = router({
  // Public: Get proposal by client portal token
  getProposal: publicProcedure
    .input(z.object({ token: z.string() }))
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

      return proposal;
    }),

  // Public: Accept proposal
  acceptProposal: publicProcedure
    .input(z.object({ token: z.string() }))
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

      await db
        .update(proposals)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
        })
        .where(eq(proposals.id, proposal.id));

      // Notify contractor
      await notifyOwner({
        title: "Proposal Accepted! 🎉",
        content: `Your proposal "${proposal.title}" for ${proposal.clientName || proposal.clientEmail} has been accepted!`,
      }).catch(() => {});

      return { success: true };
    }),

  // Public: Decline proposal
  declineProposal: publicProcedure
    .input(z.object({ token: z.string() }))
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

      await db
        .update(proposals)
        .set({
          status: "declined",
          declinedAt: new Date(),
        })
        .where(eq(proposals.id, proposal.id));

      // Notify contractor
      await notifyOwner({
        title: "Proposal Declined",
        content: `Your proposal "${proposal.title}" for ${proposal.clientName || proposal.clientEmail} has been declined.`,
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
