import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getContractorProfile, upsertContractorProfile } from "../db";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

export const profileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return getContractorProfile(ctx.user.id);
  }),

  update: protectedProcedure
    .input(
      z.object({
        businessName: z.string().optional(),
        ownerName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        address: z.string().optional(),
        licenseNumber: z.string().optional(),
        website: z.string().optional(),
        defaultTerms: z.string().optional(),
        logoUrl: z.string().optional(),
        preferredModel: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return upsertContractorProfile({
        userId: ctx.user.id,
        ...input,
        email: input.email || null,
      });
    }),

  uploadLogo: protectedProcedure
    .input(
      z.object({
        base64: z.string(),
        mimeType: z.string().default("image/png"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Decode base64 and upload to S3
      const buffer = Buffer.from(input.base64.replace(/^data:[^;]+;base64,/, ""), "base64");
      const ext = input.mimeType.split("/")[1] || "png";
      const key = `logos/${ctx.user.id}-${nanoid(8)}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);

      // Save logo URL to profile
      await upsertContractorProfile({ userId: ctx.user.id, logoUrl: url });
      return { url };
    }),
});
