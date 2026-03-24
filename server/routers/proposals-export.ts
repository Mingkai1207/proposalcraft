// This file contains the export PDF endpoint to be added to proposals router
// Add this to the proposalRouter in server/routers/proposals.ts before the closing });

export const exportPdfEndpoint = `
  exportPdf: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await getProposalById(input.id);
      if (!proposal || proposal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }

      const profile = await getContractorProfile(ctx.user.id);
      if (!profile) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Contractor profile not found",
        });
      }

      const pdfData: ProposalPdfData = {
        businessName: profile.businessName || ctx.user.name || "Your Business",
        businessPhone: profile.businessPhone || "(555) 000-0000",
        businessEmail: profile.businessEmail || ctx.user.email || "info@business.com",
        businessAddress: profile.businessAddress || "123 Main St, City, ST 12345",
        licenseNumber: profile.licenseNumber || "License #",
        clientName: proposal.clientName || "Valued Client",
        clientAddress: proposal.clientAddress || "Client Address",
        clientPhone: proposal.clientPhone || "(555) 000-0000",
        clientEmail: proposal.clientEmail || "client@email.com",
        jobTitle: proposal.title,
        preparedDate: new Date(proposal.createdAt).toLocaleDateString(),
        validUntil: new Date(new Date(proposal.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        jobSite: proposal.clientAddress || "Job Site Address",
        jobDetails: proposal.jobScope?.substring(0, 100) || "Project details",
        projectDetails: \`Start: \${new Date(proposal.createdAt).toLocaleDateString()}\\nDuration: TBD\\nPermit: Included\`,
        executiveSummary: proposal.content?.substring(0, 300) || "Professional proposal for your project.",
        scopeOfWork: [
          "Complete project assessment",
          "Professional installation",
          "Quality assurance",
          "Customer satisfaction guaranteed",
        ],
        materials: [
          "Premium materials",
          "Professional equipment",
          "Safety compliance",
        ],
        timeline: [
          "Day 1: Site preparation",
          "Day 2: Installation",
          "Day 3: Final inspection",
        ],
        whyChooseUs: "We provide professional, reliable service backed by years of experience and customer satisfaction.",
        termsAndConditions: profile.defaultTerms || "50% deposit required to schedule. Balance due upon completion. 1-year warranty on all work.",
        laborCost: parseInt(proposal.laborCost) || 2000,
        materialsCost: parseInt(proposal.materialsCost) || 3000,
        totalCost: parseInt(proposal.totalCost) || 5000,
      };

      const pdfBuffer = await generateProposalPdf(pdfData);
      const fileName = \`proposal-\${proposal.id}-\${Date.now()}.pdf\`;
      const { url } = await storagePut(fileName, pdfBuffer, "application/pdf");

      return { url, fileName };
    }),
`;
