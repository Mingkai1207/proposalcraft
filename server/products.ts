// ProposalCraft AI - Stripe Product & Price Configuration
// These are the Stripe Price IDs for each subscription plan.
// Create these in your Stripe Dashboard and update the IDs here.

export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "20 proposals/month with email delivery and tracking",
    price: 2900, // $29.00 in cents
    interval: "month" as const,
    proposals: 20,
    // Set this to your actual Stripe Price ID after creating it in Stripe Dashboard
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || "",
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Unlimited proposals with priority AI and advanced analytics",
    price: 5900, // $59.00 in cents
    interval: "month" as const,
    proposals: Infinity,
    // Set this to your actual Stripe Price ID after creating it in Stripe Dashboard
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || "",
  },
} as const;

export type PlanId = keyof typeof PLANS;
