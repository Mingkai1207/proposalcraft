import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { proposals } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import JSZip from "jszip";

export const exportRouter = router({
  // Protected: Bulk export all proposals as ZIP
  bulkExportProposals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

    // Fetch all proposals for this user
    const userProposals = await db
      .select()
      .from(proposals)
      .where(eq(proposals.userId, ctx.user.id));

    if (userProposals.length === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No proposals to export" });
    }

    // Create ZIP file
    const zip = new JSZip();

    // Add CSV with proposal metadata
    const csvHeaders = [
      "ID",
      "Title",
      "Trade Type",
      "Client Name",
      "Client Email",
      "Total Cost",
      "Status",
      "Sent At",
      "Viewed At",
      "Accepted At",
      "Declined At",
      "Created At",
    ];

    const csvRows = userProposals.map((p) => [
      p.id,
      `"${p.title?.replace(/"/g, '""') || ""}"`,
      p.tradeType,
      `"${p.clientName?.replace(/"/g, '""') || ""}"`,
      p.clientEmail || "",
      p.totalCost || "",
      p.status,
      p.sentAt ? new Date(p.sentAt).toISOString() : "",
      p.viewedAt ? new Date(p.viewedAt).toISOString() : "",
      p.acceptedAt ? new Date(p.acceptedAt).toISOString() : "",
      p.declinedAt ? new Date(p.declinedAt).toISOString() : "",
      new Date(p.createdAt).toISOString(),
    ]);

    const csvContent = [csvHeaders.join(","), ...csvRows.map((row) => row.join(","))].join("\n");
    zip.file("proposals.csv", csvContent);

    // Add individual proposal details as JSON files
    const proposalsFolder = zip.folder("proposals");
    if (proposalsFolder) {
      for (const proposal of userProposals) {
        const proposalData = {
          id: proposal.id,
          title: proposal.title,
          tradeType: proposal.tradeType,
          clientName: proposal.clientName,
          clientEmail: proposal.clientEmail,
          clientAddress: proposal.clientAddress,
          jobScope: proposal.jobScope,
          materials: proposal.materials,
          laborCost: proposal.laborCost,
          materialsCost: proposal.materialsCost,
          totalCost: proposal.totalCost,
          status: proposal.status,
          sentAt: proposal.sentAt,
          viewedAt: proposal.viewedAt,
          acceptedAt: proposal.acceptedAt,
          declinedAt: proposal.declinedAt,
          pdfUrl: proposal.pdfUrl,
          createdAt: proposal.createdAt,
        };

        const filename = `${proposal.id}-${proposal.title?.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "proposal"}.json`;
        proposalsFolder.file(filename, JSON.stringify(proposalData, null, 2));
      }
    }

    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const buffer = Buffer.from(await zipBlob.arrayBuffer());

    // Return base64 encoded ZIP for download
    return {
      filename: `proposals-export-${new Date().toISOString().split("T")[0]}.zip`,
      data: buffer.toString("base64"),
      mimeType: "application/zip",
    };
  }),

  // Protected: Export specific proposals as ZIP
  exportProposals: protectedProcedure
    .input(z.object({ proposalIds: z.array(z.number()) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      if (input.proposalIds.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No proposals selected" });
      }

      // Fetch proposals (verify ownership)
      const userProposals = await db
        .select()
        .from(proposals)
        .where(eq(proposals.userId, ctx.user.id));

      const selectedProposals = userProposals.filter((p) => input.proposalIds.includes(p.id));

      if (selectedProposals.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No proposals found" });
      }

      // Create ZIP file
      const zip = new JSZip();

      // Add CSV with proposal metadata
      const csvHeaders = [
        "ID",
        "Title",
        "Trade Type",
        "Client Name",
        "Client Email",
        "Total Cost",
        "Status",
        "Sent At",
        "Viewed At",
        "Accepted At",
        "Declined At",
        "Created At",
      ];

      const csvRows = selectedProposals.map((p) => [
        p.id,
        `"${p.title?.replace(/"/g, '""') || ""}"`,
        p.tradeType,
        `"${p.clientName?.replace(/"/g, '""') || ""}"`,
        p.clientEmail || "",
        p.totalCost || "",
        p.status,
        p.sentAt ? new Date(p.sentAt).toISOString() : "",
        p.viewedAt ? new Date(p.viewedAt).toISOString() : "",
        p.acceptedAt ? new Date(p.acceptedAt).toISOString() : "",
        p.declinedAt ? new Date(p.declinedAt).toISOString() : "",
        new Date(p.createdAt).toISOString(),
      ]);

      const csvContent = [csvHeaders.join(","), ...csvRows.map((row) => row.join(","))].join("\n");
      zip.file("proposals.csv", csvContent);

      // Add individual proposal details as JSON files
      const proposalsFolder = zip.folder("proposals");
      if (proposalsFolder) {
        for (const proposal of selectedProposals) {
          const proposalData = {
            id: proposal.id,
            title: proposal.title,
            tradeType: proposal.tradeType,
            clientName: proposal.clientName,
            clientEmail: proposal.clientEmail,
            clientAddress: proposal.clientAddress,
            jobScope: proposal.jobScope,
            materials: proposal.materials,
            laborCost: proposal.laborCost,
            materialsCost: proposal.materialsCost,
            totalCost: proposal.totalCost,
            status: proposal.status,
            sentAt: proposal.sentAt,
            viewedAt: proposal.viewedAt,
            acceptedAt: proposal.acceptedAt,
            declinedAt: proposal.declinedAt,
            pdfUrl: proposal.pdfUrl,
            createdAt: proposal.createdAt,
          };

          const filename = `${proposal.id}-${proposal.title?.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "proposal"}.json`;
          proposalsFolder.file(filename, JSON.stringify(proposalData, null, 2));
        }
      }

      // Generate ZIP blob
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const buffer = Buffer.from(await zipBlob.arrayBuffer());

      // Return base64 encoded ZIP for download
      return {
        filename: `proposals-export-${new Date().toISOString().split("T")[0]}.zip`,
        data: buffer.toString("base64"),
        mimeType: "application/zip",
      };
    }),
});
