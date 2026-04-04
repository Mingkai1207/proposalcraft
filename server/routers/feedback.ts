import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { proposals, clientFeedback } from "../../drizzle/schema";
import { eq, inArray, isNotNull, and } from "drizzle-orm";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";

export const feedbackRouter = router({
  // Public: Submit feedback on a declined proposal
  submitFeedback: publicProcedure
    .input(z.object({
      proposalId: z.number(),
      reason: z.enum(["price", "scope", "timeline", "other"]).optional(),
      comments: z.string().max(1000).optional(),
      rating: z.number().min(1).max(5).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      // Verify proposal exists and is declined
      const rows = await db.select().from(proposals).where(eq(proposals.id, input.proposalId));
      const proposal = rows[0];
      if (!proposal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }

      if (!proposal.declinedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Can only submit feedback on declined proposals" });
      }

      // Prevent duplicate feedback submissions for the same proposal
      const existing = await db
        .select({ id: clientFeedback.id })
        .from(clientFeedback)
        .where(eq(clientFeedback.proposalId, input.proposalId))
        .limit(1);
      if (existing.length > 0) {
        // Silently succeed — client already submitted, no need to error
        return { success: true };
      }

      // Save feedback
      await db.insert(clientFeedback).values({
        proposalId: input.proposalId,
        reason: input.reason,
        comments: input.comments,
        rating: input.rating,
      });

      return { success: true };
    }),

  // Protected: Get feedback for a proposal
  getFeedback: protectedProcedure
    .input(z.object({ proposalId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      // Verify ownership
      const rows = await db.select().from(proposals).where(eq(proposals.id, input.proposalId));
      const proposal = rows[0];
      if (!proposal || proposal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      const feedback = await db
        .select()
        .from(clientFeedback)
        .where(eq(clientFeedback.proposalId, input.proposalId));

      return feedback;
    }),

  // Protected: Get feedback analytics
  getAnalytics: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      // Get only declined proposals for this user
      const declinedProposals = await db
        .select({ id: proposals.id })
        .from(proposals)
        .where(and(eq(proposals.userId, ctx.user.id), isNotNull(proposals.declinedAt)));

      const declinedIds = declinedProposals.map(p => p.id);

      if (declinedIds.length === 0) {
        return {
          totalDeclined: 0,
          feedbackReceived: 0,
          averageRating: 0,
          reasonBreakdown: {},
        };
      }

      // Get feedback only for this user's declined proposals (filter at DB level)
      const relevantFeedback = await db
        .select()
        .from(clientFeedback)
        .where(inArray(clientFeedback.proposalId, declinedIds));

      // Calculate analytics
      const reasonBreakdown: Record<string, number> = {};
      let totalRating = 0;
      let ratingCount = 0;

      relevantFeedback.forEach(f => {
        if (f.reason) {
          reasonBreakdown[f.reason] = (reasonBreakdown[f.reason] || 0) + 1;
        }
        if (f.rating) {
          totalRating += f.rating;
          ratingCount++;
        }
      });

      return {
        totalDeclined: declinedIds.length,
        feedbackReceived: relevantFeedback.length,
        averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
        reasonBreakdown,
      };
    }),
});
