/**
 * Native email/password authentication router.
 * Replaces Manus OAuth for user-facing login/registration.
 */
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "../../drizzle/schema";
import { getDb } from "../db";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { publicProcedure } from "../_core/trpc";
import { sendEmail, buildVerificationEmail } from "../email";

const BCRYPT_ROUNDS = 12;
const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Generate a unique openId for native users (not from Manus OAuth)
function generateNativeOpenId(email: string): string {
  return `native_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`;
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
          .max(128),
        origin: z.string().url().optional(), // frontend passes window.location.origin
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

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
        emailVerified: false,
        verificationToken,
        verificationTokenExpiresAt,
        lastSignedIn: new Date(),
      });

      // Build the verification URL
      const origin = input.origin ?? "https://proposai.org";
      const verifyUrl = `${origin}/verify-email?token=${verificationToken}`;

      // Send verification email (non-blocking — don't fail registration if email fails)
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
        message: "Account created! Please check your email to verify your account before signing in.",
      };
    }),

  /**
   * Verify email address using the token from the verification email.
   * Sets a session cookie on success.
   */
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
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
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

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

      const origin = input.origin ?? "https://proposai.org";
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

      // Block unverified users
      if (!user.emailVerified) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Please verify your email address before signing in. Check your inbox for the verification link.",
        });
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
};
