/**
 * Native email/password authentication router.
 * Replaces Manus OAuth for user-facing login/registration.
 */
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "../../drizzle/schema";
import { getDb } from "../db";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { publicProcedure, router } from "../_core/trpc";

const BCRYPT_ROUNDS = 12;

// Generate a unique openId for native users (not from Manus OAuth)
function generateNativeOpenId(email: string): string {
  return `native_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`;
}

export const nativeAuthRouter = router({
  /**
   * Register a new user with email + password.
   * Creates the user record and sets a session cookie.
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
      })
    )
    .mutation(async ({ input, ctx }) => {
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

      await db.insert(users).values({
        openId,
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      // Fetch the created user
      const [newUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);

      if (!newUser) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });
      }

      // Create session token and set cookie
      const sessionToken = await sdk.createSessionToken(newUser.openId, {
        name: newUser.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      return { success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email } };
    }),

  /**
   * Login with email + password.
   * Validates credentials and sets a session cookie.
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

      // Generic error to prevent email enumeration
      const invalidError = new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password.",
      });

      if (!user) throw invalidError;
      if (!user.passwordHash) {
        // User registered via OAuth — no password set
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "This account uses a different login method. Please use the original sign-in option.",
        });
      }

      const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!passwordValid) throw invalidError;

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
});
