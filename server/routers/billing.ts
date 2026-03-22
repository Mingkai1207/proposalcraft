import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { PLANS, PlanId } from "../products";
import { updateSubscription, ensureSubscription } from "../db";

const paddleApiKey = process.env.PADDLE_API_KEY || "";
const paddle = new Paddle(paddleApiKey, {
  environment: paddleApiKey.includes("live") ? Environment.production : Environment.sandbox,
});

export const billingRouter = router({
  createCheckout: protectedProcedure
    .input(z.object({ plan: z.enum(["starter", "pro"]) }))
    .mutation(async ({ ctx, input }) => {
      const plan = PLANS[input.plan as PlanId];
      if (!plan.paddlePriceId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Payment not yet configured. Please contact support to upgrade.",
        });
      }

      const origin = (ctx.req.headers.origin as string) || "https://proposai.org";

      const transaction = await paddle.transactions.create({
        items: [{ priceId: plan.paddlePriceId, quantity: 1 }],
        customData: {
          user_id: ctx.user.id.toString(),
          plan: input.plan,
        },
        checkout: {
          url: `${origin}/dashboard?upgraded=1`,
        },
      });

      // Paddle returns a checkout URL in the transaction
      const checkoutUrl = (transaction as any).checkout?.url || null;
      if (!checkoutUrl) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session. Please try again.",
        });
      }

      return { url: checkoutUrl };
    }),

  createPortal: protectedProcedure.mutation(async ({ ctx }) => {
    const sub = await ensureSubscription(ctx.user.id);
    if (!sub?.stripeCustomerId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No active subscription found. Please upgrade first.",
      });
    }

    // Paddle customer portal — direct to Paddle's hosted portal
    // The stripeCustomerId field is reused to store Paddle customer ID
    const portalUrl = `https://customer.paddle.com/subscriptions`;
    return { url: portalUrl };
  }),

  getPlans: protectedProcedure.query(async () => {
    return Object.values(PLANS).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      priceDisplay: p.priceDisplay,
      interval: p.interval,
      proposals: p.proposals === Infinity ? null : p.proposals,
      available: !!p.paddlePriceId,
    }));
  }),
});
