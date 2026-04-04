import type { Express, Request, Response } from "express";

// Manus OAuth flow is no longer active.
// Authentication is handled via native email/password (see server/routers/nativeAuth.ts).
export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    res.status(410).json({ error: "OAuth login is no longer supported. Please use email/password login." });
  });
}
