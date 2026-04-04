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

function checkRequiredEnv() {
  const missing = ["DATABASE_URL", "ANTHROPIC_API_KEY", "JWT_SECRET"].filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(`\n[Startup] ERROR: Missing required environment variables: ${missing.join(", ")}`);
    console.error("[Startup] The server will start but AI generation and auth will fail without these.\n");
  }
}

async function startServer() {
  checkRequiredEnv();
  const app = express();
  const server = createServer(app);

  // PayPal webhook endpoint — registered before express.json() to receive raw body
  app.post("/api/paypal/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    let eventData: any;
    let rawBody: string;
    try {
      rawBody = req.body.toString("utf8");
      eventData = JSON.parse(rawBody);
    } catch (err: any) {
      console.error("[PayPal Webhook] Parse error:", err.message);
      res.status(400).json({ error: "Invalid payload" });
      return;
    }

    // Verify PayPal webhook signature when PAYPAL_WEBHOOK_ID is configured.
    // Without this check, anyone could forge a webhook to upgrade accounts for free.
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (webhookId) {
      try {
        const clientId = process.env.PAYPAL_CLIENT_ID || "";
        const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";
        const creds = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
          method: "POST",
          headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: "grant_type=client_credentials",
        });
        const tokenData = await tokenRes.json() as { access_token?: string };
        if (tokenData.access_token) {
          const verifyRes = await fetch("https://api-m.paypal.com/v1/notifications/verify-webhook-signature", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              auth_algo: req.headers["paypal-auth-algo"],
              cert_url: req.headers["paypal-cert-url"],
              transmission_id: req.headers["paypal-transmission-id"],
              transmission_sig: req.headers["paypal-transmission-sig"],
              transmission_time: req.headers["paypal-transmission-time"],
              webhook_id: webhookId,
              webhook_event: eventData,
            }),
          });
          const verifyData = await verifyRes.json() as { verification_status?: string };
          if (verifyData.verification_status !== "SUCCESS") {
            console.warn("[PayPal Webhook] Signature verification failed:", verifyData);
            res.status(401).json({ error: "Webhook signature verification failed" });
            return;
          }
        }
      } catch (err) {
        console.error("[PayPal Webhook] Signature verification error:", err);
        // Don't process unverified webhooks in production
        if (process.env.NODE_ENV === "production") {
          res.status(500).json({ error: "Webhook verification failed" });
          return;
        }
      }
    } else {
      console.warn("[PayPal Webhook] PAYPAL_WEBHOOK_ID not set — skipping signature verification (unsafe in production)");
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
          const rawPlan = parsed.plan || "starter";
          const plan: "starter" | "pro" = (rawPlan === "pro" ? "pro" : "starter");
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

  // Email open tracking pixel — must be registered before express.json() so it runs early
  // Returns a 1×1 transparent GIF and asynchronously records the open event.
  const TRACKING_PIXEL = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );
  app.get("/api/track/:token", async (req, res) => {
    res.setHeader("Content-Type", "image/gif");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.end(TRACKING_PIXEL);

    // Fire-and-forget: record open in the background
    const token = req.params.token;
    if (!token || token.length > 128) return; // ignore obviously invalid tokens
    try {
      const { getProposalByToken, updateProposal, createEmailEvent } = await import("../db");
      const proposal = await getProposalByToken(token);
      // Truncate user-agent to prevent large strings from bloating the DB
      const rawUa = req.headers["user-agent"] || null;
      const userAgent = rawUa ? rawUa.slice(0, 512) : null;
      if (proposal && proposal.status === "sent") {
        await updateProposal(proposal.id, proposal.userId, {
          status: "viewed",
          viewedAt: new Date(),
        });
        await createEmailEvent({
          proposalId: proposal.id,
          eventType: "opened",
          ipAddress: req.ip || req.socket?.remoteAddress || null,
          userAgent,
        });
      } else if (proposal?.followUpSentAt && !proposal.followUpOpenedAt) {
        await updateProposal(proposal.id, proposal.userId, {
          followUpOpenedAt: new Date(),
        });
        await createEmailEvent({
          proposalId: proposal.id,
          eventType: "follow_up_opened",
          ipAddress: req.ip || req.socket?.remoteAddress || null,
          userAgent,
        });
      }
    } catch (err) {
      console.error("[Track] Error recording open:", err);
    }
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

// Schedule automatic follow-up emails — runs every hour
import("../jobs/followUpCron").then(({ sendAutomaticFollowUps }) => {
  // Run once on startup (catches any missed windows), then every hour
  sendAutomaticFollowUps().catch(console.error);
  setInterval(() => sendAutomaticFollowUps().catch(console.error), 60 * 60 * 1000);
}).catch((err) => console.error("[FollowUp Cron] Failed to load:", err));
