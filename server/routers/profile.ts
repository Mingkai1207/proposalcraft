import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getContractorProfile, upsertContractorProfile } from "../db";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";
import { encryptSmtpPassword } from "../_core/smtpCrypto";

export const profileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getContractorProfile(ctx.user.id);
    if (!profile) return profile;
    // Never return the raw SMTP password to the client — return a sentinel so the UI
    // knows whether a password has been configured without exposing the actual value.
    return {
      ...profile,
      smtpPassword: profile.smtpPassword ? "__configured__" : null,
    };
  }),

  update: protectedProcedure
    .input(
      z.object({
        businessName: z.string().max(200).optional(),
        ownerName: z.string().max(200).optional(),
        phone: z.string().max(30).optional(),
        email: z.string().email().optional().or(z.literal("")),
        address: z.string().max(500).optional(),
        licenseNumber: z.string().max(100).optional(),
        website: z.string().url().max(500).optional().or(z.literal("")),
        defaultTerms: z.string().max(5000).optional(),
        logoUrl: z.string().url().max(2000).optional(),
        preferredModel: z.string().max(100).optional(),
        smtpHost: z.string().max(255).optional(),
        smtpPort: z.number().int().min(1).max(65535).optional(),
        smtpUsername: z.string().max(255).optional(),
        smtpPassword: z.string().max(500).optional(),
        smtpFromEmail: z.string().email().max(320).optional().or(z.literal("")),
        smtpFromName: z.string().max(100).optional(),
        followUpTemplate: z.string().max(5000).optional(),
        onboardingCompleted: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // "__configured__" is the sentinel returned by get() — never write it back to the DB.
      // An empty string also means "don't change" — the client never pre-fills the field.
      // Encrypt the password at rest before storing; decryptSmtpPassword() handles decryption at use time.
      const rawPassword = !input.smtpPassword || input.smtpPassword === "__configured__"
        ? undefined
        : input.smtpPassword;
      const smtpPassword = rawPassword ? encryptSmtpPassword(rawPassword) : undefined;
      return upsertContractorProfile({
        userId: ctx.user.id,
        ...input,
        smtpPassword,
        email: input.email || null,
      });
    }),

  uploadLogo: protectedProcedure
    .input(
      z.object({
        base64: z.string().max(5_500_000), // ~4MB image max (base64 overhead ~33%)
        mimeType: z.enum(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]).default("image/png"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Decode base64 and upload to S3
      const buffer = Buffer.from(input.base64.replace(/^data:[^;]+;base64,/, ""), "base64");
      // Use a fixed extension map to prevent path traversal
      const extMap: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg", "image/webp": "webp", "image/gif": "gif" };
      const ext = extMap[input.mimeType] ?? "png";
      const key = `logos/${ctx.user.id}-${nanoid(8)}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);

      // Save logo URL to profile
      await upsertContractorProfile({ userId: ctx.user.id, logoUrl: url });
      return { url };
    }),
});
