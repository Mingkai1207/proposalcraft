import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // PayPal webhook endpoint — registered before express.json() to receive raw body
  app.post("/api/paypal/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    let eventData: any;
    try {
      const rawBody = req.body.toString("utf8");
      eventData = JSON.parse(rawBody);
    } catch (err: any) {
      console.error("[PayPal Webhook] Parse error:", err.message);
      res.status(400).json({ error: "Invalid payload" });
      return;
    }

    const eventType = eventData?.event_type || "";
    console.log("[PayPal Webhook] Event:", eventType, eventData?.id);

    try {
      const { updateSubscription } = await import("../db");

      // BILLING.SUBSCRIPTION.ACTIVATED — user completed PayPal subscription approval
      if (eventType === "BILLING.SUBSCRIPTION.ACTIVATED") {
        const subscriptionId = eventData?.resource?.id;
        const customId = eventData?.resource?.custom_id;
        if (customId && subscriptionId) {
          let parsed: { user_id?: number; plan?: string } = {};
          try { parsed = JSON.parse(customId); } catch {}
          const userId = parsed.user_id ? Number(parsed.user_id) : 0;
          const plan = (parsed.plan || "starter") as "starter" | "pro";
          if (userId) {
            await updateSubscription(userId, {
              plan,
              stripeCustomerId: null,
              stripeSubscriptionId: subscriptionId,
            });
            console.log(`[PayPal] User ${userId} activated ${plan} subscription ${subscriptionId}`);
          }
        }
      }

      // BILLING.SUBSCRIPTION.CANCELLED or BILLING.SUBSCRIPTION.EXPIRED — downgrade to free
      if (
        eventType === "BILLING.SUBSCRIPTION.CANCELLED" ||
        eventType === "BILLING.SUBSCRIPTION.EXPIRED" ||
        eventType === "BILLING.SUBSCRIPTION.SUSPENDED"
      ) {
        const subscriptionId = eventData?.resource?.id;
        if (subscriptionId) {
          const { getDb } = await import("../db");
          const db = await getDb();
          if (db) {
            const { subscriptions } = await import("../../drizzle/schema");
            const { eq } = await import("drizzle-orm");
            const rows = await db
              .select()
              .from(subscriptions)
              .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
              .limit(1);
            if (rows[0]) {
              await updateSubscription(rows[0].userId, { plan: "free" });
              console.log(`[PayPal] User ${rows[0].userId} downgraded to free (sub ${subscriptionId})`);
            }
          }
        }
      }
    } catch (err) {
      console.error("[PayPal Webhook] Processing error:", err);
    }

    res.json({ received: true });
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
