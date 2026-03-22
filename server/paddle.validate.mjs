import "dotenv/config";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";

const apiKey = process.env.PADDLE_API_KEY;
if (!apiKey) {
  console.error("ERROR: PADDLE_API_KEY not set");
  process.exit(1);
}

const paddle = new Paddle(apiKey, {
  environment: apiKey.includes("live") ? Environment.production : Environment.sandbox,
});

try {
  const products = await paddle.products.list({ perPage: 1 });
  console.log("SUCCESS: Paddle API key is valid");
  console.log("Products found:", products.data?.length ?? 0);
  process.exit(0);
} catch (err) {
  console.error("ERROR: Paddle API key validation failed:", err.message);
  process.exit(1);
}
