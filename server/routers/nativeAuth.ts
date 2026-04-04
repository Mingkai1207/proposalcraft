/**
 * Native email/password authentication router.
 * Replaces Manus OAuth for user-facing login/registration.
 */
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { users, proposals, proposalTemplates, subscriptions, contractorProfiles, emailEvents, shareTokens } from "../../drizzle/schema";
import { getDb } from "../db";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { publicProcedure, protectedProcedure } from "../_core/trpc";
import { sendEmail, buildVerificationEmail } from "../email";

const BCRYPT_ROUNDS = 12;
const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Simple in-memory rate limiter (no external dependencies) ─────────────────
// Protects login/register endpoints from brute-force attacks.
// Key: IP address. Value: { count, windowStart }
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_LOGIN = 20;         // max 20 login attempts per IP per 15 min
const RATE_LIMIT_MAX_REGISTER = 10;      // max 10 registrations per IP per 15 min
const RATE_LIMIT_MAX_PASSWORD_RESET = 5; // max 5 reset requests per IP per 15 min
const RATE_LIMIT_MAX_RESEND = 5;         // max 5 resend-verification requests per IP per 15 min

function checkRateLimit(ip: string, type: "login" | "register" | "passwordReset" | "resend"): void {
  const max = type === "login" ? RATE_LIMIT_MAX_LOGIN
    : type === "register" ? RATE_LIMIT_MAX_REGISTER
    : type === "passwordReset" ? RATE_LIMIT_MAX_PASSWORD_RESET
    : RATE_LIMIT_MAX_RESEND;
  const key = `${type}:${ip}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return;
  }
  entry.count++;
  if (entry.count > max) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many attempts. Please try again in 15 minutes.",
    });
  }
}

// Periodically clean up expired entries to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // clean every 5 minutes

// Trusted origins for email verification links — reads APP_URL (same as ENV.appUrl)
const TRUSTED_APP_ORIGIN = (process.env.APP_URL ?? "https://proposai.org").replace(/\/$/, "");

function getSafeOrigin(requestedOrigin?: string): string {
  if (!requestedOrigin) return TRUSTED_APP_ORIGIN;
  try {
    const url = new URL(requestedOrigin);
    const trusted = new URL(TRUSTED_APP_ORIGIN);
    // Allow if same host (ignoring protocol for localhost dev)
    if (url.hostname === trusted.hostname) return requestedOrigin.replace(/\/$/, "");
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return requestedOrigin.replace(/\/$/, "");
  } catch {}
  return TRUSTED_APP_ORIGIN;
}

// If SMTP is not configured, skip email verification entirely — users auto-verify on signup.
// This prevents a hard block on deployments (e.g. Railway) where SMTP hasn't been set up yet.
function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

// Generate a unique openId for native users (not from Manus OAuth)
function generateNativeOpenId(email: string): string {
  // Use random bytes instead of Date.now() to avoid collisions under concurrent registrations
  return `native_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${crypto.randomBytes(8).toString("hex")}`;
}

// Generate a secure random verification token
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Export individual procedures so they can be composed into any router
export const nativeAuthProcedures = {
  /**
   * Register a new user with email + password.
   * Creates the user record, sends a verification email, and does NOT set a session
   * cookie until the email is verified.
   */
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required").max(255),
        email: z.string().email("Invalid email address").max(320),
        password: z
          .string()
          .min(8, "Password must be at least 8 characters")
          .max(72, "Password must be 72 characters or fewer"), // bcrypt silently truncates beyond 72 bytes
        origin: z.string().url().optional(), // frontend passes window.location.origin
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Rate limit registration by IP to prevent account creation spam
      const ip = ctx.req.ip || ctx.req.socket?.remoteAddress || "unknown";
      checkRateLimit(ip, "register");

      // Check if email already exists
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }

      const smtpEnabled = isSmtpConfigured();
      const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
      const openId = generateNativeOpenId(input.email);
      const verificationToken = generateVerificationToken();
      const verificationTokenExpiresAt = Date.now() + VERIFICATION_TOKEN_EXPIRY_MS;

      await db.insert(users).values({
        openId,
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        loginMethod: "email",
        // Auto-verify when SMTP isn't configured — avoids hard-blocking users on deployments
        // that haven't set up email yet.
        emailVerified: !smtpEnabled,
        verificationToken: smtpEnabled ? verificationToken : null,
        verificationTokenExpiresAt: smtpEnabled ? verificationTokenExpiresAt : null,
        lastSignedIn: new Date(),
      });

      if (!smtpEnabled) {
        // No email service — log them in immediately after signup
        const sessionToken = await sdk.createSessionToken(openId, {
          name: input.name,
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return {
          success: true,
          autoVerified: true,
          message: "Account created! You are now signed in.",
        };
      }

      // SMTP is available — send a verification email
      const origin = getSafeOrigin(input.origin);
      const verifyUrl = `${origin}/verify-email?token=${verificationToken}`;
      const { html, text } = buildVerificationEmail({ name: input.name, verifyUrl });
      await sendEmail({
        to: input.email,
        subject: "Verify your ProposAI account",
        html,
        text,
      }).catch((err) => {
        console.error("[Register] Failed to send verification email:", err);
      });

      return {
        success: true,
        autoVerified: false,
        message: "Account created! Please check your email to verify your account before signing in.",
      };
    }),

  /**
   * Verify email address using the token from the verification email.
   * Sets a session cookie on success.
   */
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string().min(1).max(128) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.verificationToken, input.token))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This verification link is invalid or has already been used.",
        });
      }

      if (user.emailVerified) {
        // Already verified — just log them in
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, message: "Email already verified. You are now signed in." };
      }

      if (user.verificationTokenExpiresAt && Date.now() > user.verificationTokenExpiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This verification link has expired. Please request a new one.",
        });
      }

      // Mark email as verified and clear the token
      await db
        .update(users)
        .set({
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiresAt: null,
          lastSignedIn: new Date(),
        })
        .where(eq(users.id, user.id));

      // Create session and log the user in
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return { success: true, message: "Email verified! You are now signed in." };
    }),

  /**
   * Resend the verification email.
   */
  resendVerification: publicProcedure
    .input(z.object({
      email: z.string().email(),
      origin: z.string().url().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Rate limit resend requests to prevent inbox flooding
      const ip = ctx.req.ip || ctx.req.socket?.remoteAddress || "unknown";
      checkRateLimit(ip, "resend");

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);

      // Always return success to avoid email enumeration
      if (!user || user.emailVerified) {
        return { success: true };
      }

      const verificationToken = generateVerificationToken();
      const verificationTokenExpiresAt = Date.now() + VERIFICATION_TOKEN_EXPIRY_MS;

      await db
        .update(users)
        .set({ verificationToken, verificationTokenExpiresAt })
        .where(eq(users.id, user.id));

      const origin = getSafeOrigin(input.origin);
      const verifyUrl = `${origin}/verify-email?token=${verificationToken}`;
      const { html, text } = buildVerificationEmail({ name: user.name ?? "there", verifyUrl });

      await sendEmail({
        to: input.email,
        subject: "Verify your ProposAI account",
        html,
        text,
      }).catch((err) => {
        console.error("[ResendVerification] Failed to send email:", err);
      });

      return { success: true };
    }),

  /**
   * Login with email + password.
   * Validates credentials and sets a session cookie.
   * Rejects unverified accounts with a clear message.
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address").max(320),
        password: z.string().min(1, "Password is required").max(128),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Rate limit login attempts by IP to slow brute-force attacks
      const ip = ctx.req.ip || ctx.req.socket?.remoteAddress || "unknown";
      checkRateLimit(ip, "login");

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);

      // Specific error when email not found
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No account found with this email. Please create one free.",
        });
      }

      if (!user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "This account uses a different login method. Please use the original sign-in option.",
        });
      }

      const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!passwordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Incorrect password. Please try again.",
        });
      }

      // Block unverified users — but auto-verify them if SMTP isn't configured
      // (handles users registered before the auto-verify fix was deployed)
      if (!user.emailVerified) {
        if (!isSmtpConfigured()) {
          await db
            .update(users)
            .set({ emailVerified: true, verificationToken: null, verificationTokenExpiresAt: null })
            .where(eq(users.id, user.id));
        } else {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Please verify your email address before signing in. Check your inbox for the verification link.",
          });
        }
      }

      // Update lastSignedIn
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      // Create session token and set cookie
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      return { success: true, user: { id: user.id, name: user.name, email: user.email } };
    }),

  /**
   * Request a password reset email.
   * Always returns success to prevent email enumeration.
   */
  requestPasswordReset: publicProcedure
    .input(z.object({
      email: z.string().email().max(320),
      origin: z.string().url().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Rate limit password reset requests to prevent inbox flooding
      const ip = ctx.req.ip || ctx.req.socket?.remoteAddress || "unknown";
      checkRateLimit(ip, "passwordReset");

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);

      // Always return success to prevent email enumeration
      if (!user || !user.passwordHash) {
        return { success: true };
      }

      const resetToken = generateVerificationToken(); // reuse the same crypto.randomBytes(32) helper
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

      await db
        .update(users)
        .set({ passwordResetToken: resetToken, passwordResetTokenExpiresAt: expiresAt })
        .where(eq(users.id, user.id));

      const origin = getSafeOrigin(input.origin);
      const resetUrl = `${origin}/reset-password?token=${resetToken}`;

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>Reset your ProposAI password</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">
        <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #334155;">
          <span style="color:#fff;font-size:20px;font-weight:700;">ProposAI</span>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <h1 style="margin:0 0 16px;color:#f8fafc;font-size:24px;font-weight:700;">Reset your password</h1>
          <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
            We received a request to reset the password for your ProposAI account. Click the button below to choose a new password.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr><td style="background:linear-gradient(135deg,#f59e0b,#f97316);border-radius:8px;">
              <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;">Reset Password</a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Or copy this link: <a href="${resetUrl}" style="color:#f59e0b;">${resetUrl}</a></p>
          <p style="margin:0;color:#64748b;font-size:13px;">This link expires in <strong style="color:#94a3b8;">1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #334155;background:#0f172a;">
          <p style="margin:0;color:#475569;font-size:12px;text-align:center;">© ${new Date().getFullYear()} ProposAI</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      const text = `Reset your ProposAI password\n\nClick the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`;

      await sendEmail({
        to: input.email,
        subject: "Reset your ProposAI password",
        html,
        text,
      }).catch((err) => {
        console.error("[PasswordReset] Failed to send email:", err);
      });

      return { success: true };
    }),

  /**
   * Reset password using a valid reset token.
   */
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string().min(1).max(128),
      password: z.string().min(8, "Password must be at least 8 characters").max(72),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.passwordResetToken, input.token))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This reset link is invalid or has already been used.",
        });
      }

      if (!user.passwordResetTokenExpiresAt || Date.now() > user.passwordResetTokenExpiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This reset link has expired. Please request a new one.",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

      await db
        .update(users)
        .set({
          passwordHash,
          passwordResetToken: null,
          passwordResetTokenExpiresAt: null,
          emailVerified: true, // if they can receive email, their address is verified
          lastSignedIn: new Date(),
        })
        .where(eq(users.id, user.id));

      // Log the user in automatically after password reset
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return { success: true };
    }),

  /**
   * Delete account — permanently removes all user data.
   * Requires password confirmation to prevent accidental or unauthorized deletion.
   */
  deleteAccount: protectedProcedure
    .input(z.object({
      password: z.string().min(1).max(128),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Re-fetch user to get current passwordHash
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (!user.passwordHash) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Password confirmation is required to delete your account.",
        });
      }

      const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!passwordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Incorrect password. Account deletion cancelled.",
        });
      }

      // Get all proposal IDs belonging to this user
      const userProposals = await db
        .select({ id: proposals.id })
        .from(proposals)
        .where(eq(proposals.userId, ctx.user.id));
      const proposalIds = userProposals.map(p => p.id);

      // Delete child records that don't cascade automatically
      if (proposalIds.length > 0) {
        await db.delete(emailEvents).where(inArray(emailEvents.proposalId, proposalIds));
        await db.delete(shareTokens).where(inArray(shareTokens.proposalId, proposalIds));
      }

      // Delete main user data (proposals cascade to clientFeedback and proposalVersions)
      await db.delete(proposalTemplates).where(eq(proposalTemplates.userId, ctx.user.id));
      await db.delete(proposals).where(eq(proposals.userId, ctx.user.id));
      await db.delete(subscriptions).where(eq(subscriptions.userId, ctx.user.id));
      await db.delete(contractorProfiles).where(eq(contractorProfiles.userId, ctx.user.id));
      await db.delete(users).where(eq(users.id, ctx.user.id));

      // Clear session cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });

      return { success: true };
    }),
};
