import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { ensureSubscription, updateSubscription, getPlanLimit } from "../db";

export const subscriptionRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const sub = await ensureSubscription(ctx.user.id);
    if (!sub) return null;
    const limit = getPlanLimit(sub.plan);
    return {
      ...sub,
      limit: limit === Infinity ? null : limit,
      remaining: limit === Infinity ? null : Math.max(0, limit - sub.proposalsUsedThisMonth),
    };
  }),

  // Admin-only: manually update a user's plan (for testing/support use only)
  updatePlan: adminProcedure
    .input(
      z.object({
        plan: z.enum(["free", "starter", "pro"]),
        stripeCustomerId: z.string().optional(),
        stripeSubscriptionId: z.string().optional(),
        stripeCurrentPeriodEnd: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return updateSubscription(ctx.user.id, input);
    }),
});
