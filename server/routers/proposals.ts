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

const TRADE_TEMPLATES: Record<string, string> = {
  hvac: "HVAC (Heating, Ventilation & Air Conditioning)",
  plumbing: "Plumbing",
  electrical: "Electrical",
  roofing: "Roofing",
  general: "General Contracting",
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
        tradeType: z.enum(["hvac", "plumbing", "electrical", "roofing", "general"]),
        clientName: z.string().optional(),
        clientEmail: z.string().email().optional().or(z.literal("")),
        clientAddress: z.string().optional(),
        jobScope: z.string().min(10),
        materials: z.string().optional(),
        laborCost: z.string().optional(),
        materialsCost: z.string().optional(),
        totalCost: z.string().optional(),
        language: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check subscription limits
      const sub = await ensureSubscription(ctx.user.id);
      if (!sub) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Subscription error" });

      const limit = getPlanLimit(sub.plan);
      if (sub.proposalsUsedThisMonth >= limit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You've reached your ${sub.plan} plan limit of ${limit} proposals/month. Please upgrade to continue.`,
        });
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

      const systemPrompt = `You are an expert proposal writer for ${tradeName} contractors. 
Write professional, persuasive job proposals that win contracts. 
IMPORTANT: Write the entire proposal in ${outputLang}. All section headers, body text, and pricing must be in ${outputLang}.
Use clear, confident language. Structure proposals with these sections:
1. Executive Summary (2-3 sentences)
2. Scope of Work (detailed breakdown)
3. Materials & Equipment (if applicable)
4. Project Timeline
5. Investment Summary (pricing breakdown)
6. Why Choose Us (brief value proposition)
7. Terms & Acceptance

Keep the tone professional but approachable. Be specific about the work described.`;

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

      const model = profile?.preferredModel || "gemini-2.5-flash";
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model,
      });

      const rawContent = response.choices[0]?.message?.content;
const generatedContent = typeof rawContent === "string" ? rawContent : "";

      // Create tracking token
      const trackingToken = nanoid(32);

      // Save proposal to DB
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
        generatedContent,
        trackingToken,
        status: "draft",
      });

      // Increment usage
      await incrementProposalUsage(ctx.user.id);

      // Notify owner of new proposal generation
      await notifyOwner({
        title: "New Proposal Generated",
        content: `${ctx.user.name || ctx.user.email} generated a ${tradeName} proposal: "${input.title}"`,
      }).catch(() => {});

      return proposal;
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
});
