import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
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

  // Called by Stripe webhook or manually for testing
  updatePlan: protectedProcedure
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
