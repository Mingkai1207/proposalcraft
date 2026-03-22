import Stripe from "stripe";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { PLANS, PlanId } from "../products";
import { updateSubscription, ensureSubscription } from "../db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-02-25.clover",
});

export const billingRouter = router({
  createCheckout: protectedProcedure
    .input(z.object({ plan: z.enum(["starter", "pro"]) }))
    .mutation(async ({ ctx, input }) => {
      const plan = PLANS[input.plan as PlanId];
      if (!plan.stripePriceId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Stripe price not configured. Please contact support.",
        });
      }

      const origin = ctx.req.headers.origin || "https://proposalcraft.ai";

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer_email: ctx.user.email || undefined,
        allow_promotion_codes: true,
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          plan: input.plan,
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
        },
        success_url: `${origin}/dashboard?upgraded=1`,
        cancel_url: `${origin}/pricing`,
      });

      return { url: session.url };
    }),

  createPortal: protectedProcedure.mutation(async ({ ctx }) => {
    const sub = await ensureSubscription(ctx.user.id);
    if (!sub?.stripeCustomerId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No active subscription found." });
    }

    const origin = ctx.req.headers.origin || "https://proposalcraft.ai";
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${origin}/dashboard`,
    });

    return { url: session.url };
  }),
});
