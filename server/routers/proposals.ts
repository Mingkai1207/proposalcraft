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

  // Old generateFromTemplate removed — see new generateFromTemplate below (Function 2)
  _placeholder_removed: protectedProcedure
    .input(z.object({ _: z.string().optional() }))
    .mutation(async () => { throw new TRPCError({ code: "NOT_FOUND", message: "Removed" }); }),

  // Placeholder to keep router valid until old code is fully removed
  _old_generateFromTemplate_removed: protectedProcedure
    .input(
      z.object({
        templateId: z.string().min(1),
        title: z.string().min(1),
        language: z.string().optional().default("english"),
        fields: z.record(z.string(), z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { getTemplateStyle, PROPOSAL_SECTIONS, PROPOSAL_INPUT_FIELDS } = await import("../../shared/templateDefs");
      const style = getTemplateStyle(input.templateId);

      // Check subscription limits (admin bypasses)
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

      const langMap: Record<string, string> = {
        english: "English", chinese: "Simplified Chinese (简体中文)",
        spanish: "Spanish (Español)", french: "French (Français)",
      };
      const outputLang = langMap[input.language] || "English";

      // Build field context string for the AI using the standard input fields
      const fieldContext = PROPOSAL_INPUT_FIELDS
        .filter((f) => input.fields[f.id])
        .map((f) => `${f.label}: ${input.fields[f.id]}`)
        .join("\n");

      const tradeType = (input.fields["trade_type"] || "general").toLowerCase().replace(/[^a-z]/g, "") as typeof ALL_TRADE_TYPES[number];
      const tradeName = input.fields["trade_type"] || "General Contracting";

      // Fill each standard section individually with section-specific prompts
      const sectionContents: Record<string, string> = {};

      for (const section of PROPOSAL_SECTIONS) {
        const sectionPrompt = `You are an expert proposal writer for ${tradeName} contractors.
Write ONLY the content for the "${section.title}" section. Do NOT include the section header.
Write in ${outputLang}.
Do NOT include placeholder text like [Your X]. Do NOT include signature blocks or contact info.

Section instructions: ${section.aiPromptHint}

Business name: ${businessName}
Client: ${input.fields["client_name"] || "Valued Client"}
${input.fields["client_address"] ? `Property: ${input.fields["client_address"]}` : ""}

Project details:
${fieldContext}`;

        const response = await invokeLLM({
          messages: [{ role: "user", content: sectionPrompt }],
          model: "gemini-2.5-flash",
        });

        const content = response.choices[0]?.message?.content;
        sectionContents[section.id] = typeof content === "string" ? content.trim() : "";
      }

      // Assemble the full markdown document from sections
      const markdownParts: string[] = [];
      for (const section of PROPOSAL_SECTIONS) {
        markdownParts.push(`## ${section.title}\n\n${sectionContents[section.id] || ""}`);
      }
      const generatedContent = markdownParts.join("\n\n");

      const trackingToken = nanoid(32);
      const isFree = sub.plan === "free" && !isAdmin;
      const watermarkedContent = isFree
        ? `${generatedContent}\n\n---\n*This proposal was generated with ProposAI Free. Upgrade to remove this watermark.*`
        : generatedContent;

      // Store the style ID and the fields for later export
      const proposal = await createProposal({
        userId: ctx.user.id,
        title: input.title,
        tradeType: tradeType || "general",
        clientName: input.fields["client_name"] || null,
        clientEmail: input.fields["client_email"] || null,
        clientAddress: input.fields["client_address"] || null,
        jobScope: input.fields["job_description"] || "See proposal content",
        materials: null,
        laborCost: input.fields["labor_cost"] || null,
        materialsCost: input.fields["materials_cost"] || null,
        totalCost: input.fields["total_cost"] || null,
        generatedContent: watermarkedContent,
        trackingToken,
        status: "draft",
        expiryDays: 30,
        templateId: style.id,
        templateFields: JSON.stringify(input.fields),
      });

      if (!proposal) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save proposal" });

      await incrementProposalUsage(ctx.user.id);
      await notifyOwner({
        title: "New Template Proposal Generated",
        content: `${ctx.user.name || ctx.user.email} used style "${style.name}" to create: "${input.title}"`,
      }).catch(() => {});

      return { id: proposal.id };
    }),

  // ─── Helper: parse markdown sections by title and remap to canonical IDs ─────
  // The AI generates markdown with ## Title headers. The template renderer
  // looks up content by section ID (e.g. "executive_summary"). This helper
  // bridges the gap by mapping titles → IDs.

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

        // HTML-based proposals (WeasyPrint): generatedContent is a full HTML document
        if (content.trimStart().toLowerCase().startsWith("<!doctype")) {
          const { htmlToPdf } = await import("../utils/htmlToPdf");
          const pdfBuffer = await htmlToPdf(content);
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
      const stylePreferences = JSON.stringify({});

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

      const systemPrompt = `You are an expert ${tradeName} proposal writer. Generate a complete, professional contractor proposal as a single self-contained HTML document.

Trade expertise: ${tradeContext}

HTML DOCUMENT REQUIREMENTS:
- Return a complete <!DOCTYPE html>...</html> document with all CSS embedded in a <style> block in <head>
- Use @page CSS rules for print layout: size: letter; margin: 1in 0.8in;
- Add running headers/footers using @page named pages or CSS counters
- Design a visually impressive header section with the contractor business name, client info, proposal date, and project title
- Use a professional color scheme with 2-3 accent colors (not just black and white)
- Include these sections: Executive Summary, Scope of Work, Materials & Equipment, Project Timeline, Investment Summary, Why Choose Us, Terms & Conditions
- Use real data throughout — never use placeholders like [Your Name] or [Client Name]
- Do NOT include signature blocks, Accepted By sections, or Contact Information sections

PAGE BREAK RULES (critical for clean PDF output):
- Every section div must have: break-inside: avoid-page;
- Every h2/h3 must have: break-after: avoid;
- Every paragraph must have: orphans: 3; widows: 3;
- Tables must have: break-inside: avoid;
- Add page-break-before: always; before major sections (Scope of Work, Investment Summary)

ANALYTIC CHARTS (REQUIRED — use inline SVG):
1. Cost Breakdown: An SVG bar chart or pie chart showing labor cost vs. materials cost with dollar labels
2. Payment Schedule: An SVG bar chart showing payment milestones (deposit, progress payment, final) with amounts
3. Project Timeline: An SVG Gantt-style horizontal bar chart showing each project phase with duration
- All SVG charts must use hardcoded data values from the proposal
- Size each SVG to fit within the page: width="100%" viewBox="0 0 700 250" (adjust height as needed)
- Include a title and axis labels on each chart
- Use the same accent colors as the rest of the document

TYPOGRAPHY & LAYOUT:
- Use Google Fonts via @import: choose a professional font pair (e.g., Playfair Display + Source Sans Pro, or Merriweather + Open Sans)
- Font size: body 11pt, h1 22pt, h2 14pt
- Line height: 1.6 for body text
- Use colored section headers with a left border accent or bottom border
- Use alternating row colors in tables
- Use a highlighted total row in cost tables
- Wrap each section in a <div class="section"> for consistent spacing

STRICT OUTPUT RULE: Return ONLY the raw HTML. No markdown, no code fences, no explanation. Start with <!DOCTYPE html> and end with </html>.`;

      const { invokeAnthropic } = await import("../utils/anthropicLLM");
      const result = await invokeAnthropic({
        model: "claude-sonnet-4-6-thinking",
        systemPrompt,
        messages: [{
          role: "user",
          content: `Use this proposal draft to generate the complete HTML proposal document:\n\n${input.approvedSummary}`,
        }],
        maxTokens: 20000,
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

      // HTML is stored in DB — PDF is generated client-side via browser print (no server-side conversion needed)
      // Save final proposal record
      await updateProposal(proposal.id, ctx.user.id, {
        generatedContent,
        summaryContent: input.approvedSummary,
      });

      await incrementProposalUsage(ctx.user.id);
      await notifyOwner({
        title: "New Proposal Generated (from Summary)",
        content: `${ctx.user.name || ctx.user.email} generated a ${tradeName} proposal: "${proposal.title}"`,
      }).catch(() => {});

      return {
        proposalId: proposal.id,
        pdfUrl: null,
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
          systemPrompt: `You are a professional proposal editor. The user has a contractor proposal written as a complete HTML document and wants to make specific changes.

Your job:
1. Understand exactly what the user wants to change
2. Rewrite ONLY the affected section(s) of the HTML
3. Return the COMPLETE updated HTML document (not just the changed section)
4. Maintain the same professional design, CSS styles, and structure
5. Keep all SVG charts, Google Fonts imports, and @media print rules intact
6. Do NOT add placeholder text like [Your Phone Number]
7. Do NOT add signature blocks or Contact Information sections

STRICT OUTPUT RULE: Return ONLY the raw HTML. No markdown, no code fences, no explanation. Start with <!DOCTYPE html> and end with </html>.`,
          messages: [{
            role: "user",
            content: `Here is the current proposal HTML:\n\n${currentContent}\n\n---\n\nRevision request: ${input.message}`,
          }],
          maxTokens: 20000,
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
        // Basic proposal fields for the new proposal record
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

      const systemPrompt = `You are an expert proposal writer for ${tradeName} contractors.
You are given a template proposal and new project information. Write a NEW proposal that:
1. Follows the EXACT same structure and format as the template
2. Incorporates ALL the new project information provided
3. Maintains the professional tone and style of the template
4. Uses the actual business name, client name, and project details — never placeholders
5. Includes visually appealing analytic graphs where relevant (cost breakdown, timeline, payment schedule)
6. Does NOT include signature blocks, contact information sections, or placeholder text

Business: ${businessName}`;

      const { invokeAnthropic } = await import("../utils/anthropicLLM");
      const result = await invokeAnthropic({
        model: "claude-sonnet-4-6-thinking",
        systemPrompt,
        messages: [{
          role: "user",
          content: `TEMPLATE PROPOSAL (follow this structure):\n\n${template.content}\n\n---\n\nNEW PROJECT INFORMATION:\n\n${input.approvedSummary}\n\nWrite the complete new proposal now, following the template's structure.`,
        }],
        maxTokens: 8192,
      });

      let generatedContent = result.content
        .replace(/#{1,6}\s*Contact\s*Information[\s\S]*?(?=#{1,6}\s|$)/gi, "")
        .replace(/#{1,6}\s*(Accepted By|Acceptance|Signature)[\s\S]*?(?=#{1,6}\s|$)/gi, "")
        .replace(/\[Your[^\]]+\]/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (sub.plan === "free" && !isAdmin) {
        generatedContent += "\n\n---\n*This proposal was generated with ProposAI Free. Upgrade to remove this watermark and unlock Word & Google Docs export.*";
      }

      // Parse sections
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
      const sectionMatches = Array.from(generatedContent.matchAll(/## ([^\n]+)\n([\s\S]*?)(?=\n## |$)/g));
      for (const match of sectionMatches) {
        const sectionTitle = match[1].trim();
        if (!sectionTitle) continue;
        sectionContents[sectionTitle] = match[2].trim();
        const id = TITLE_TO_ID[sectionTitle];
        if (id) sectionContents[id] = match[2].trim();
      }
      if (Object.keys(sectionContents).length === 0) sectionContents["content"] = generatedContent;

      const { getTemplateStyle } = await import("../../shared/templateDefs");
      const style = getTemplateStyle("modern-wave");
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
      });
      if (!proposal) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save proposal" });

      const preparedDate = new Date().toLocaleDateString();
      const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();

      const exportInput = {
        style,
        tradeType: input.tradeType,
        title: input.title,
        businessName,
        businessPhone: profile?.phone || "",
        businessEmail: profile?.email || ctx.user.email || "",
        businessAddress: profile?.address || "",
        licenseNumber: profile?.licenseNumber || "",
        clientName: input.clientName || "Valued Client",
        clientAddress: input.clientAddress || "",
        clientEmail: input.clientEmail || "",
        preparedDate,
        validUntil,
        sectionContents,
        fields: {},
      };

      const { renderTemplatePdf } = await import("../utils/templatePdfRenderer");
      const pdfBuffer = await renderTemplatePdf(exportInput);
      const pdfFileName = `proposal-${proposal.id}-${Date.now()}.pdf`;
      const { url: pdfUrl } = await storagePut(pdfFileName, pdfBuffer, "application/pdf");

      let wordUrl: string | null = null;
      let googleDocUrl: string | null = null;
      const canExportAdvanced = isAdmin || sub.plan === "starter" || sub.plan === "pro";
      if (canExportAdvanced) {
        const { htmlToDocx } = await import("../utils/htmlToDocx");
        const { buildHtml } = await import("../utils/templatePdfRenderer");
        const html = await buildHtml(exportInput);
        const docxBuffer = await htmlToDocx(html);
        const wordFileName = `proposal-${proposal.id}-${Date.now()}.docx`;
        const { url: wUrl } = await storagePut(
          wordFileName,
          docxBuffer,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        wordUrl = wUrl;
        googleDocUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(wUrl)}&embedded=false`;
      }

      await updateProposal(proposal.id, ctx.user.id, {
        pdfUrl,
        wordUrl: wordUrl || undefined,
        googleDocUrl: googleDocUrl || undefined,
      });

      await incrementProposalUsage(ctx.user.id);
      await notifyOwner({
        title: "New Proposal Generated (from Template)",
        content: `${ctx.user.name || ctx.user.email} generated a ${tradeName} proposal from template: "${input.title}"`,
      }).catch(() => {});

      return { proposalId: proposal.id, pdfUrl, wordUrl, googleDocUrl };
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
          systemPrompt: `You are a professional proposal editor. The user has a contractor proposal written as a complete HTML document and wants to make specific changes.

Your job:
1. Understand exactly what the user wants to change
2. Rewrite ONLY the affected section(s) of the HTML
3. Return the COMPLETE updated HTML document (not just the changed section)
4. Maintain the same professional design, CSS styles, and structure
5. Keep all SVG charts, Google Fonts imports, and @media print rules intact
6. Do NOT add placeholder text like [Your Phone Number]
7. Do NOT add signature blocks or Contact Information sections

STRICT OUTPUT RULE: Return ONLY the raw HTML. No markdown, no code fences, no explanation. Start with <!DOCTYPE html> and end with </html>.`,
          messages: [{
            role: "user",
            content: `Here is the current proposal HTML:\n\n${currentContent}\n\n---\n\nRevision request: ${input.message}`,
          }],
          maxTokens: 20000,
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
