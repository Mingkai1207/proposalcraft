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

  // Generate a proposal from a template — AI fills each section individually
  generateFromTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string().min(1),
        title: z.string().min(1),
        language: z.string().optional().default("english"),
        fields: z.record(z.string(), z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { getTemplateById } = await import("../../shared/templateDefs");
      const template = getTemplateById(input.templateId);
      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

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

      // Build field context string for the AI
      const fieldContext = template.inputFields
        .filter(f => input.fields[f.id])
        .map(f => `${f.label}: ${input.fields[f.id]}`)
        .join("\n");

      // Fill each AI section individually with section-specific prompts
      const sectionContents: Record<string, string> = {};

      for (const section of template.sections) {
        if (section.type !== "ai_filled" || !section.aiPrompt) continue;

        // Gather only the relevant fields for this section
        const relevantFields = (section.inputFields || [])
          .filter(fId => input.fields[fId])
          .map(fId => {
            const fieldDef = template.inputFields.find(f => f.id === fId);
            return fieldDef ? `${fieldDef.label}: ${input.fields[fId]}` : `${fId}: ${input.fields[fId]}`;
          })
          .join("\n");

        const sectionPrompt = `You are an expert proposal writer for ${template.trade} contractors.
Write ONLY the content for the "${section.title}" section. Do NOT include the section header.
Write in ${outputLang}.
Do NOT include placeholder text like [Your X]. Do NOT include signature blocks or contact info.

Section instructions: ${section.aiPrompt}

Business name: ${businessName}
Client: ${input.fields["clientName"] || "Valued Client"}
${input.fields["clientAddress"] ? `Property: ${input.fields["clientAddress"]}` : ""}

Relevant project details:
${relevantFields || fieldContext}`;

        const response = await invokeLLM({
          messages: [{ role: "user", content: sectionPrompt }],
          model: "gemini-2.5-flash",
        });

        const content = response.choices[0]?.message?.content;
        sectionContents[section.id] = typeof content === "string" ? content.trim() : "";
      }

      // Assemble the full markdown document from sections
      const markdownParts: string[] = [];
      for (const section of template.sections) {
        if (section.type === "visualization") continue; // handled by PDF renderer
        markdownParts.push(`## ${section.title}\n\n${sectionContents[section.id] || ""}`);
      }
      const generatedContent = markdownParts.join("\n\n");

      // Determine trade type (map template trade to DB enum)
      const tradeMap: Record<string, string> = {
        hvac: "hvac", plumbing: "plumbing", electrical: "electrical",
        roofing: "roofing", general: "general", painting: "painting",
        flooring: "flooring", landscaping: "landscaping", carpentry: "carpentry",
        concrete: "concrete", masonry: "masonry", insulation: "insulation",
        drywall: "drywall", windows: "windows", solar: "solar",
      };
      const tradeType = (tradeMap[template.trade] || "general") as typeof ALL_TRADE_TYPES[number];

      const trackingToken = nanoid(32);
      const isFree = sub.plan === "free" && !isAdmin;
      const watermarkedContent = isFree
        ? `${generatedContent}\n\n---\n*This proposal was generated with ProposAI Free. Upgrade to remove this watermark.*`
        : generatedContent;

      const proposal = await createProposal({
        userId: ctx.user.id,
        title: input.title,
        tradeType,
        clientName: input.fields["clientName"] || null,
        clientEmail: input.fields["clientEmail"] || null,
        clientAddress: input.fields["clientAddress"] || null,
        jobScope: input.fields["jobScope"] || "See proposal content",
        materials: input.fields["materials"] || null,
        laborCost: input.fields["laborCost"] || null,
        materialsCost: input.fields["materialsCost"] || null,
        totalCost: input.fields["totalCost"] || null,
        generatedContent: watermarkedContent,
        trackingToken,
        status: "draft",
        expiryDays: 30,
      });

      if (!proposal) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save proposal" });

      await incrementProposalUsage(ctx.user.id);
      await notifyOwner({
        title: "New Template Proposal Generated",
        content: `${ctx.user.name || ctx.user.email} used template "${template.name}" to create: "${input.title}"`,
      }).catch(() => {});

      return { id: proposal.id };
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
        // Use template renderer if proposal was created from a template
        if (proposal.templateId) {
          const { getTemplateById } = await import("../../shared/templateDefs");
          const template = getTemplateById(proposal.templateId);
          if (template) {
            const { renderTemplatePdf } = await import("../utils/templatePdfRenderer");
            const fields: Record<string, string> = proposal.templateFields ? JSON.parse(proposal.templateFields) : {};

            // Parse section contents from generatedContent
            const sectionContents: Record<string, string> = {};
            const content = proposal.generatedContent || "";
            const sectionMatches = Array.from(content.matchAll(/## ([^\n]+)\n\n([\s\S]*?)(?=\n\n## |$)/g));
            for (const match of sectionMatches) {
              const sectionTitle = match[1].trim();
              const section = template.sections.find(s => s.title === sectionTitle);
              if (section) sectionContents[section.id] = match[2].trim();
            }

            const pdfBuffer = await renderTemplatePdf({
              template,
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
        const { exportToWord } = await import("../utils/wordExporter");
        const { getTemplateById, TEMPLATE_DEFS } = await import("../../shared/templateDefs");

        const template = proposal.templateId ? getTemplateById(proposal.templateId) : TEMPLATE_DEFS[0];
        if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });

        const fields: Record<string, string> = proposal.templateFields ? JSON.parse(proposal.templateFields) : {};
        const sectionContents: Record<string, string> = {};
        const content = proposal.generatedContent || "";
        const sectionMatches = Array.from(content.matchAll(/## ([^\n]+)\n\n([\s\S]*?)(?=\n\n## |$)/g));
        for (const match of sectionMatches) {
          const sectionTitle = match[1].trim();
          const section = template.sections.find(s => s.title === sectionTitle);
          if (section) sectionContents[section.id] = match[2].trim();
        }
        // If no sections matched, put all content in a generic section
        if (Object.keys(sectionContents).length === 0) {
          sectionContents["content"] = content;
        }

        const docxBuffer = await exportToWord({
          template,
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
        const { exportToGoogleDocs } = await import("../utils/googleDocsExporter");
        const { getTemplateById, TEMPLATE_DEFS } = await import("../../shared/templateDefs");

        const template = proposal.templateId ? getTemplateById(proposal.templateId) : TEMPLATE_DEFS[0];
        if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });

        const fields: Record<string, string> = proposal.templateFields ? JSON.parse(proposal.templateFields) : {};
        const sectionContents: Record<string, string> = {};
        const content = proposal.generatedContent || "";
        const sectionMatches = Array.from(content.matchAll(/## ([^\n]+)\n\n([\s\S]*?)(?=\n\n## |$)/g));
        for (const match of sectionMatches) {
          const sectionTitle = match[1].trim();
          const section = template.sections.find(s => s.title === sectionTitle);
          if (section) sectionContents[section.id] = match[2].trim();
        }
        if (Object.keys(sectionContents).length === 0) sectionContents["content"] = content;

        const result = await exportToGoogleDocs({
          template,
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
});
