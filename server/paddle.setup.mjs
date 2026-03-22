import "dotenv/config";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";

const apiKey = process.env.PADDLE_API_KEY;
const paddle = new Paddle(apiKey, {
  environment: apiKey.includes("live") ? Environment.production : Environment.sandbox,
});

async function setup() {
  console.log("Creating ProposAI products in Paddle...\n");

  // Create Starter product
  const starterProduct = await paddle.products.create({
    name: "ProposAI Starter",
    description: "20 AI-generated proposals per month with email delivery and open tracking",
    taxCategory: "saas",
  });
  console.log("Created Starter product:", starterProduct.id);

  // Create Starter price
  const starterPrice = await paddle.prices.create({
    productId: starterProduct.id,
    description: "ProposAI Starter - Monthly",
    unitPrice: { amount: "2900", currencyCode: "USD" },
    billingCycle: { interval: "month", frequency: 1 },
    trialPeriod: null,
  });
  console.log("Created Starter price:", starterPrice.id);

  // Create Pro product
  const proProduct = await paddle.products.create({
    name: "ProposAI Pro",
    description: "Unlimited AI-generated proposals with priority generation and advanced analytics",
    taxCategory: "saas",
  });
  console.log("Created Pro product:", proProduct.id);

  // Create Pro price
  const proPrice = await paddle.prices.create({
    productId: proProduct.id,
    description: "ProposAI Pro - Monthly",
    unitPrice: { amount: "5900", currencyCode: "USD" },
    billingCycle: { interval: "month", frequency: 1 },
    trialPeriod: null,
  });
  console.log("Created Pro price:", proPrice.id);

  console.log("\n=== SAVE THESE IDs ===");
  console.log(`PADDLE_STARTER_PRICE_ID=${starterPrice.id}`);
  console.log(`PADDLE_PRO_PRICE_ID=${proPrice.id}`);
  console.log("======================\n");

  return { starterPriceId: starterPrice.id, proPriceId: proPrice.id };
}

setup().catch(err => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
