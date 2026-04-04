import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { PLANS, PlanId } from "../products";
import { updateSubscription, ensureSubscription } from "../db";

// PayPal helper: get an access token
async function getPayPalToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID || "";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";
  if (!clientId || !clientSecret) throw new Error("PayPal credentials not configured");
  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const r = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const d = await r.json() as { access_token?: string };
  if (!d.access_token) throw new Error("Failed to get PayPal token");
  return d.access_token;
}

export const billingRouter = router({
  // Create a PayPal subscription and return the approval URL
  createCheckout: protectedProcedure
    .input(z.object({ plan: z.enum(["starter", "pro"]) }))
    .mutation(async ({ ctx, input }) => {
      const plan = PLANS[input.plan as PlanId];
      if (!plan.paypalPlanId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Payment not yet configured. Please contact support to upgrade.",
        });
      }

      const origin = (ctx.req.headers.origin as string) || "https://proposai.org";

      try {
        const token = await getPayPalToken();
        const r = await fetch("https://api-m.paypal.com/v1/billing/subscriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "PayPal-Request-Id": `proposai-${ctx.user.id}-${Date.now()}`,
          },
          body: JSON.stringify({
            plan_id: plan.paypalPlanId,
            subscriber: {
              email_address: ctx.user.email || undefined,
              name: ctx.user.name ? { given_name: ctx.user.name } : undefined,
            },
            custom_id: JSON.stringify({ user_id: ctx.user.id, plan: input.plan }),
            application_context: {
              brand_name: "ProposAI",
              locale: "en-US",
              shipping_preference: "NO_SHIPPING",
              user_action: "SUBSCRIBE_NOW",
              return_url: `${origin}/payment-success?plan=${input.plan}`,
              cancel_url: `${origin}/pricing`,
            },
          }),
        });

        const sub = await r.json() as { id?: string; links?: Array<{ rel: string; href: string }> };
        const approvalLink = sub.links?.find((l) => l.rel === "approve");
        if (!approvalLink?.href) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create PayPal subscription. Please try again.",
          });
        }

        return { url: approvalLink.href };
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to create checkout session.",
        });
      }
    }),

  // Activate subscription after PayPal redirect (called from success page)
  activateSubscription: protectedProcedure
    .input(z.object({
      subscriptionId: z.string(),
      plan: z.enum(["starter", "pro"]),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const token = await getPayPalToken();
        const r = await fetch(`https://api-m.paypal.com/v1/billing/subscriptions/${input.subscriptionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sub = await r.json() as { status?: string; id?: string; custom_id?: string };
        if (sub.status !== "ACTIVE" && sub.status !== "APPROVED") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Subscription is not active yet." });
        }
        // Verify the subscription belongs to the authenticated user by checking custom_id
        // (custom_id is set to JSON.stringify({ user_id, plan }) when the subscription is created)
        if (sub.custom_id) {
          try {
            const parsed = JSON.parse(sub.custom_id) as { user_id?: number };
            if (parsed.user_id && parsed.user_id !== ctx.user.id) {
              throw new TRPCError({ code: "FORBIDDEN", message: "Subscription does not belong to this account." });
            }
          } catch (parseErr) {
            if (parseErr instanceof TRPCError) throw parseErr;
            // custom_id format unexpected — proceed with caution
          }
        }
        await updateSubscription(ctx.user.id, {
          plan: input.plan,
          stripeCustomerId: null,
          stripeSubscriptionId: input.subscriptionId,
        });
        return { success: true };
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err?.message || "Failed to activate subscription." });
      }
    }),

  // Manage subscription — link to PayPal subscription management page
  createPortal: protectedProcedure.mutation(async ({ ctx }) => {
    const sub = await ensureSubscription(ctx.user.id);
    if (!sub?.stripeSubscriptionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No active subscription found. Please upgrade first.",
      });
    }
    // Link to PayPal's subscription management page
    return { url: `https://www.paypal.com/myaccount/autopay/` };
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
      available: !!p.paypalPlanId,
    }));
  }),
});
