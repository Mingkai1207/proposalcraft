import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";
import {
  createProposal,
  getUserProposals,
  getProposalById,
  updateProposal,
  deleteProposal,
  ensureSubscription,
  incrementProposalUsage,
  getPlanLimit,
  getContractorProfile,
  createEmailEvent,
} from "../db";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { proposalTemplates } from "../../drizzle/schema";
import { getDb } from "../db";
import { ENV } from "../_core/env";
import { generateProposalPdf, type ProposalPdfData } from "../utils/proposalPdfExport";

const ALL_TRADE_TYPES = ["hvac", "plumbing", "electrical", "roofing", "general", "painting", "flooring", "landscaping", "carpentry", "concrete", "masonry", "insulation", "drywall", "windows", "solar"] as const;

const TRADE_TEMPLATES: Record<string, string> = {
  hvac: "HVAC (Heating, Ventilation & Air Conditioning)",
  plumbing: "Plumbing",
  electrical: "Electrical",
  roofing: "Roofing",
  general: "General Contracting",
  painting: "Painting & Coatings",
  flooring: "Flooring Installation",
  landscaping: "Landscaping & Lawn Care",
  carpentry: "Carpentry & Woodworking",
  concrete: "Concrete & Foundation Work",
  masonry: "Masonry & Brickwork",
  insulation: "Insulation",
  drywall: "Drywall & Plastering",
  windows: "Windows & Doors",
  solar: "Solar Panel Installation",
};

export const proposalRouter = router({
  // List all proposals for the authenticated user
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserProposals(ctx.user.id);
  }),

  // Get a single proposal
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const proposal = await getProposalById(input.id);
      if (!proposal || proposal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }
      return proposal;
    }),

  // Generate a new AI proposal
  generate: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        tradeType: z.enum(ALL_TRADE_TYPES),
        clientName: z.string().optional(),
        clientEmail: z.string().email().optional().or(z.literal("")),
        clientAddress: z.string().optional(),
        jobScope: z.string().min(10),
        materials: z.string().optional(),
        laborCost: z.string().optional(),
        materialsCost: z.string().optional(),
        totalCost: z.string().optional(),
        language: z.string().optional(),
        expiryDays: z.number().min(1).default(30),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check subscription limits (admin users bypass all limits)
      const isAdmin = ctx.user.role === "admin";
      const sub = await ensureSubscription(ctx.user.id);
      if (!sub) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Subscription error" });

      if (!isAdmin) {
        const limit = getPlanLimit(sub.plan);
        if (sub.proposalsUsedThisMonth >= limit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You've reached your ${sub.plan} plan limit of ${limit} proposals/month. Please upgrade to continue.`,
          });
        }
      }

      // Get contractor profile for branding
      const profile = await getContractorProfile(ctx.user.id);
      const businessName = profile?.businessName || ctx.user.name || "Your Business";
      const tradeName = TRADE_TEMPLATES[input.tradeType] || "General Contracting";

      // Build AI prompt
      const langMap: Record<string, string> = {
        english: "English",
        chinese: "Simplified Chinese (简体中文)",
        spanish: "Spanish (Español)",
        french: "French (Français)",
        auto: "the same language as the job description",
      };
      const outputLang = langMap[input.language || "english"] || "English";

      // Trade-specific context to make proposals more accurate and detailed
      const TRADE_CONTEXT: Record<string, string> = {
        hvac: "Use HVAC-specific terminology: SEER2 ratings, BTU, tonnage, refrigerant types (R-410A, R-32), AFUE%, variable-speed blowers, heat exchangers, ductwork CFM, static pressure, load calculations. Mention permits, EPA 608 certification, and manufacturer warranties.",
        plumbing: "Use plumbing-specific terminology: pipe materials (PEX, copper, CPVC, ABS), fixture units, GPM/GPH flow rates, water pressure (PSI), drain slopes, venting requirements, shut-off valves, P-traps, cleanouts. Mention permits and code compliance.",
        electrical: "Use electrical-specific terminology: amperage, voltage, circuit breakers, AFCI/GFCI protection, conduit types (EMT, PVC), wire gauges (AWG), panel upgrades, load calculations, NEC code compliance. Mention permits and inspections.",
        roofing: "Use roofing-specific terminology: shingle types (architectural, 3-tab, metal, TPO, EPDM), underlayment, ice & water shield, drip edge, flashing, ridge cap, decking, R-value, pitch/slope. Mention manufacturer warranties and wind ratings.",
        painting: "Use painting-specific terminology: surface prep (sanding, priming, caulking), paint types (latex, oil-based, epoxy), sheen levels (flat, eggshell, satin, semi-gloss), mil thickness, VOC content, number of coats. Mention surface area in sq ft.",
        flooring: "Use flooring-specific terminology: subfloor prep, moisture barrier, underlayment, expansion gaps, transitions, species/grade (for hardwood), wear layer (for LVP), AC rating (for laminate), installation method (nail-down, glue-down, floating). Mention sq ft.",
        landscaping: "Use landscaping-specific terminology: grading, drainage, soil amendments, mulch depth, plant spacing, irrigation GPH/GPM, hardscape materials (pavers, flagstone), retaining wall height, sod vs. seed. Mention square footage and linear footage.",
        carpentry: "Use carpentry-specific terminology: wood species, joinery methods (mortise & tenon, pocket screws, dovetail), finish options (stain, paint, clear coat), hardware specs, load-bearing vs. decorative. Mention linear footage and board feet.",
        concrete: "Use concrete-specific terminology: PSI strength (3000, 4000 PSI), rebar size (#3, #4, #5), wire mesh, control joints, curing time, finish type (broom, exposed aggregate, stamped), thickness in inches. Mention sq ft and cubic yards.",
        masonry: "Use masonry-specific terminology: brick/block types, mortar mix (Type S, Type N), bond patterns (running, stack, herringbone), grout, flashing, weep holes, lintel sizes. Mention sq ft and linear footage.",
        insulation: "Use insulation-specific terminology: R-value, insulation types (spray foam open/closed cell, fiberglass batt, blown cellulose), vapor barrier, air sealing, thermal bridging. Mention sq ft and linear footage.",
        drywall: "Use drywall-specific terminology: board thickness (1/2\", 5/8\"), fire-rated (Type X), moisture-resistant (green board), joint compound coats, tape types, texture (knockdown, orange peel, smooth), corner bead. Mention sq ft.",
        windows: "Use windows/doors-specific terminology: U-factor, SHGC, Low-E coating, argon fill, frame materials (vinyl, fiberglass, aluminum, wood), rough opening dimensions, flashing, weatherstripping, hardware finish.",
        solar: "Use solar-specific terminology: panel wattage (W), system size (kW), inverter types (string, micro, power optimizer), battery storage (kWh), net metering, production estimate (kWh/year), payback period, federal ITC (30%), interconnection.",
        general: "Use general contracting terminology appropriate to the specific work described. Be precise about materials, dimensions, and methods.",
      };
      const tradeContext = TRADE_CONTEXT[input.tradeType] || TRADE_CONTEXT.general;

      const systemPrompt = `You are an expert proposal writer for ${tradeName} contractors. 
Write professional, persuasive job proposals that win contracts. 
IMPORTANT: Write the entire proposal in ${outputLang}. All section headers, body text, and pricing must be in ${outputLang}.

Trade-specific guidance: ${tradeContext}

Use clear, confident language. Structure proposals with these sections:
1. Executive Summary (2-3 sentences summarizing the project and your approach)
2. Scope of Work (detailed, specific breakdown using trade terminology)
3. Materials & Equipment (specific brands, models, specs where applicable)
4. Project Timeline (realistic phases with durations)
5. Investment Summary (labor vs. materials breakdown)
6. Why Choose Us (specific credentials, certifications, experience relevant to this trade)
7. Terms & Acceptance (payment schedule, warranty, change order policy)

CRITICAL RULES:
- DO NOT include a "Contact Information" section — contact details are already in the PDF header.
- DO NOT include signature blocks, acceptance lines, or "Accepted By" sections — those are added automatically.
- DO NOT use placeholder text like [Your Phone Number], [Your Email], [Your License Number], [Your Website] — if you don't have the data, simply omit that field.
- Use the actual business name and client name provided. Never substitute generic placeholders.
- Be specific and detailed — vague proposals lose to specific ones.
- Keep the tone professional but approachable.`;

      const userPrompt = `Create a professional ${tradeName} proposal with these details:

Business: ${businessName}
Client: ${input.clientName || "Valued Client"}
${input.clientAddress ? `Property Address: ${input.clientAddress}` : ""}

Job Scope: ${input.jobScope}
${input.materials ? `Materials/Equipment: ${input.materials}` : ""}
${input.laborCost ? `Labor Cost: $${input.laborCost}` : ""}
${input.materialsCost ? `Materials Cost: $${input.materialsCost}` : ""}
${input.totalCost ? `Total Investment: $${input.totalCost}` : ""}

${profile?.defaultTerms ? `Terms & Conditions: ${profile.defaultTerms}` : "Include standard contractor terms including payment schedule (50% deposit, 50% on completion), warranty information, and change order policy."}

Write a complete, ready-to-send proposal. Use professional formatting with clear section headers.`;

      // Gate premium models by plan — free users are silently downgraded to Gemini 2.5 Flash
      const PREMIUM_MODELS = ["gpt-4o", "gpt-4o-mini", "claude-3-7-sonnet-20250219", "deepseek-r1"];
      const PRO_ONLY_MODELS = ["gpt-4o", "claude-3-7-sonnet-20250219", "deepseek-r1"];
      const requestedModel = profile?.preferredModel || "gemini-2.5-flash";
      let model = requestedModel;
      if (sub.plan === "free" && PREMIUM_MODELS.includes(requestedModel)) {
        model = "gemini-2.5-flash"; // Free plan: downgrade to default
      } else if (sub.plan === "starter" && PRO_ONLY_MODELS.includes(requestedModel)) {
        model = "deepseek-v3"; // Starter plan: downgrade Pro-only models to DeepSeek V3
      }

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model,
      });

      const rawContent = response.choices[0]?.message?.content;
      const rawStr = typeof rawContent === "string" ? rawContent : "";

      // Post-process: strip AI-generated placeholder text, contact info sections,
      // and signature blocks that conflict with the PDF template's own sections.
      const generatedContent = rawStr
        // Remove entire "Contact Information" section (and any variant)
        .replace(/#{1,6}\s*Contact\s*Information[\s\S]*?(?=#{1,6}\s|$)/gi, "")
        // Remove entire "Accepted By" / signature block sections
        .replace(/#{1,6}\s*(Accepted By|Acceptance|Signature)[\s\S]*?(?=#{1,6}\s|$)/gi, "")
        // Remove standalone placeholder lines like [Your Phone Number]
        .replace(/^\[Your[^\]]+\]\s*$/gm, "")
        // Remove inline placeholders like [Your Phone Number], [Your Email Address], etc.
        .replace(/\[Your[^\]]+\]/g, "")
        // Remove lines that are just underscores (signature lines from AI)
        .replace(/^_{5,}\s*$/gm, "")
        // Remove "Signature: ____" style lines
        .replace(/^(Signature|Printed Name|Title|Date):\s*_{3,}\s*$/gm, "")
        // Clean up excessive blank lines left by removals
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      // Create tracking token
      const trackingToken = nanoid(32);

      // Save proposal to DB
      // Append watermark text for free-plan proposals (admin users are exempt)
      const isFree = sub.plan === "free" && !isAdmin;
      const watermarkedContent = isFree
        ? `${generatedContent}\n\n---\n*This proposal was generated with ProposAI Free. Upgrade to remove this watermark and unlock email delivery, tracking, and custom branding.*`
        : generatedContent;

      const proposal = await createProposal({
        userId: ctx.user.id,
        title: input.title,
        tradeType: input.tradeType,
        clientName: input.clientName || null,
        clientEmail: input.clientEmail || null,
        clientAddress: input.clientAddress || null,
        jobScope: input.jobScope,
        materials: input.materials || null,
        laborCost: input.laborCost || null,
        materialsCost: input.materialsCost || null,
        totalCost: input.totalCost || null,
        generatedContent: watermarkedContent,
        trackingToken,
        status: "draft",
        expiryDays: input.expiryDays,
      });

      // Increment usage
      await incrementProposalUsage(ctx.user.id);

      // Notify owner of new proposal generation
      await notifyOwner({
        title: "New Proposal Generated",
        content: `${ctx.user.name || ctx.user.email} generated a ${tradeName} proposal: "${input.title}"`,
      }).catch(() => {});

      return { ...proposal, modelDowngraded: model !== requestedModel, modelUsed: model };
    }),

  // Update proposal content
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        generatedContent: z.string().optional(),
        clientName: z.string().optional(),
        clientEmail: z.string().optional(),
        clientAddress: z.string().optional(),
        totalCost: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const proposal = await getProposalById(id);
      if (!proposal || proposal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }
      return updateProposal(id, ctx.user.id, data);
    }),

  // Delete a proposal
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await getProposalById(input.id);
      if (!proposal || proposal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }
      await deleteProposal(input.id, ctx.user.id);
      return { success: true };
    }),

  // Send proposal via email
  send: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        clientEmail: z.string().email(),
        clientName: z.string().optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const proposal = await getProposalById(input.id);
      if (!proposal || proposal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }

      const profile = await getContractorProfile(ctx.user.id);
      const businessName = profile?.businessName || ctx.user.name || "Your Contractor";
      const trackingUrl = `${ENV.oAuthServerUrl?.replace("api.", "") || "https://app.manus.space"}/api/track/${proposal.trackingToken}`;
      const portalLink = `${ENV.oAuthServerUrl?.replace("api.", "") || "https://app.manus.space"}/client-portal?token=${proposal.trackingToken}`;

      // Build email HTML
      const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; }
.header { background: #1a1a2e; color: white; padding: 24px; border-radius: 8px 8px 0 0; }
.content { background: #f9f9f9; padding: 24px; border: 1px solid #e0e0e0; }
.proposal-box { background: white; border: 1px solid #ddd; border-radius: 6px; padding: 20px; margin: 16px 0; white-space: pre-wrap; font-size: 14px; line-height: 1.6; }
.cta { background: #e8630a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 16px 0; }
.footer { color: #888; font-size: 12px; padding: 16px; text-align: center; }
</style></head>
<body>
<div class="header">
  <h2 style="margin:0">${businessName}</h2>
  <p style="margin:4px 0 0;opacity:0.8">Professional Proposal</p>
</div>
  <div class="content">
  <p>Dear ${input.clientName || "Valued Client"},</p>
  <p>${input.message || `Thank you for considering ${businessName} for your project. Please find our detailed proposal below.`}</p>
  <div class="proposal-box">${proposal.generatedContent || ""}</div>
  <p style="text-align:center;margin-top:24px">
    <a href="${portalLink}" class="cta">Review & Respond to Proposal</a>
  </p>
  <p>We look forward to working with you. Please don't hesitate to reach out with any questions.</p>
  <p>Best regards,<br><strong>${businessName}</strong></p>
  ${profile?.phone ? `<p>📞 ${profile.phone}</p>` : ""}
  ${profile?.email ? `<p>✉️ ${profile.email}</p>` : ""}
</div>
<div class="footer">
  <p>This proposal was sent via ProposAI</p>
  <img src="${trackingUrl}" width="1" height="1" style="display:none" alt="" />
</div>
</body>
</html>`;

      // Use the built-in notification system to send email
      // We'll use the forge API for email delivery
      try {
        const forgeUrl = process.env.BUILT_IN_FORGE_API_URL;
        const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;

        if (forgeUrl && forgeKey) {
          await fetch(`${forgeUrl}/notification/email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${forgeKey}`,
            },
            body: JSON.stringify({
              to: input.clientEmail,
              subject: `Proposal from ${businessName}: ${proposal.title}`,
              html: emailHtml,
            }),
          });
        }
      } catch (err) {
        console.error("[Email] Failed to send:", err);
      }

      // Record email event
      await createEmailEvent({ proposalId: proposal.id, eventType: "sent" });

      // Update proposal status and client info
      await updateProposal(input.id, ctx.user.id, {
        status: "sent",
        clientEmail: input.clientEmail,
        clientName: input.clientName || proposal.clientName || undefined,
        sentAt: new Date(),
      });

      return { success: true };
    }),

  // Create a shareable link for a proposal
  createShareLink: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await getProposalById(input.id);
      if (!proposal || proposal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }

      // Generate a unique token
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      // Save to database (simplified - in production use proper db helper)
      const shareUrl = `${ENV.oAuthServerUrl?.replace("api.", "") || "https://proposai.org"}/share/${token}`;
      return { token, shareUrl, expiresAt };
    }),

  // Send follow-up email if proposal not yet opened
  sendFollowUp: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await getProposalById(input.id);
      if (!proposal || proposal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }

      // Only send if proposal was sent but not yet viewed
      if (!proposal.sentAt || proposal.viewedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Can only send follow-up for sent but unopened proposals" });
      }

      // Check if already sent a follow-up
      if (proposal.followUpSentAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Follow-up already sent for this proposal" });
      }

      const profile = await getContractorProfile(ctx.user.id);
      const businessName = profile?.businessName || ctx.user.name || "Your Contractor";

      // Build follow-up email
      const followUpHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; }
.header { background: #1a1a2e; color: white; padding: 24px; border-radius: 8px 8px 0 0; }
.content { background: #f9f9f9; padding: 24px; border: 1px solid #e0e0e0; }
.cta { background: #e8630a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 16px 0; }
.footer { color: #888; font-size: 12px; padding: 16px; text-align: center; }
</style></head>
<body>
<div class="header">
<h2 style="margin: 0;">Quick reminder: ${proposal.title}</h2>
</div>
<div class="content">
<p>Hi ${proposal.clientName || "there"},</p>
<p>I wanted to follow up on the proposal I sent you for <strong>${proposal.title}</strong>. I haven't heard back yet, and I wanted to make sure you received it and had a chance to review it.</p>
<p>If you have any questions or would like to discuss the proposal further, I'm happy to help. Feel free to reach out anytime.</p>
<p style="margin-top: 24px;">Best regards,<br/><strong>${businessName}</strong></p>
</div>
<div class="footer">
<p>This is a follow-up to your proposal sent on ${new Date(proposal.sentAt!).toLocaleDateString()}.</p>
</div>
</body>
</html>
      `;

      // Send via forge API
      try {
        const forgeUrl = process.env.BUILT_IN_FORGE_API_URL;
        const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;

        if (forgeUrl && forgeKey && proposal.clientEmail) {
          await fetch(`${forgeUrl}/notification/email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${forgeKey}`,
            },
            body: JSON.stringify({
              to: proposal.clientEmail,
              subject: `Follow-up: ${proposal.title}`,
              html: followUpHtml,
            }),
          });
        }
      } catch (err) {
        console.error("[Email] Failed to send follow-up:", err);
      }

      // Record follow-up sent time
      await updateProposal(input.id, ctx.user.id, {
        followUpSentAt: new Date(),
      });

      return { success: true };
    }),

  exportPdf: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await getProposalById(input.id);
      if (!proposal || proposal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }

      const profile = await getContractorProfile(ctx.user.id);
      const businessName = profile?.businessName || ctx.user.name || "Your Business";
      const preparedDate = new Date(proposal.createdAt).toLocaleDateString();
      const validUntil = new Date(new Date(proposal.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();

      try {
        const content = proposal.generatedContent || "";

        // HTML-based proposals (Puppeteer): generatedContent is a full HTML document
        if (content.trimStart().toLowerCase().startsWith("<!doctype")) {
          const { generatePdfFromHtml } = await import("../utils/proposalPdfExport");
          const pdfBuffer = await generatePdfFromHtml(content);
          const fileName = `proposal-${proposal.id}-${Date.now()}.pdf`;
          const { url } = await storagePut(fileName, pdfBuffer, "application/pdf");
          await updateProposal(proposal.id, ctx.user.id, { pdfUrl: url });
          return { url, fileName };
        }

        // Legacy LaTeX-based proposals: generatedContent starts with \documentclass
        if (content.trimStart().startsWith("\\documentclass")) {
          const { latexToPdf } = await import("../utils/latexToPdf");
          const pdfBuffer = await latexToPdf(content);
          const fileName = `proposal-${proposal.id}-${Date.now()}.pdf`;
          const { url } = await storagePut(fileName, pdfBuffer, "application/pdf");
          await updateProposal(proposal.id, ctx.user.id, { pdfUrl: url });
          return { url, fileName };
        }

        // Use template renderer if proposal was created from a template
        if (proposal.templateId) {
          const { getTemplateStyle } = await import("../../shared/templateDefs");
          const style = getTemplateStyle(proposal.templateId);
          {
            const { renderTemplatePdf } = await import("../utils/templatePdfRenderer");
            const fields: Record<string, string> = proposal.templateFields ? JSON.parse(proposal.templateFields) : {};

            // Parse section contents from generatedContent.
            // The AI writes ## Title headers; the renderer expects ID keys.
            // Map both title and ID so either lookup works.
            const TITLE_TO_ID: Record<string, string> = {
              "Executive Summary": "executive_summary",
              "Scope of Work": "scope_of_work",
              "Materials & Equipment": "materials_equipment",
              "Project Timeline": "timeline",
              "Investment Summary": "investment",
              "Terms & Conditions": "terms",
            };
            const sectionContents: Record<string, string> = {};
            const content = proposal.generatedContent || "";
            const sectionMatches = Array.from(content.matchAll(/## ([^\n]+)\n([\s\S]*?)(?=\n## |$)/g));
            for (const match of sectionMatches) {
              const sectionTitle = match[1].trim();
              if (!sectionTitle) continue;
              // Store by both title and ID so renderer can find it either way
              sectionContents[sectionTitle] = match[2].trim();
              const id = TITLE_TO_ID[sectionTitle];
              if (id) sectionContents[id] = match[2].trim();
            }
            if (Object.keys(sectionContents).length === 0) sectionContents["content"] = content;

            const pdfBuffer = await renderTemplatePdf({
              style,
              title: proposal.title,
              tradeType: proposal.tradeType || "General Contracting",
              businessName,
              businessPhone: profile?.phone || "",
              businessEmail: profile?.email || ctx.user.email || "",
              businessAddress: profile?.address || "",
              licenseNumber: profile?.licenseNumber || "",
              clientName: proposal.clientName || "Valued Client",
              clientAddress: proposal.clientAddress || "",
              clientEmail: proposal.clientEmail || "",
              preparedDate,
              validUntil,
              sectionContents,
              fields,
            });

            const fileName = `proposal-${proposal.id}-${Date.now()}.pdf`;
            const { url } = await storagePut(fileName, pdfBuffer, "application/pdf");
            return { url, fileName };
          }
        }

        // Fallback: use legacy markdown-based renderer
        const pdfData: ProposalPdfData = {
          businessName,
          businessPhone: profile?.phone || "",
          businessEmail: profile?.email || ctx.user.email || "",
          businessAddress: profile?.address || "",
          licenseNumber: profile?.licenseNumber || "",
          clientName: proposal.clientName || "Valued Client",
          clientAddress: proposal.clientAddress || "",
          clientPhone: "",
          clientEmail: proposal.clientEmail || "",
          jobTitle: proposal.title,
          preparedDate,
          validUntil,
          laborCost: parseInt(proposal.laborCost || "2000") || 2000,
          materialsCost: parseInt(proposal.materialsCost || "3000") || 3000,
          totalCost: parseInt(proposal.totalCost || "5000") || 5000,
          proposalMarkdown: proposal.generatedContent || "No proposal content available.",
          termsOverride: profile?.defaultTerms || undefined,
        };
        const pdfBuffer = await generateProposalPdf(pdfData);
        const fileName = `proposal-${proposal.id}-${Date.now()}.pdf`;
        const { url } = await storagePut(fileName, pdfBuffer, "application/pdf");
        return { url, fileName };
      } catch (error) {
        console.error(`[PDF Export] Failed to generate PDF for proposal ${proposal.id}:`, error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate PDF. Please try again." });
      }
    }),

  exportWord: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await getProposalById(input.id);
      if (!proposal || proposal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }

      const profile = await getContractorProfile(ctx.user.id);
      const businessName = profile?.businessName || ctx.user.name || "Your Business";
      const preparedDate = new Date(proposal.createdAt).toLocaleDateString();
      const validUntil = new Date(new Date(proposal.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();

      try {
        const { htmlToDocx } = await import("../utils/htmlToDocx");
        const wordContent = proposal.generatedContent || "";

        let html: string;

        // New HTML-based proposals: use Claude's HTML directly
        if (wordContent.trimStart().toLowerCase().startsWith("<!doctype")) {
          html = wordContent;
        } else if (proposal.templateId) {
          const { getTemplateStyle, TEMPLATE_STYLES } = await import("../../shared/templateDefs");
          const { buildHtml } = await import("../utils/templatePdfRenderer");
          // Template-based proposal: use the same HTML as the PDF renderer
          const template = proposal.templateId ? getTemplateStyle(proposal.templateId) : TEMPLATE_STYLES[0];
          const fields: Record<string, string> = proposal.templateFields ? JSON.parse(proposal.templateFields) : {};
          const TITLE_TO_ID: Record<string, string> = {
            "Executive Summary": "executive_summary",
            "Scope of Work": "scope_of_work",
            "Materials & Equipment": "materials_equipment",
            "Project Timeline": "timeline",
            "Investment Summary": "investment",
            "Terms & Conditions": "terms",
          };
          const sectionContents: Record<string, string> = {};
          const content = proposal.generatedContent || "";
          const sectionMatches = Array.from(content.matchAll(/## ([^\n]+)\n([\s\S]*?)(?=\n## |$)/g));
          for (const match of sectionMatches) {
            const sectionTitle = match[1].trim();
            if (!sectionTitle) continue;
            sectionContents[sectionTitle] = match[2].trim();
            const id = TITLE_TO_ID[sectionTitle];
            if (id) sectionContents[id] = match[2].trim();
          }
          if (Object.keys(sectionContents).length === 0) {
            sectionContents["content"] = content;
          }
          html = await buildHtml({
            style: template,
            tradeType: proposal.tradeType || "General Contracting",
            title: proposal.title,
            businessName,
            businessPhone: profile?.phone || "",
            businessEmail: profile?.email || ctx.user.email || "",
            businessAddress: profile?.address || "",
            licenseNumber: profile?.licenseNumber || "",
            clientName: proposal.clientName || "Valued Client",
            clientAddress: proposal.clientAddress || "",
            clientEmail: proposal.clientEmail || "",
            preparedDate,
            validUntil,
            sectionContents,
            fields,
          });
        } else {
          // Legacy proposal: use the markdown-based HTML builder
          const { buildProposalHtml } = await import("../utils/proposalPdfExport");
          html = buildProposalHtml({
            businessName,
            businessPhone: profile?.phone || "",
            businessEmail: profile?.email || ctx.user.email || "",
            businessAddress: profile?.address || "",
            licenseNumber: profile?.licenseNumber || "",
            clientName: proposal.clientName || "Valued Client",
            clientAddress: proposal.clientAddress || "",
            clientPhone: "",
            clientEmail: proposal.clientEmail || "",
            jobTitle: proposal.title,
            preparedDate,
            validUntil,
            laborCost: parseInt(proposal.laborCost || "2000") || 2000,
            materialsCost: parseInt(proposal.materialsCost || "3000") || 3000,
            totalCost: parseInt(proposal.totalCost || "5000") || 5000,
            proposalMarkdown: proposal.generatedContent || "No proposal content available.",
            termsOverride: profile?.defaultTerms || undefined,
          });
        }

        const docxBuffer = await htmlToDocx(html);
        const fileName = `proposal-${proposal.id}-${Date.now()}.docx`;
        const { url } = await storagePut(
          fileName,
          docxBuffer,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        return { url, fileName };
      } catch (error) {
        console.error(`[Word Export] Failed:`, error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate Word document." });
      }
    }),

  exportGoogleDocs: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await getProposalById(input.id);
      if (!proposal || proposal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }

      const profile = await getContractorProfile(ctx.user.id);
      const businessName = profile?.businessName || ctx.user.name || "Your Business";
      const preparedDate = new Date(proposal.createdAt).toLocaleDateString();
      const validUntil = new Date(new Date(proposal.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();

      try {
        const content = proposal.generatedContent || "";

        // HTML-based proposals: use Claude's HTML directly via htmlToDocx
        if (content.trimStart().toLowerCase().startsWith("<!doctype")) {
          const { htmlToDocx } = await import("../utils/htmlToDocx");
          const docxBuffer = await htmlToDocx(content);
          const fileName = `proposal-${proposal.id}-${Date.now()}.docx`;
          const { url: docxUrl } = await storagePut(
            fileName,
            docxBuffer,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          );
          const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(docxUrl)}&embedded=false`;
          return {
            docxUrl,
            googleDocsViewerUrl,
            instruction: "Click 'Open with Google Docs' in the viewer toolbar to create an editable copy in your Google Drive.",
          };
        }

        const { exportToGoogleDocs } = await import("../utils/googleDocsExporter");
        const { getTemplateStyle, TEMPLATE_STYLES } = await import("../../shared/templateDefs");

        const template = proposal.templateId ? getTemplateStyle(proposal.templateId) : TEMPLATE_STYLES[0];

        const fields: Record<string, string> = proposal.templateFields ? JSON.parse(proposal.templateFields) : {};
        const TITLE_TO_ID: Record<string, string> = {
          "Executive Summary": "executive_summary",
          "Scope of Work": "scope_of_work",
          "Materials & Equipment": "materials_equipment",
          "Project Timeline": "timeline",
          "Investment Summary": "investment",
          "Terms & Conditions": "terms",
        };
        const sectionContents: Record<string, string> = {};
        const sectionMatches = Array.from(content.matchAll(/## ([^\n]+)\n([\s\S]*?)(?=\n## |$)/g));
        for (const match of sectionMatches) {
          const sectionTitle = match[1].trim();
          if (!sectionTitle) continue;
          sectionContents[sectionTitle] = match[2].trim();
          const id = TITLE_TO_ID[sectionTitle];
          if (id) sectionContents[id] = match[2].trim();
        }
        if (Object.keys(sectionContents).length === 0) sectionContents["content"] = content;

        const result = await exportToGoogleDocs({
          style: template,
          tradeType: proposal.tradeType || "General Contracting",
          title: proposal.title,
          businessName,
          businessPhone: profile?.phone || "",
          businessEmail: profile?.email || ctx.user.email || "",
          businessAddress: profile?.address || "",
          licenseNumber: profile?.licenseNumber || "",
          clientName: proposal.clientName || "Valued Client",
          clientAddress: proposal.clientAddress || "",
          clientEmail: proposal.clientEmail || "",
          preparedDate,
          validUntil,
          sectionContents,
          fields,
        }, proposal.id);

        return result;
      } catch (error) {
        console.error(`[Google Docs Export] Failed:`, error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate Google Docs export." });
      }
    }),

  /**
   * Step 1 — Compile a structured summary from form inputs.
   * Uses the built-in LLM to produce a clean, bulleted summary for user review.
   * Saves the summary to the proposal record and returns it.
   */
  compileSummary: protectedProcedure
    .input(
      z.object({
        // Proposal identity
        title: z.string().min(1),
        tradeType: z.enum(ALL_TRADE_TYPES),
        // Client info
        clientName: z.string().optional(),
        clientEmail: z.string().email().optional().or(z.literal("")),
        clientAddress: z.string().optional(),
        // Project details
        jobScope: z.string().min(10),
        materials: z.string().optional(),
        laborCost: z.string().optional(),
        materialsCost: z.string().optional(),
        totalCost: z.string().optional(),
        estimatedDays: z.string().optional(),
        startDate: z.string().optional(),
        paymentTerms: z.string().optional(),
        specialNotes: z.string().optional(),
        language: z.string().optional(),
        expiryDays: z.number().min(1).default(30),
        colorScheme: z.string().optional(),
        tone: z.string().optional(),

      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check subscription limits
      const isAdmin = ctx.user.role === "admin";
      const sub = await ensureSubscription(ctx.user.id);
      if (!sub) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Subscription error" });
      if (!isAdmin) {
        const limit = getPlanLimit(sub.plan);
        if (sub.proposalsUsedThisMonth >= limit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You've reached your ${sub.plan} plan limit of ${limit} proposals/month. Please upgrade to continue.`,
          });
        }
      }

      const profile = await getContractorProfile(ctx.user.id);
      const businessName = profile?.businessName || ctx.user.name || "Your Business";
      const tradeName = TRADE_TEMPLATES[input.tradeType] || "General Contracting";

      const depositPercent = 50;
      const depositAmount = input.totalCost ? (parseFloat(input.totalCost) * depositPercent / 100).toFixed(2) : null;
      const balanceAmount = input.totalCost && depositAmount ? (parseFloat(input.totalCost) - parseFloat(depositAmount)).toFixed(2) : null;

      const summaryPrompt = `You are an expert ${tradeName} proposal writer. Using the job details below, write a complete, professional contractor proposal draft with all sections fully filled in. This draft will be reviewed by the contractor before being polished into the final document.

Write each section with real, specific content — not placeholders. Use the exact names, addresses, costs, and dates provided. If a value is not provided, make a reasonable professional inference based on the trade and job scope.

--- JOB DETAILS ---
Contractor Business: ${businessName}
${profile?.ownerName ? `Owner/Contact: ${profile.ownerName}` : ""}
${profile?.phone ? `Phone: ${profile.phone}` : ""}
${profile?.email ? `Email: ${profile.email}` : ""}
${profile?.address ? `Business Address: ${profile.address}` : ""}
${profile?.licenseNumber ? `License: ${profile.licenseNumber}` : ""}
Trade: ${tradeName}
Client Name: ${input.clientName || "(not specified)"}
Client Email: ${input.clientEmail || "(not specified)"}
Property Address: ${input.clientAddress || "(not specified)"}
Project Title: ${input.title}
Job Scope: ${input.jobScope}
${input.materials ? `Materials/Equipment Specified: ${input.materials}` : ""}
${input.laborCost ? `Labor Cost: $${input.laborCost}` : ""}
${input.materialsCost ? `Materials Cost: $${input.materialsCost}` : ""}
${input.totalCost ? `Total Project Cost: $${input.totalCost}` : ""}
${depositAmount ? `Deposit (50%): $${depositAmount}` : ""}
${balanceAmount ? `Balance on Completion (50%): $${balanceAmount}` : ""}
${input.estimatedDays ? `Estimated Duration: ${input.estimatedDays} days` : ""}
${input.startDate ? `Proposed Start Date: ${input.startDate}` : ""}
${input.paymentTerms ? `Payment Terms: ${input.paymentTerms}` : ""}
${input.specialNotes ? `Special Notes / Additional Requirements: ${input.specialNotes}` : ""}
${profile?.defaultTerms ? `Contractor's Standard Terms: ${profile.defaultTerms}` : ""}
--- END JOB DETAILS ---

Write the full proposal draft with these exact sections (use ## for each heading):

## Executive Summary
Write 2-3 paragraphs introducing the project, the contractor's qualifications, and the value this project delivers to the client. Be specific about the work being done and the outcome.

## Scope of Work
List every task that will be performed, numbered step by step. Be highly specific — include permit acquisition, material removal/disposal, installation steps, testing, commissioning, cleanup, and client walkthrough. Use ${tradeName}-specific technical terminology.

## Materials & Equipment
List all major materials and equipment with brand, model, and specifications where known. Organize by category (e.g. main unit, electrical, plumbing, hardware, consumables).

## Project Timeline
Break the project into phases by day. For each phase: name, duration, activities, and milestone. End with estimated completion date.

## Investment Summary
Provide an itemized cost breakdown (labor, materials, permits, etc.) and the total. Include a payment schedule (e.g. 50% deposit, 50% on completion) with exact dollar amounts.

## Why Choose Us
Write 3-4 compelling reasons why the client should choose ${businessName}. Include experience, certifications, warranty, and commitment to quality.

## Terms & Conditions
Write complete, professional terms covering: payment terms, workmanship warranty (1 year labor), manufacturer warranty pass-through, change order policy, liability limitations, permit responsibility, and client responsibilities.

RULES:
- Use real names and values throughout — never write [Your Name], [Client Name], or any placeholder
- Do NOT include a signature block or "Accepted By" section
- Do NOT include a Contact Information section
- Return ONLY the proposal draft. No preamble, no explanation.`;

      const { invokeLLM } = await import("../_core/llm");
      const summaryResult = await invokeLLM({
        messages: [{ role: "user", content: summaryPrompt }],
      });
      const rawSummary = summaryResult.choices[0]?.message?.content;
      const summaryContent = (typeof rawSummary === "string" ? rawSummary : "").trim();

      // Save a draft proposal record with the summary
      const trackingToken = nanoid(32);
      const stylePreferences = JSON.stringify({
        colorScheme: input.colorScheme || "auto",
        tone: input.tone || "professional",
      });

      const proposal = await createProposal({
        userId: ctx.user.id,
        title: input.title,
        tradeType: input.tradeType,
        clientName: input.clientName || null,
        clientEmail: input.clientEmail || null,
        clientAddress: input.clientAddress || null,
        jobScope: input.jobScope,
        materials: input.materials || null,
        laborCost: input.laborCost || null,
        materialsCost: input.materialsCost || null,
        totalCost: input.totalCost || null,
        summaryContent,
        stylePreferences,
        trackingToken,
        status: "draft",
        expiryDays: input.expiryDays,
      });

      if (!proposal) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save proposal" });

      return { proposalId: proposal.id, summaryContent };
    }),

  /**
   * Step 3 — Generate a full proposal from the user-approved summary.
   * Uses Claude (via Anthropic API if key available, else built-in LLM fallback).
   * Automatically exports PDF + Word (Starter/Pro) + Google Doc (Starter/Pro).
   */
  generateFromSummary: protectedProcedure
    .input(
      z.object({
        proposalId: z.number(),
        /** The user-edited summary from Step 2 */
        approvedSummary: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const proposal = await getProposalById(input.proposalId);
      if (!proposal || proposal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }

      const isAdmin = ctx.user.role === "admin";
      const sub = await ensureSubscription(ctx.user.id);
      if (!sub) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Subscription error" });

      const profile = await getContractorProfile(ctx.user.id);
      const businessName = profile?.businessName || ctx.user.name || "Your Business";
      const tradeName = TRADE_TEMPLATES[proposal.tradeType] || "General Contracting";

      // Parse style preferences
      let stylePref = { colorScheme: "auto", tone: "professional" };
      try {
        if (proposal.stylePreferences) stylePref = JSON.parse(proposal.stylePreferences);
      } catch {}

      const COLOR_SCHEMES: Record<string, string> = {
        navy: "Primary: #1B3A5C, Accent: #3498db, Success: #2ecc71, Highlight: #e74c3c",
        teal: "Primary: #0f4c5c, Accent: #0d9488, Highlight: #f59e0b, Success: #10b981",
        dark: "Primary: #0c1e33, Accent: #1e5a9e, Highlight: #f97316, Success: #22c55e",
        forest: "Primary: #1a3c34, Accent: #2d6a4f, Highlight: #d4a843, Success: #52b788",
        burgundy: "Primary: #4a1942, Accent: #8b2252, Highlight: #c4a35a, Success: #6b8e4e",
      };

      const colorInstruction = stylePref.colorScheme !== "auto" && COLOR_SCHEMES[stylePref.colorScheme]
        ? `USE THIS EXACT COLOR SCHEME: ${COLOR_SCHEMES[stylePref.colorScheme]}`
        : "Choose one of these color palettes:\n  * Navy theme: primary #1B3A5C, accent #3498db, success #2ecc71\n  * Dark blue theme: primary #0c1e33, accent #1e5a9e, highlight #f97316\n  * Teal theme: primary #0f4c5c, accent #0d9488, highlight #f59e0b";

      const TONE_MAP: Record<string, string> = {
        professional: "Use a professional, confident tone. Clear and direct.",
        friendly: "Use a warm, friendly tone. Approachable but still credible.",
        technical: "Use a highly technical, detailed tone. Include specs, codes, and precise measurements.",
        executive: "Use a formal, executive tone. Concise, authoritative, and polished.",
      };
      const toneInstruction = TONE_MAP[stylePref.tone] || TONE_MAP.professional;

      const TRADE_CONTEXT: Record<string, string> = {
        hvac: "Use HVAC-specific terminology: SEER2 ratings, BTU, tonnage, refrigerant types (R-410A, R-32), AFUE%, variable-speed blowers, heat exchangers, ductwork CFM, static pressure, load calculations. Mention permits, EPA 608 certification, and manufacturer warranties.",
        plumbing: "Use plumbing-specific terminology: pipe materials (PEX, copper, CPVC, ABS), fixture units, GPM/GPH flow rates, water pressure (PSI), drain slopes, venting requirements, shut-off valves, P-traps, cleanouts. Mention permits and code compliance.",
        electrical: "Use electrical-specific terminology: amperage, voltage, circuit breakers, AFCI/GFCI protection, conduit types (EMT, PVC), wire gauges (AWG), panel upgrades, load calculations, NEC code compliance. Mention permits and inspections.",
        roofing: "Use roofing-specific terminology: shingle types (architectural, 3-tab, metal, TPO, EPDM), underlayment, ice & water shield, drip edge, flashing, ridge cap, decking, R-value, pitch/slope. Mention manufacturer warranties and wind ratings.",
        painting: "Use painting-specific terminology: surface prep (sanding, priming, caulking), paint types (latex, oil-based, epoxy), sheen levels (flat, eggshell, satin, semi-gloss), mil thickness, VOC content, number of coats. Mention surface area in sq ft.",
        flooring: "Use flooring-specific terminology: subfloor prep, moisture barrier, underlayment, expansion gaps, transitions, species/grade (for hardwood), wear layer (for LVP), AC rating (for laminate), installation method (nail-down, glue-down, floating). Mention sq ft.",
        landscaping: "Use landscaping-specific terminology: grading, drainage, soil amendments, mulch depth, plant spacing, irrigation GPH/GPM, hardscape materials (pavers, flagstone), retaining wall height, sod vs. seed. Mention square footage and linear footage.",
        carpentry: "Use carpentry-specific terminology: wood species, joinery methods (mortise & tenon, pocket screws, dovetail), finish options (stain, paint, clear coat), hardware specs, load-bearing vs. decorative. Mention linear footage and board feet.",
        concrete: "Use concrete-specific terminology: PSI strength (3000, 4000 PSI), rebar size (#3, #4, #5), wire mesh, control joints, curing time, finish type (broom, exposed aggregate, stamped), thickness in inches. Mention sq ft and cubic yards.",
        masonry: "Use masonry-specific terminology: brick/block types, mortar mix (Type S, Type N), bond patterns (running, stack, herringbone), grout, flashing, weep holes, lintel sizes. Mention sq ft and linear footage.",
        insulation: "Use insulation-specific terminology: R-value, insulation types (spray foam open/closed cell, fiberglass batt, blown cellulose), vapor barrier, air sealing, thermal bridging. Mention sq ft and linear footage.",
        drywall: "Use drywall-specific terminology: board thickness (1/2\", 5/8\"), fire-rated (Type X), moisture-resistant (green board), joint compound coats, tape types, texture (knockdown, orange peel, smooth), corner bead. Mention sq ft.",
        windows: "Use windows/doors-specific terminology: U-factor, SHGC, Low-E coating, argon fill, frame materials (vinyl, fiberglass, aluminum, wood), rough opening dimensions, flashing, weatherstripping, hardware finish.",
        solar: "Use solar-specific terminology: panel wattage (W), system size (kW), inverter types (string, micro, power optimizer), battery storage (kWh), net metering, production estimate (kWh/year), payback period, federal ITC (30%), interconnection.",
        general: "Use general contracting terminology appropriate to the specific work described. Be precise about materials, dimensions, and methods.",
      };
      const tradeContext = TRADE_CONTEXT[proposal.tradeType] || TRADE_CONTEXT.general;

      const systemPrompt = `You are a professional proposal document generator. The user will send you a project summary. Transform it into a single, complete, self-contained HTML document ready for PDF conversion via Puppeteer.

STRICT OUTPUT RULES:
- Return ONLY raw HTML starting with <!DOCTYPE html>. No markdown, no backticks, no text before or after.
- Inline CSS only. No external stylesheets, no external fonts, no @import url() rules, no JavaScript.
- Do NOT use emoji characters anywhere in the document.
- Never omit, abbreviate, or skip any information from the summary.

PAGE LAYOUT (CRITICAL):
- The PDF is rendered by Puppeteer with top/bottom margins of 0.6in and left/right margins of 0.4in.
- Do NOT add your own @page margin rules — Puppeteer controls the margins externally.
- The content area width is approximately 700px. Design your layout to fit within this width.
- Use a .container wrapper: width: 700px; margin: 0 auto; padding: 0;
- html, body must have: margin: 0; padding: 0; height: auto; overflow: visible;

PAGE BREAK RULES (CRITICAL):
- NEVER use break-inside: avoid on large section-level divs — this truncates content taller than one page.
- NEVER use h1::before, h2::before, h3::before pseudo-elements — they displace cover banners and headers.
- To keep headings with their following content: h1, h2, h3 { break-after: avoid; page-break-after: avoid; }
- Table rows: tr { break-inside: avoid; page-break-inside: avoid; }
- Small callout boxes and chart containers only: break-inside: avoid; page-break-inside: avoid; display: block;
- Paragraphs: orphans: 3; widows: 3;
- Do NOT use break-before: page — let sections flow naturally.

VISUAL DESIGN (CRITICAL — the PDF must look polished and professional):
- ${colorInstruction}
- TONE: ${toneInstruction}
- Cover banner: Full-width colored banner at the top of page 1 with the proposal title in large white bold text, client name, address, and presenter name. Make it prominent (at least 100px tall).
- Section headers: Each major section (Executive Summary, Scope of Work, etc.) must have a visually distinct header — use a colored background bar, a thick left border accent, or an underline with the primary color. They must stand out clearly from body text.
- Tables: Styled with colored header row (primary color background, white text), alternating row backgrounds (#f9f9f9 / white), and clean 1px borders. Table text should be 0.9em for readability.
- Numbered lists (Scope of Work): Each item should have a bold label followed by the detail text. Use adequate spacing (margin-bottom: 0.5em) between items.
- Investment/cost total: The total amount should be in a highlighted box — colored background with white bold text.
- Signature block: Two-column layout with signature lines, printed name lines, and date lines for both parties.
- Font stack: font-family: 'Segoe UI', -apple-system, Arial, sans-serif; for body. Georgia or serif for headings if desired.
- Base font size: 13.5px-14px with line-height: 1.6 for body text.

SVG CHARTS (required — include at least 2 charts):
- Identify data that benefits from visualization: cost breakdowns, timelines, payment schedules, efficiency ratings, material quantities.
- Render all charts as inline SVG. No JavaScript, no external libraries.
- SVG sizing: width="100%" viewBox="0 0 700 [height]" to match the 700px content area.

Chart spacing rules (CRITICAL — prevents clipped labels):
- Left padding: at least 130px for row/axis labels.
- Right padding: at least 80px for value labels.
- Bar max width: (value / maxValue) * 400 to leave room for labels.

REQUIRED chart: Horizontal bar chart for cost breakdown
- One bar per cost category (Labor, Materials, Permits, etc.).
- Each bar has a different color. Show dollar amounts as labels to the right of each bar.
- Add a light gray track behind each bar (full width) for visual context.
- Include rounded corners (rx="4") on bars.

REQUIRED chart: Project timeline / Gantt chart
- One row per project phase. Each bar spans the phase's duration.
- Use different colors per phase. Keep phase labels short (max 15 chars, abbreviate if needed).
- Show day labels along the top or bottom axis.

RECOMMENDED chart: Budget allocation stacked bar
- A single horizontal stacked bar showing the proportion of each cost category.
- Color-coded segments with a legend below or to the right.
- NEVER use pie or donut charts — SVG arc math produces wrong proportions. Always use stacked bars instead.

Chart styling:
- Wrap each chart in a container div with: background: #fcfcfc; border: 1px solid #eee; border-radius: 6px; padding: 16px; margin: 1.5em 0; break-inside: avoid; display: block;
- Add a centered chart title above each chart in bold.
- Use the document's color scheme for bar fills.

STRUCTURE:
- Organize content into these sections (in order): Cover Banner, Executive Summary, Scope of Work, Materials & Equipment, Project Timeline (with Gantt chart), Investment Summary (with bar chart and stacked bar), Why Choose Us (if data available), Terms & Conditions, Acceptance & Signature Block.
- If a section is not in the summary, omit it gracefully — no placeholder text.`;

      const { invokeAnthropic } = await import("../utils/anthropicLLM");
      const result = await invokeAnthropic({
        model: "claude-sonnet-4-6-thinking",
        systemPrompt,
        messages: [{
          role: "user",
          content: input.approvedSummary,
        }],
        maxTokens: 40000,
      });

      // Extract raw HTML — strip any accidental markdown code fences
      let generatedHtml = result.content
        .replace(/^```html\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();

      // Ensure it starts with <!DOCTYPE html>
      if (!generatedHtml.toLowerCase().startsWith("<!doctype")) {
        const idx = generatedHtml.toLowerCase().indexOf("<!doctype");
        if (idx > 0) generatedHtml = generatedHtml.slice(idx);
      }

      const generatedContent = generatedHtml;

      // Save HTML to DB BEFORE compilation so it can be debugged if conversion fails
      await updateProposal(proposal.id, ctx.user.id, {
        generatedContent,
        summaryContent: input.approvedSummary,
      });

      // Auto-generate PDF from the HTML using Puppeteer (headless Chrome)
      let pdfUrl: string | null = null;
      try {
        const { generatePdfFromHtml } = await import("../utils/proposalPdfExport");
        const pdfBuffer = await generatePdfFromHtml(generatedContent);
        const pdfFileName = `proposal-${proposal.id}-${Date.now()}.pdf`;
        const { url } = await storagePut(pdfFileName, pdfBuffer, "application/pdf");
        pdfUrl = url;
        await updateProposal(proposal.id, ctx.user.id, { pdfUrl });
        console.log(`[PDF] Auto-generated PDF for proposal ${proposal.id}: ${pdfUrl}`);
      } catch (pdfErr) {
        console.error(`[PDF] Auto-generation failed for proposal ${proposal.id}:`, pdfErr);
        // Non-fatal: proposal is still saved, user can regenerate PDF later
      }

      await incrementProposalUsage(ctx.user.id);
      await notifyOwner({
        title: "New Proposal Generated (from Summary)",
        content: `${ctx.user.name || ctx.user.email} generated a ${tradeName} proposal: "${proposal.title}"`,
      }).catch(() => {});

      return {
        proposalId: proposal.id,
        pdfUrl,
        wordUrl: null,
        googleDocUrl: null,
        usedAnthropicApi: result.usedAnthropicApi,
      };
    }),

  /**
   * Revise proposal with AI — regenerates all documents after applying user's requested changes.
   * Available to Starter and Pro users only.
   */
  reviseWithAI: protectedProcedure
    .input(z.object({
      id: z.number(),
      message: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await getProposalById(input.id);
      if (!proposal || proposal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }

      const isAdmin = ctx.user.role === "admin";
      const sub = await ensureSubscription(ctx.user.id);
      if (!sub) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Subscription error" });

      const canRevise = isAdmin || sub.plan === "starter" || sub.plan === "pro";
      if (!canRevise) {
        throw new TRPCError({ code: "FORBIDDEN", message: "AI revision is available on Starter and Pro plans." });
      }

      const currentContent = proposal.generatedContent || "";
      const isHtmlProposal = currentContent.trimStart().toLowerCase().startsWith("<!doctype");
      const profile = await getContractorProfile(ctx.user.id);
      const businessName = profile?.businessName || ctx.user.name || "Your Business";

      const { invokeAnthropic } = await import("../utils/anthropicLLM");

      let updatedContent: string;

      if (isHtmlProposal) {
        // HTML-based proposals: ask Claude to return updated HTML
        const result = await invokeAnthropic({
          model: "claude-sonnet-4-6-thinking",
          systemPrompt: `You are a professional proposal document editor. The user has a contractor proposal written as a complete, self-contained HTML document and wants to make specific changes.

STRICT OUTPUT RULES:
- Return ONLY raw HTML starting with <!DOCTYPE html>. No markdown, no backticks, no text before or after.
- Inline CSS only. No external stylesheets, no external fonts, no @import url() rules, no JavaScript.
- Do NOT use emoji characters anywhere in the document.

PAGE BREAK RULES (preserve these in your output):
- NEVER use break-inside: avoid on large section-level divs.
- NEVER use h1::before, h2::before, h3::before pseudo-elements — they displace headers. If the existing HTML has these rules, REMOVE them.
- Instead use: h1, h2, h3 { break-after: avoid; page-break-after: avoid; }
- Table rows: tr { break-inside: avoid; page-break-inside: avoid; }
- Small callout boxes and chart containers only: break-inside: avoid; display: block;
- html, body: margin: 0; padding: 0; height: auto; overflow: visible;

SVG CHARTS:
- Use width="100%" viewBox="0 0 700 [height]" for all SVGs.
- Left padding: 130px for labels. Right padding: 80px for value labels. Bar max width: 400px.
- NEVER use pie or donut charts — use horizontal stacked bars for allocation data instead.
- Wrap each chart in a styled container div with break-inside: avoid; display: block;
- If updating chart data (costs, timeline, etc.), recalculate all bar widths and labels to match new values.

Your job:
1. Understand exactly what the user wants to change.
2. Apply the requested changes to the affected section(s).
3. Return the COMPLETE updated HTML document (not just the changed section).
4. Maintain the same professional design, inline CSS styles, SVG charts, and structure.
5. Keep the document optimized for A4 PDF output (Puppeteer, printBackground: true).
6. Ensure the cover banner is the FIRST element inside the container — nothing should appear before it.`,
          messages: [{
            role: "user",
            content: `Here is the current proposal HTML:\n\n${currentContent}\n\n---\n\nRevision request: ${input.message}`,
          }],
          maxTokens: 30000,
        });

        // Extract raw HTML — strip any accidental markdown code fences
        let rawHtml = result.content
          .replace(/^```html\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```\s*$/i, "")
          .trim();

        // Ensure it starts with <!DOCTYPE html>
        if (!rawHtml.toLowerCase().startsWith("<!doctype")) {
          const idx = rawHtml.toLowerCase().indexOf("<!doctype");
          if (idx > 0) rawHtml = rawHtml.slice(idx);
        }

        updatedContent = rawHtml;

        // HTML proposals: PDF is generated client-side via browser print
        await updateProposal(input.id, ctx.user.id, {
          generatedContent: updatedContent,
        });

        return { content: updatedContent, pdfUrl: null, wordUrl: null, googleDocUrl: null };
      }

      // Legacy markdown-based proposals
      const result = await invokeAnthropic({
        model: "claude-sonnet-4-6-thinking",
        systemPrompt: `You are a professional proposal editor. The user has a contractor proposal and wants to make specific changes.\n\nYour job:\n1. Understand exactly what the user wants to change\n2. Rewrite ONLY the affected section(s)\n3. Return the COMPLETE updated proposal in markdown format\n4. Maintain the same professional tone, formatting, and structure\n5. Do NOT add placeholder text like [Your Phone Number]\n6. Do NOT add signature blocks or contact information sections`,
        messages: [{
          role: "user",
          content: `Here is the current proposal:\n\n${currentContent}\n\n---\n\nRevision request: ${input.message}`,
        }],
        maxTokens: 8192,
      });

      updatedContent = result.content
        .replace(/#{1,6}\s*Contact\s*Information[\s\S]*?(?=#{1,6}\s|$)/gi, "")
        .replace(/#{1,6}\s*(Accepted By|Acceptance|Signature)[\s\S]*?(?=#{1,6}\s|$)/gi, "")
        .replace(/\[Your[^\]]+\]/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      // Re-export all documents for legacy markdown proposals
      const TITLE_TO_ID: Record<string, string> = {
        "Executive Summary": "executive_summary",
        "Scope of Work": "scope_of_work",
        "Materials & Equipment": "materials_equipment",
        "Project Timeline": "timeline",
        "Investment Summary": "investment",
        "Why Choose Us": "why_choose_us",
        "Terms & Conditions": "terms",
      };
      const sectionContents: Record<string, string> = {};
      const sectionMatches = Array.from(updatedContent.matchAll(/## ([^\n]+)\n([\s\S]*?)(?=\n## |$)/g));
      for (const match of sectionMatches) {
        const sectionTitle = match[1].trim();
        if (!sectionTitle) continue;
        sectionContents[sectionTitle] = match[2].trim();
        const id = TITLE_TO_ID[sectionTitle];
        if (id) sectionContents[id] = match[2].trim();
      }
      if (Object.keys(sectionContents).length === 0) sectionContents["content"] = updatedContent;

      const { getTemplateStyle } = await import("../../shared/templateDefs");
      const style = getTemplateStyle(proposal.templateId || "modern-wave");
      const preparedDate = new Date(proposal.createdAt).toLocaleDateString();
      const validUntil = new Date(new Date(proposal.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();
      const fields: Record<string, string> = proposal.templateFields ? JSON.parse(proposal.templateFields) : {};

      const exportInput = {
        style,
        tradeType: proposal.tradeType || "General Contracting",
        title: proposal.title,
        businessName,
        businessPhone: profile?.phone || "",
        businessEmail: profile?.email || ctx.user.email || "",
        businessAddress: profile?.address || "",
        licenseNumber: profile?.licenseNumber || "",
        clientName: proposal.clientName || "Valued Client",
        clientAddress: proposal.clientAddress || "",
        clientEmail: proposal.clientEmail || "",
        preparedDate,
        validUntil,
        sectionContents,
        fields,
      };

      const { renderTemplatePdf } = await import("../utils/templatePdfRenderer");
      const pdfBuffer = await renderTemplatePdf(exportInput);
      const pdfFileName = `proposal-${proposal.id}-revised-${Date.now()}.pdf`;
      const { url: pdfUrl } = await storagePut(pdfFileName, pdfBuffer, "application/pdf");

      let wordUrl: string | null = null;
      let googleDocUrl: string | null = null;

      if (isAdmin || sub.plan === "starter" || sub.plan === "pro") {
        const { htmlToDocx } = await import("../utils/htmlToDocx");
        const { buildHtml } = await import("../utils/templatePdfRenderer");
        const html = await buildHtml(exportInput);
        const docxBuffer = await htmlToDocx(html);
        const wordFileName = `proposal-${proposal.id}-revised-${Date.now()}.docx`;
        const { url: wUrl } = await storagePut(
          wordFileName,
          docxBuffer,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        wordUrl = wUrl;
        googleDocUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(wUrl)}&embedded=false`;
      }

      await updateProposal(input.id, ctx.user.id, {
        generatedContent: updatedContent,
        pdfUrl,
        wordUrl: wordUrl || undefined,
        googleDocUrl: googleDocUrl || undefined,
      });

      return { content: updatedContent, pdfUrl, wordUrl, googleDocUrl };
    }),

  /**
   * Function 2 — Generate a proposal from a saved template.
   * Sends the template content + new project summary to Claude, which writes
   * a new proposal following the template's structure.
   */
  generateFromTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        approvedSummary: z.string().min(10),
        title: z.string().min(1),
        tradeType: z.enum(ALL_TRADE_TYPES),
        clientName: z.string().optional(),
        clientEmail: z.string().email().optional().or(z.literal("")),
        clientAddress: z.string().optional(),
        jobScope: z.string().min(1),
        totalCost: z.string().optional(),
        estimatedDays: z.string().optional(),
        expiryDays: z.number().default(30),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      const sub = await ensureSubscription(ctx.user.id);
      if (!sub) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Subscription error" });
      if (!isAdmin) {
        const limit = getPlanLimit(sub.plan);
        if (sub.proposalsUsedThisMonth >= limit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You've reached your ${sub.plan} plan limit of ${limit} proposals/month. Please upgrade to continue.`,
          });
        }
      }

      // Fetch the template
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const template = await db
        .select()
        .from(proposalTemplates)
        .where(and(eq(proposalTemplates.id, input.templateId), eq(proposalTemplates.userId, ctx.user.id)))
        .then((r: any[]) => r[0]);
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });

      const profile = await getContractorProfile(ctx.user.id);
      const businessName = profile?.businessName || ctx.user.name || "Your Business";
      const tradeName = TRADE_TEMPLATES[input.tradeType] || "General Contracting";

      // Parse style metadata from template (if available)
      let styleInfo = "";
      if (template.styleMetadata) {
        try {
          const meta = JSON.parse(template.styleMetadata);
          styleInfo = `
TEMPLATE STYLE TO MATCH:
- Color palette: Primary ${meta.colors?.primary || "#1B3A5C"}, Accent ${meta.colors?.accent || "#3498db"}, Highlight ${meta.colors?.highlight || "#e74c3c"}
- Header style: ${meta.headerStyle || "banner"} (use colored banner headers for sections)
- Table style: ${meta.tableStyle || "colored-header"} (colored header rows with white text)
- Layout: ${meta.layoutPattern || "cover-banner"} (full-width cover banner at top)
- Charts found in template: ${(meta.chartTypes || []).join(", ") || "horizontal-bar, gantt"}
- Section order: ${(meta.sectionOrder || []).join(" → ") || "Executive Summary → Scope of Work → Materials → Timeline → Investment → Terms"}
- Fonts: Heading: ${meta.fonts?.heading || "Georgia, serif"}, Body: ${meta.fonts?.body || "'Segoe UI', system-ui, Arial, sans-serif"}
`;
        } catch {}
      }

      // Extract text content for structural reference
      const templateText = template.content || "";
      // Limit to first 3000 chars to avoid token bloat
      const templateExcerpt = templateText.length > 3000 ? templateText.substring(0, 3000) + "\n...[truncated]" : templateText;

      const TRADE_CONTEXT: Record<string, string> = {
        hvac: "Use HVAC-specific terminology: SEER2 ratings, BTU, tonnage, refrigerant types, AFUE%, variable-speed blowers.",
        plumbing: "Use plumbing-specific terminology: pipe materials (PEX, copper), fixture units, GPM flow rates, PSI.",
        electrical: "Use electrical-specific terminology: amperage, voltage, circuit breakers, AFCI/GFCI, wire gauges, NEC code.",
        roofing: "Use roofing-specific terminology: shingle types, underlayment, ice & water shield, flashing, pitch/slope.",
        painting: "Use painting-specific terminology: surface prep, paint types, sheen levels, mil thickness, VOC content.",
        flooring: "Use flooring-specific terminology: subfloor prep, moisture barrier, underlayment, wear layer, AC rating.",
        landscaping: "Use landscaping-specific terminology: grading, drainage, soil amendments, irrigation, hardscape materials.",
        carpentry: "Use carpentry-specific terminology: wood species, joinery methods, finish options, load-bearing analysis.",
        concrete: "Use concrete-specific terminology: PSI strength, rebar size, control joints, finish type, cubic yards.",
        masonry: "Use masonry-specific terminology: brick/block types, mortar mix, bond patterns, flashing, weep holes.",
        insulation: "Use insulation-specific terminology: R-value, spray foam types, vapor barrier, air sealing.",
        drywall: "Use drywall-specific terminology: board thickness, fire-rated Type X, joint compound coats, texture types.",
        windows: "Use windows/doors-specific terminology: U-factor, SHGC, Low-E coating, frame materials, weatherstripping.",
        solar: "Use solar-specific terminology: panel wattage, system size kW, inverter types, net metering, federal ITC 30%.",
        general: "Use general contracting terminology appropriate to the specific work described.",
      };
      const tradeContext = TRADE_CONTEXT[input.tradeType] || TRADE_CONTEXT.general;

      const systemPrompt = `You are a professional proposal document generator for ${tradeName} contractors.
You are given a TEMPLATE PROPOSAL for reference and NEW PROJECT INFORMATION. Generate a complete, self-contained HTML document that:
1. Follows the same STRUCTURE and SECTION ORDER as the template
2. Matches the template's VISUAL STYLE (colors, header treatment, table design, chart types)
3. Uses ALL the new project information provided
4. Includes embedded SVG analytic charts (cost breakdown bar chart, project timeline Gantt chart)

${tradeContext}
${styleInfo}

STRICT OUTPUT RULES:
- Return ONLY raw HTML starting with <!DOCTYPE html>. No markdown, no backticks, no text before or after.
- Inline CSS only. No external stylesheets, no external fonts, no @import url() rules, no JavaScript.
- Do NOT use emoji characters anywhere in the document.
- Never omit, abbreviate, or skip any information from the project summary.

PAGE LAYOUT (CRITICAL):
- The PDF is rendered by Puppeteer with top/bottom margins of 0.6in and left/right margins of 0.4in.
- Do NOT add your own @page margin rules — Puppeteer controls the margins externally.
- The content area width is approximately 700px. Use a .container wrapper: width: 700px; margin: 0 auto;
- html, body must have: margin: 0; padding: 0; height: auto; overflow: visible;

PAGE BREAK RULES (CRITICAL):
- NEVER use break-inside: avoid on large section-level divs.
- NEVER use h1::before, h2::before, h3::before pseudo-elements.
- To keep headings with content: h1, h2, h3 { break-after: avoid; page-break-after: avoid; }
- Table rows: tr { break-inside: avoid; page-break-inside: avoid; }
- Paragraphs: orphans: 3; widows: 3;

SVG CHARTS (required — include at least 2 charts):
- Render all charts as inline SVG. No JavaScript, no external libraries.
- SVG sizing: width="100%" viewBox="0 0 700 [height]"
- Left padding: at least 130px for labels. Right padding: at least 80px for value labels.
- Bar max width: (value / maxValue) * 400 to leave room for labels.
- REQUIRED: Horizontal bar chart for cost breakdown
- REQUIRED: Project timeline / Gantt chart
- NEVER use pie or donut charts — use horizontal stacked bars instead.
- Wrap each chart in a container div with: background: #fcfcfc; border: 1px solid #eee; border-radius: 6px; padding: 16px; margin: 1.5em 0; break-inside: avoid; display: block;

Font stack: font-family: 'Segoe UI', -apple-system, Arial, sans-serif;
Base font size: 13.5px-14px with line-height: 1.6 for body text.`;

      const { invokeAnthropic } = await import("../utils/anthropicLLM");
      const result = await invokeAnthropic({
        model: "claude-sonnet-4-6-thinking",
        systemPrompt,
        messages: [{
          role: "user",
          content: `TEMPLATE PROPOSAL (follow this structure and style):\n\n${templateExcerpt}\n\n---\n\nNEW PROJECT INFORMATION:\n\n${input.approvedSummary}\n\nGenerate the complete HTML proposal now.`,
        }],
        maxTokens: 40000,
      });

      // Extract raw HTML
      let generatedHtml = result.content
        .replace(/^```html\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();

      if (!generatedHtml.toLowerCase().startsWith("<!doctype")) {
        const idx = generatedHtml.toLowerCase().indexOf("<!doctype");
        if (idx > 0) generatedHtml = generatedHtml.slice(idx);
      }

      let generatedContent = generatedHtml;

      if (sub.plan === "free" && !isAdmin) {
        // For free plan, we'll add a watermark via the PDF export, not in the HTML
      }

      const trackingToken = nanoid(32);

      // Create proposal record
      const proposal = await createProposal({
        userId: ctx.user.id,
        title: input.title,
        tradeType: input.tradeType,
        clientName: input.clientName || null,
        clientEmail: input.clientEmail || null,
        clientAddress: input.clientAddress || null,
        jobScope: input.jobScope,
        totalCost: input.totalCost || null,
        generatedContent,
        summaryContent: input.approvedSummary,
        trackingToken,
        status: "draft",
        expiryDays: input.expiryDays,
        templateId: String(input.templateId),
      });
      if (!proposal) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save proposal" });

      // Auto-generate PDF from HTML using Puppeteer
      let pdfUrl: string | null = null;
      try {
        const { generatePdfFromHtml } = await import("../utils/proposalPdfExport");
        const pdfBuffer = await generatePdfFromHtml(generatedContent);
        const pdfFileName = `proposal-${proposal.id}-${Date.now()}.pdf`;
        const { url } = await storagePut(pdfFileName, pdfBuffer, "application/pdf");
        pdfUrl = url;
        await updateProposal(proposal.id, ctx.user.id, { pdfUrl });
      } catch (pdfErr) {
        console.error(`[PDF] Auto-generation failed for template proposal ${proposal.id}:`, pdfErr);
      }

      // Auto-generate Word + Google Docs for Starter/Pro
      let wordUrl: string | null = null;
      let googleDocUrl: string | null = null;
      const canExportAdvanced = isAdmin || sub.plan === "starter" || sub.plan === "pro";
      if (canExportAdvanced) {
        try {
          const { htmlToDocx } = await import("../utils/htmlToDocx");
          const docxBuffer = await htmlToDocx(generatedContent);
          const wordFileName = `proposal-${proposal.id}-${Date.now()}.docx`;
          const { url: wUrl } = await storagePut(
            wordFileName,
            docxBuffer,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          );
          wordUrl = wUrl;
          googleDocUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(wUrl)}&embedded=false`;
        } catch (wordErr) {
          console.error(`[Word] Auto-generation failed for template proposal ${proposal.id}:`, wordErr);
        }
      }

      await updateProposal(proposal.id, ctx.user.id, {
        pdfUrl: pdfUrl || undefined,
        wordUrl: wordUrl || undefined,
        googleDocUrl: googleDocUrl || undefined,
      });

      await incrementProposalUsage(ctx.user.id);
      await notifyOwner({
        title: "New Proposal Generated (from Template)",
        content: `${ctx.user.name || ctx.user.email} generated a ${tradeName} proposal from template: "${input.title}"`,
      }).catch(() => {});

      return { proposalId: proposal.id, pdfUrl, wordUrl, googleDocUrl, usedAnthropicApi: result.usedAnthropicApi };
    }),

  /**
   * AI refinement chat: user sends a message requesting changes to the proposal,
   * AI rewrites the specified section(s) and returns the updated content.
   */
  refineProposal: protectedProcedure
    .input(z.object({
      id: z.number(),
      message: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await getProposalById(input.id);
      if (!proposal || proposal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proposal not found" });
      }

      const currentContent = proposal.generatedContent || "";
      const isHtmlProposal = currentContent.trimStart().toLowerCase().startsWith("<!doctype");

      let updatedContent: string;

      if (isHtmlProposal) {
        // HTML-based proposals: use Anthropic to return updated HTML
        const { invokeAnthropic } = await import("../utils/anthropicLLM");
        const result = await invokeAnthropic({
          model: "claude-sonnet-4-6-thinking",
          systemPrompt: `You are a professional proposal document editor. The user has a contractor proposal written as a complete, self-contained HTML document and wants to make specific changes.

STRICT OUTPUT RULES:
- Return ONLY raw HTML starting with <!DOCTYPE html>. No markdown, no backticks, no text before or after.
- Inline CSS only. No external stylesheets, no external fonts, no @import url() rules, no JavaScript.
- Do NOT use emoji characters anywhere in the document.

PAGE BREAK RULES (preserve these in your output):
- NEVER use break-inside: avoid on large section-level divs.
- NEVER use h1::before, h2::before, h3::before pseudo-elements — they displace headers. If the existing HTML has these rules, REMOVE them.
- Instead use: h1, h2, h3 { break-after: avoid; page-break-after: avoid; }
- Table rows: tr { break-inside: avoid; page-break-inside: avoid; }
- Small callout boxes and chart containers only: break-inside: avoid; display: block;
- html, body: margin: 0; padding: 0; height: auto; overflow: visible;

SVG CHARTS:
- Use width="100%" viewBox="0 0 700 [height]" for all SVGs.
- Left padding: 130px for labels. Right padding: 80px for value labels. Bar max width: 400px.
- NEVER use pie or donut charts — use horizontal stacked bars for allocation data instead.
- Wrap each chart in a styled container div with break-inside: avoid; display: block;
- If updating chart data (costs, timeline, etc.), recalculate all bar widths and labels to match new values.

Your job:
1. Understand exactly what the user wants to change.
2. Apply the requested changes to the affected section(s).
3. Return the COMPLETE updated HTML document (not just the changed section).
4. Maintain the same professional design, inline CSS styles, SVG charts, and structure.
5. Keep the document optimized for A4 PDF output (Puppeteer, printBackground: true).
6. Ensure the cover banner is the FIRST element inside the container — nothing should appear before it.`,
          messages: [{
            role: "user",
            content: `Here is the current proposal HTML:\n\n${currentContent}\n\n---\n\nRevision request: ${input.message}`,
          }],
          maxTokens: 30000,
        });

        // Extract raw HTML — strip any accidental markdown code fences
        let rawHtml = result.content
          .replace(/^```html\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```\s*$/i, "")
          .trim();

        if (!rawHtml.toLowerCase().startsWith("<!doctype")) {
          const idx = rawHtml.toLowerCase().indexOf("<!doctype");
          if (idx > 0) rawHtml = rawHtml.slice(idx);
        }

        updatedContent = rawHtml;
      } else {
        // Legacy markdown proposals: use free built-in LLM
        const { invokeLLM } = await import("../_core/llm");
        const response = await invokeLLM({
          messages: [
            { role: "system", content: `You are a professional proposal editor. The user has a contractor proposal and wants to make specific changes to it.\n\nYour job is to:\n1. Understand exactly what the user wants to change\n2. Rewrite ONLY the affected section(s) of the proposal\n3. Return the COMPLETE updated proposal content (not just the changed section)\n4. Maintain the same professional tone, formatting, and structure\n5. Keep all sections that were NOT requested to change exactly as they are\n6. Do NOT add placeholder text like [Your Phone Number] or [Your Email]\n7. Do NOT add signature blocks or contact information sections at the end\n\nReturn ONLY the updated proposal content in markdown format. No preamble, no explanation.` },
            { role: "user", content: `Here is the current proposal content:\n\n${currentContent}\n\n---\n\nUser request: ${input.message}` },
          ],
        });
        const rawContent = response.choices[0]?.message?.content;
        updatedContent = typeof rawContent === "string" ? rawContent : currentContent;
      }

      // Save the updated content to the database
      await updateProposal(input.id, ctx.user.id, { generatedContent: updatedContent });

      return { content: updatedContent };
    }),
});
