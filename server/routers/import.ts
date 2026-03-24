import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { proposals, proposalTemplates } from "../../drizzle/schema";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";

export const importRouter = router({
  importProposals: protectedProcedure
    .input(
      z.object({
        files: z.array(
          z.object({
            name: z.string(),
            type: z.string(),
            content: z.string(), // base64 encoded
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      let templatesCreated = 0;
      const extractedData: any = {};

      // Process each file
      for (const file of input.files) {
        try {
          // Decode base64 content
          const binaryString = atob(file.content.split(",")[1]);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // For now, treat as text (in production, use pdf-parse for PDFs, mammoth for docx)
          let text = new TextDecoder().decode(bytes);

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
          const extracted = JSON.parse(contentStr);

          // Create template from extracted data
          if (extracted.proposalTitle) {
            const templateId = await db
              .insert(proposalTemplates)
              .values({
                userId: ctx.user.id,
                name: extracted.proposalTitle,
                tradeType: extracted.tradeType || "general",
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

      return {
        success: true,
        templatesCreated,
        extractedData,
      };
    }),
});
