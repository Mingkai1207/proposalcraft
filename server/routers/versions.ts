import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { proposals, proposalVersions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";

export const versionsRouter = router({
  // Get all versions of a proposal
  listVersions: protectedProcedure
    .input(z.object({ proposalId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      // Verify ownership
      const rows = await db.select().from(proposals).where(eq(proposals.id, input.proposalId));
      const proposal = rows[0];
      if (!proposal || proposal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      const versions = await db
        .select()
        .from(proposalVersions)
        .where(eq(proposalVersions.proposalId, input.proposalId));

      return versions;
    }),

  // Save current proposal as a version
  saveVersion: protectedProcedure
    .input(z.object({ proposalId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      // Verify ownership and get proposal
      const rows = await db.select().from(proposals).where(eq(proposals.id, input.proposalId));
      const proposal = rows[0];
      if (!proposal || proposal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      // Get next version number
      const versions = await db
        .select()
        .from(proposalVersions)
        .where(eq(proposalVersions.proposalId, input.proposalId));
      const nextVersion = (versions.length || 0) + 1;

      // Save version
      await db.insert(proposalVersions).values({
        proposalId: input.proposalId,
        versionNumber: nextVersion,
        title: proposal.title,
        content: proposal.pdfUrl || "",
        clientName: proposal.clientName || undefined,
        clientEmail: proposal.clientEmail || undefined,
        jobScope: proposal.jobScope || undefined,
        materials: proposal.materials || undefined,
        laborCost: proposal.laborCost || undefined,
        materialsCost: proposal.materialsCost || undefined,
        totalCost: proposal.totalCost || undefined,
      });

      return { success: true, versionNumber: nextVersion };
    }),

  // Restore a previous version
  restoreVersion: protectedProcedure
    .input(z.object({ proposalId: z.number(), versionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      // Verify ownership
      const rows = await db.select().from(proposals).where(eq(proposals.id, input.proposalId));
      const proposal = rows[0];
      if (!proposal || proposal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      // Get version
      const versionRows = await db
        .select()
        .from(proposalVersions)
        .where(eq(proposalVersions.id, input.versionId));
      const version = versionRows[0];
      if (!version) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
      }

      // Restore to proposal
      await db
        .update(proposals)
        .set({
          title: version.title,
          pdfUrl: version.content,
          clientName: version.clientName || undefined,
          clientEmail: version.clientEmail || undefined,
          jobScope: version.jobScope || undefined,
          materials: version.materials || undefined,
          laborCost: version.laborCost || undefined,
          materialsCost: version.materialsCost || undefined,
          totalCost: version.totalCost || undefined,
        })
        .where(eq(proposals.id, input.proposalId));

      return { success: true };
    }),
});
