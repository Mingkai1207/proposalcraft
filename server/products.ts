// ProposAI - PayPal Subscription Plan Configuration
// PayPal Plan IDs are created via the PayPal REST API and stored as environment variables.

export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "20 proposals/month with email delivery and tracking",
    price: 599, // $5.99 in cents
    priceDisplay: "$5.99",
    interval: "month" as const,
    proposals: 20,
    paypalPlanId: process.env.PAYPAL_STARTER_PLAN_ID || "",
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Unlimited proposals with priority AI and advanced analytics",
    price: 999, // $9.99 in cents
    priceDisplay: "$9.99",
    interval: "month" as const,
    proposals: Infinity,
    paypalPlanId: process.env.PAYPAL_PRO_PLAN_ID || "",
  },
} as const;

export type PlanId = keyof typeof PLANS;
