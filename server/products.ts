// ProposAI - Paddle Product & Price Configuration
// Paddle Price IDs are set as environment variables after creating products
// in the Paddle Dashboard (Catalog > Products).

export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "20 proposals/month with email delivery and tracking",
    price: 2900, // $29.00 in cents
    priceDisplay: "$29",
    interval: "month" as const,
    proposals: 20,
    // Set PADDLE_STARTER_PRICE_ID in your environment after creating the product in Paddle Dashboard
    paddlePriceId: process.env.PADDLE_STARTER_PRICE_ID || "",
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Unlimited proposals with priority AI and advanced analytics",
    price: 5900, // $59.00 in cents
    priceDisplay: "$59",
    interval: "month" as const,
    proposals: Infinity,
    // Set PADDLE_PRO_PRICE_ID in your environment after creating the product in Paddle Dashboard
    paddlePriceId: process.env.PADDLE_PRO_PRICE_ID || "",
  },
} as const;

export type PlanId = keyof typeof PLANS;
