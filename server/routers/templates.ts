import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const ALL_TRADE_TYPES = ["hvac", "plumbing", "electrical", "roofing", "general", "painting", "flooring", "landscaping", "carpentry", "concrete", "masonry", "insulation", "drywall", "windows", "solar"] as const;
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { proposalTemplates } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { extractStyleFromHtml, extractTextFromHtml } from "../utils/styleExtractor";

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
        name: z.string().min(1).max(200),
        tradeType: z.enum(ALL_TRADE_TYPES),
        description: z.string().max(500).optional(),
        content: z.string().min(1).max(500000),
        clientName: z.string().max(200).nullable().optional(),
        clientAddress: z.string().max(500).nullable().optional(),
        jobScope: z.string().max(5000).nullable().optional(),
        materials: z.string().max(2000).nullable().optional(),
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
        name: z.string().max(200).optional(),
        description: z.string().max(500).optional(),
        content: z.string().max(500000).optional(),
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

  // Save a completed proposal as a template
  saveAsTemplate: protectedProcedure
    .input(
      z.object({
        proposalId: z.number(),
        name: z.string().min(1).max(200),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Fetch the proposal
      const { proposals } = await import("../../drizzle/schema");
      const proposal = await db
        .select()
        .from(proposals)
        .where(and(eq(proposals.id, input.proposalId), eq(proposals.userId, ctx.user.id)))
        .then((r: any[]) => r[0]);

      if (!proposal) throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      if (!proposal.generatedContent) throw new TRPCError({ code: "BAD_REQUEST", message: "Proposal has no generated content to save as template" });

      // Extract style metadata and text content from the HTML proposal
      const htmlContent = proposal.generatedContent;
      const isHtml = htmlContent.trimStart().toLowerCase().startsWith("<!doctype");

      let extractedText: string;
      let styleMetadata: string | null = null;

      if (isHtml) {
        extractedText = extractTextFromHtml(htmlContent);
        const styleMeta = extractStyleFromHtml(htmlContent);
        styleMetadata = JSON.stringify(styleMeta);
      } else {
        // Markdown content — use as-is, no style extraction needed
        extractedText = htmlContent;
      }

      const result = await db.insert(proposalTemplates).values({
        userId: ctx.user.id,
        name: input.name,
        tradeType: proposal.tradeType || "general",
        description: input.description || null,
        content: extractedText,
        styleMetadata,
        clientName: null,
        clientAddress: null,
        jobScope: null,
        materials: null,
        laborCost: null,
        materialsCost: null,
        totalCost: null,
        language: "english",
        expiryDays: 30,
        sourceType: "saved_from_proposal",
        originalFileUrl: null,
      });

      return { success: true };
    }),

  // Upload a document as a template (stores the text content extracted from the file)
  uploadTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        tradeType: z.enum(ALL_TRADE_TYPES),
        description: z.string().max(500).optional(),
        content: z.string().min(10).max(500000),  // extracted text content of the uploaded document
        originalFileUrl: z.string().url().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // If the uploaded content is HTML, extract style metadata
      const isHtml = input.content.trimStart().toLowerCase().startsWith("<!doctype");
      let styleMetadata: string | null = null;
      let content = input.content;

      if (isHtml) {
        const styleMeta = extractStyleFromHtml(input.content);
        styleMetadata = JSON.stringify(styleMeta);
        // Also extract plain text for structural reference
        content = extractTextFromHtml(input.content);
      }

      await db.insert(proposalTemplates).values({
        userId: ctx.user.id,
        name: input.name,
        tradeType: input.tradeType,
        description: input.description || null,
        content,
        styleMetadata,
        clientName: null,
        clientAddress: null,
        jobScope: null,
        materials: null,
        laborCost: null,
        materialsCost: null,
        totalCost: null,
        language: "english",
        expiryDays: 30,
        sourceType: "uploaded",
        originalFileUrl: input.originalFileUrl || null,
      });

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
