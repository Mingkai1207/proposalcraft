import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { proposals, clientFeedback } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";

export const recommendationsRouter = router({
  // Get recommendations for a declined proposal
  getRecommendations: protectedProcedure
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

      if (!proposal.declinedAt) {
        return { recommendations: [] };
      }

      // Get feedback for this proposal
      const feedbackRows = await db
        .select()
        .from(clientFeedback)
        .where(eq(clientFeedback.proposalId, input.proposalId));

      const recommendations: Array<{
        title: string;
        description: string;
        reason: string;
        priority: "high" | "medium" | "low";
      }> = [];

      // Analyze feedback and generate recommendations
      feedbackRows.forEach(feedback => {
        if (feedback.reason === "price") {
          recommendations.push({
            title: "Consider Reducing Price",
            description: "The client indicated price was a concern. Review your labor costs and material estimates to see if there's room to reduce the total cost while maintaining profitability.",
            reason: "price",
            priority: "high",
          });
        } else if (feedback.reason === "scope") {
          recommendations.push({
            title: "Clarify Scope of Work",
            description: "The client may have had concerns about what's included. Consider breaking down the scope into smaller, more detailed phases or offering optional add-ons.",
            reason: "scope",
            priority: "high",
          });
        } else if (feedback.reason === "timeline") {
          recommendations.push({
            title: "Adjust Timeline",
            description: "The client needed a faster turnaround. If possible, offer an expedited timeline option or break the project into phases with earlier completion dates.",
            reason: "timeline",
            priority: "high",
          });
        } else if (feedback.reason === "other" && feedback.comments) {
          recommendations.push({
            title: "Address Client Concerns",
            description: `Client feedback: "${feedback.comments}". Consider reaching out to discuss their specific concerns and how you might address them.`,
            reason: "other",
            priority: "medium",
          });
        }
      });

      // Add general recommendations if no specific feedback
      if (recommendations.length === 0) {
        recommendations.push({
          title: "Follow Up with Client",
          description: "Reach out to the client to understand why they declined and what might make them reconsider.",
          reason: "other",
          priority: "high",
        });
      }

      return { recommendations };
    }),

  // Get recommendations for all declined proposals
  getOverallRecommendations: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      // Get all declined proposals for this user
      const declinedProposals = await db
        .select()
        .from(proposals)
        .where(and(eq(proposals.userId, ctx.user.id), eq(proposals.status, "declined")));

      if (declinedProposals.length === 0) {
        return { recommendations: [] };
      }

      // Get all feedback
      const allFeedback = await db.select().from(clientFeedback);
      const declinedIds = declinedProposals.map(p => p.id);
      const relevantFeedback = allFeedback.filter(f => declinedIds.includes(f.proposalId));

      // Count reasons
      const reasonCounts: Record<string, number> = {};
      relevantFeedback.forEach(f => {
        if (f.reason) {
          reasonCounts[f.reason] = (reasonCounts[f.reason] || 0) + 1;
        }
      });

      const recommendations: Array<{
        title: string;
        description: string;
        affectedCount: number;
        priority: "high" | "medium" | "low";
      }> = [];

      // Generate recommendations based on patterns
      if (reasonCounts.price && reasonCounts.price >= 2) {
        recommendations.push({
          title: "Review Pricing Strategy",
          description: `${reasonCounts.price} clients cited price as a reason for declining. Consider reviewing your cost structure and pricing model.`,
          affectedCount: reasonCounts.price,
          priority: "high",
        });
      }

      if (reasonCounts.scope && reasonCounts.scope >= 2) {
        recommendations.push({
          title: "Improve Scope Documentation",
          description: `${reasonCounts.scope} clients had scope concerns. Consider adding more detailed breakdowns and deliverables to future proposals.`,
          affectedCount: reasonCounts.scope,
          priority: "high",
        });
      }

      if (reasonCounts.timeline && reasonCounts.timeline >= 2) {
        recommendations.push({
          title: "Offer Flexible Timelines",
          description: `${reasonCounts.timeline} clients mentioned timeline issues. Consider offering expedited options or flexible scheduling.`,
          affectedCount: reasonCounts.timeline,
          priority: "medium",
        });
      }

      if (recommendations.length === 0) {
        recommendations.push({
          title: "Collect More Feedback",
          description: "You don't have enough feedback data yet to identify patterns. Continue collecting client feedback to get better insights.",
          affectedCount: 0,
          priority: "low",
        });
      }

      return { recommendations };
    }),
});
