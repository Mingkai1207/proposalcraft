import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { proposalTemplates } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const templatesRouter = router({
  // List all templates for the authenticated user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db.select().from(proposalTemplates).where(eq(proposalTemplates.userId, ctx.user.id));
  }),

  // Get a single template
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const template = await db
        .select()
        .from(proposalTemplates)
        .where(and(eq(proposalTemplates.id, input.id), eq(proposalTemplates.userId, ctx.user.id)))
        .then((r: any[]) => r[0]);
      
      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }
      return template;
    }),

  // Create a new template from a proposal
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        tradeType: z.enum(["hvac", "plumbing", "electrical", "roofing", "general"]),
        description: z.string().optional(),
        content: z.string().min(1),
        clientName: z.string().optional(),
        clientAddress: z.string().optional(),
        jobScope: z.string().optional(),
        materials: z.string().optional(),
        laborCost: z.string().optional(),
        materialsCost: z.string().optional(),
        totalCost: z.string().optional(),
        language: z.string().optional(),
        expiryDays: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const result = await db.insert(proposalTemplates).values({
        userId: ctx.user.id,
        name: input.name,
        tradeType: input.tradeType,
        description: input.description || null,
        content: input.content,
        clientName: input.clientName || null,
        clientAddress: input.clientAddress || null,
        jobScope: input.jobScope || null,
        materials: input.materials || null,
        laborCost: input.laborCost || null,
        materialsCost: input.materialsCost || null,
        totalCost: input.totalCost || null,
        language: input.language || "english",
        expiryDays: input.expiryDays || 30,
      });

      return { success: true, ...input };
    }),

  // Update a template
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        content: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const template = await db
        .select()
        .from(proposalTemplates)
        .where(and(eq(proposalTemplates.id, input.id), eq(proposalTemplates.userId, ctx.user.id)))
        .then((r: any[]) => r[0]);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      await db
        .update(proposalTemplates)
        .set({
          name: input.name || template.name,
          description: input.description !== undefined ? input.description : template.description,
          content: input.content || template.content,
        })
        .where(eq(proposalTemplates.id, input.id));

      return { success: true };
    }),

  // Delete a template
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const template = await db
        .select()
        .from(proposalTemplates)
        .where(and(eq(proposalTemplates.id, input.id), eq(proposalTemplates.userId, ctx.user.id)))
        .then((r: any[]) => r[0]);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      await db.delete(proposalTemplates).where(eq(proposalTemplates.id, input.id));
      return { success: true };
    }),
});
