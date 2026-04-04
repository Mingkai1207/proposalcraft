import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

const VALID_TRADE_TYPES = ["hvac", "plumbing", "electrical", "roofing", "general", "painting", "flooring", "landscaping", "carpentry", "concrete", "masonry", "insulation", "drywall", "windows", "solar"] as const;
type TradeType = typeof VALID_TRADE_TYPES[number];
function sanitizeTradeType(value: unknown): TradeType {
  if (typeof value === "string" && (VALID_TRADE_TYPES as readonly string[]).includes(value)) {
    return value as TradeType;
  }
  return "general";
}
import { proposals, proposalTemplates, contractorProfiles } from "../../drizzle/schema";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { eq } from "drizzle-orm";
import { parseFileContent, decodeBase64File } from "../utils/fileParser";

export const importRouter = router({
  importProposals: protectedProcedure
    .input(
      z.object({
        files: z.array(
          z.object({
            name: z.string().max(255),
            type: z.string().max(100),
            content: z.string().max(14_000_000), // ~10MB base64 encoded (10MB * 4/3 ≈ 13.3MB)
          })
        ).max(10), // at most 10 files per import
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      let templatesCreated = 0;
      const extractedData: any = {};
      const allExtractedInfo: any = {};

      // Process each file
      for (const file of input.files) {
        try {
          // Decode base64 content to buffer
          const fileBuffer = decodeBase64File(file.content);

          // Parse file content based on type (PDF, DOCX, or text)
          const text = await parseFileContent(fileBuffer, file.type, file.name);

          // Skip if text is empty
          if (!text || text.trim().length === 0) {
            console.warn(`File ${file.name} produced no extractable text`);
            continue;
          }

          // Use LLM to extract structured data from proposal
          const extractionPrompt = `Extract key information from this proposal document. Return a JSON object with:
- clientName: string (full name of client/company)
- clientEmail: string (email if present)
- clientAddress: string (full address if present)
- tradeType: string (hvac, plumbing, electrical, roofing, or general)
- jobScope: string (description of work to be done)
- materials: string (materials/equipment needed)
- laborCost: number (labor cost if present)
- materialsCost: number (materials cost if present)
- totalCost: number (total project cost)
- timeline: string (project timeline/duration)
- proposalTitle: string (title or description of proposal)
- businessName: string (contractor/business name if present)
- businessPhone: string (contractor phone number if present)
- businessAddress: string (contractor address if present)

Proposal text:
${text.substring(0, 5000)}

Return ONLY valid JSON, no markdown or extra text.`;

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are an expert at extracting structured data from proposal documents. Always return valid JSON.",
              },
              {
                role: "user",
                content: extractionPrompt,
              },
            ],
          });

          const content = response.choices[0].message.content;
          const contentStr = typeof content === "string" ? content : "{}";
          
          // Extract JSON from markdown code blocks if present
          let jsonStr = contentStr;
          const jsonMatch = contentStr.match(/```json\s*([\s\S]*?)```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
          }
          
          const extracted = JSON.parse(jsonStr);

          // Aggregate business info from all proposals
          if (extracted.businessName) allExtractedInfo.businessName = extracted.businessName;
          if (extracted.businessPhone) allExtractedInfo.businessPhone = extracted.businessPhone;
          if (extracted.businessAddress) allExtractedInfo.businessAddress = extracted.businessAddress;

          // Create template from extracted data
          if (extracted.proposalTitle) {
            const templateId = await db
              .insert(proposalTemplates)
              .values({
                userId: ctx.user.id,
                name: extracted.proposalTitle,
                tradeType: sanitizeTradeType(extracted.tradeType),
                description: `Imported from ${file.name}`,
                content: text.substring(0, 2000), // Store first 2000 chars as content
                clientName: extracted.clientName,
                clientAddress: extracted.clientAddress,
                jobScope: extracted.jobScope,
                materials: extracted.materials,
                laborCost: extracted.laborCost,
                materialsCost: extracted.materialsCost,
                totalCost: extracted.totalCost,
                language: "english",
              })
              .$returningId();

            if (templateId && templateId[0]) {
              templatesCreated++;
            }
          }

          // Store extracted data for profile update
          extractedData[file.name] = extracted;
        } catch (err) {
          console.error(`Failed to process file ${file.name}:`, err);
          // Continue with next file
        }
      }

      // Auto-populate contractor profile if data was extracted
      if (Object.keys(allExtractedInfo).length > 0) {
        try {
          // Check if profile exists
          const existingProfile = await db
            .select()
            .from(contractorProfiles)
            .where(eq(contractorProfiles.userId, ctx.user.id))
            .limit(1);

          if (existingProfile.length === 0) {
            // Create new profile with extracted data
            await db.insert(contractorProfiles).values({
              userId: ctx.user.id,
              businessName: allExtractedInfo.businessName,
              phone: allExtractedInfo.businessPhone,
              address: allExtractedInfo.businessAddress,
            });
          } else {
            // Update existing profile with extracted data
            await db
              .update(contractorProfiles)
              .set({
                businessName: allExtractedInfo.businessName || existingProfile[0].businessName,
                phone: allExtractedInfo.businessPhone || existingProfile[0].phone,
                address: allExtractedInfo.businessAddress || existingProfile[0].address,
              })
              .where(eq(contractorProfiles.userId, ctx.user.id));
          }
        } catch (err) {
          console.error("Failed to auto-populate profile:", err);
          // Continue - profile population is optional
        }
      }

      return {
        success: true,
        templatesCreated,
        extractedData,
        profileUpdated: Object.keys(allExtractedInfo).length > 0,
      };
    }),
});
