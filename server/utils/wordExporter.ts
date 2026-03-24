/**
 * Word (.docx) Exporter
 *
 * Generates a professionally formatted Word document from a template proposal.
 * Uses the `docx` npm package to produce .docx files compatible with Microsoft Word
 * and Google Docs.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  PageBreak,
  Header,
  Footer,
} from "docx";
import type { TemplateStyle } from "../../shared/templateDefs";
import { PROPOSAL_SECTIONS } from "../../shared/templateDefs";

export interface WordExportInput {
  style: TemplateStyle;
  tradeType: string;
  title: string;
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  licenseNumber: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  preparedDate: string;
  validUntil: string;
  sectionContents: Record<string, string>;
  fields: Record<string, string>;
}

/**
 * Parse markdown text into docx Paragraph elements (simplified)
 */
function markdownToParagraphs(md: string, accentColor: string): Paragraph[] {
  if (!md) return [];

  // Strip placeholder text
  const cleaned = md
    .replace(/\[Your[^\]]+\]/g, "")
    .replace(/^(Signature|Printed Name|Title|Date):\s*_{3,}\s*$/gm, "")
    .replace(/#{1,6}\s*(Accepted By|Acceptance|Signature|Contact Information)[\s\S]*?(?=#{1,6}\s|$)/gi, "")
    .trim();

  const lines = cleaned.split("\n");
  const paragraphs: Paragraph[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      paragraphs.push(new Paragraph({ spacing: { after: 80 } }));
      continue;
    }

    // Headings
    const h3Match = trimmed.match(/^###\s+(.+)/);
    const h2Match = trimmed.match(/^##\s+(.+)/);
    const h1Match = trimmed.match(/^#\s+(.+)/);

    if (h1Match || h2Match || h3Match) {
      const text = (h1Match || h2Match || h3Match)![1];
      const level = h1Match ? HeadingLevel.HEADING_2 : h2Match ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4;
      paragraphs.push(new Paragraph({
        text,
        heading: level,
        spacing: { before: 240, after: 80 },
      }));
      continue;
    }

    // Bullet points
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      paragraphs.push(new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: bulletMatch[1], size: 24 })],
        spacing: { after: 60 },
      }));
      continue;
    }

    // Numbered list
    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)/);
    if (numberedMatch) {
      paragraphs.push(new Paragraph({
        numbering: { reference: "default-numbering", level: 0 },
        children: [new TextRun({ text: numberedMatch[1], size: 24 })],
        spacing: { after: 60 },
      }));
      continue;
    }

    // Bold text (simple inline bold)
    const children: TextRun[] = [];
    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
    for (const part of parts) {
      const boldMatch = part.match(/^\*\*(.+)\*\*$/);
      if (boldMatch) {
        children.push(new TextRun({ text: boldMatch[1], bold: true, size: 24 }));
      } else if (part) {
        children.push(new TextRun({ text: part, size: 24 }));
      }
    }

    paragraphs.push(new Paragraph({
      children,
      spacing: { after: 120 },
    }));
  }

  return paragraphs;
}

/**
 * Create a styled section header paragraph
 */
function sectionHeader(title: string, accentColor: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 32,
        color: accentColor.replace("#", ""),
      }),
    ],
    spacing: { before: 360, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: accentColor.replace("#", "") },
    },
  });
}

/**
 * Create the cover page paragraphs
 */
function buildCoverPage(input: WordExportInput): Paragraph[] {
  const accent = input.style.accentColor.replace("#", "");
  const paragraphs: Paragraph[] = [];

  // Business name
  paragraphs.push(new Paragraph({
    children: [new TextRun({ text: input.businessName, bold: true, size: 48, color: accent })],
    spacing: { before: 720, after: 120 },
  }));

  // Divider
  paragraphs.push(new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: accent } },
    spacing: { after: 360 },
  }));

  // Proposal title
  paragraphs.push(new Paragraph({
    children: [new TextRun({ text: input.title, bold: true, size: 56 })],
    spacing: { after: 240 },
  }));

  // Prepared for
  paragraphs.push(new Paragraph({
    children: [new TextRun({ text: "Prepared for: ", bold: true, size: 28 }), new TextRun({ text: input.clientName, size: 28 })],
    spacing: { after: 80 },
  }));

  if (input.clientAddress) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: input.clientAddress, size: 24, color: "6b7280" })],
      spacing: { after: 80 },
    }));
  }

  if (input.clientEmail) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: input.clientEmail, size: 24, color: "6b7280" })],
      spacing: { after: 240 },
    }));
  }

  // Dates
  paragraphs.push(new Paragraph({
    children: [new TextRun({ text: `Date: ${input.preparedDate}  ·  Valid Until: ${input.validUntil}`, size: 24, color: "6b7280" })],
    spacing: { after: 240 },
  }));

  // Investment summary if costs provided
  const totalCost = parseFloat(input.fields.total_cost || input.fields.totalCost || "0") || 0;
  const laborCost = parseFloat(input.fields.labor_cost || input.fields.laborCost || "0") || 0;
  const materialsCost = parseFloat(input.fields.materials_cost || input.fields.materialsCost || "0") || 0;

  if (totalCost > 0) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: "Investment Summary", bold: true, size: 28, color: accent })],
      spacing: { before: 240, after: 120 },
    }));

    const rows: TableRow[] = [];
    if (laborCost > 0) {
      rows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Labor", size: 24 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${laborCost.toLocaleString()}`, size: 24 })] })] }),
        ],
      }));
    }
    if (materialsCost > 0) {
      rows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Materials & Equipment", size: 24 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${materialsCost.toLocaleString()}`, size: 24 })] })] }),
        ],
      }));
    }
    rows.push(new TableRow({
      children: [
        new TableCell({
          shading: { type: ShadingType.SOLID, color: accent, fill: accent },
          children: [new Paragraph({ children: [new TextRun({ text: "Total Investment", bold: true, size: 24, color: "FFFFFF" })] })],
        }),
        new TableCell({
          shading: { type: ShadingType.SOLID, color: accent, fill: accent },
          children: [new Paragraph({ children: [new TextRun({ text: `$${totalCost.toLocaleString()}`, bold: true, size: 24, color: "FFFFFF" })] })],
        }),
      ],
    }));

    paragraphs.push(new Table({
      width: { size: 50, type: WidthType.PERCENTAGE },
      rows,
    }) as unknown as Paragraph);
  }

  // Page break
  paragraphs.push(new Paragraph({ children: [new PageBreak()] }));

  return paragraphs;
}

/**
 * Build the signature page
 */
function buildSignaturePage(input: WordExportInput): Paragraph[] {
  const accent = input.style.accentColor.replace("#", "");
  const paragraphs: Paragraph[] = [];

  paragraphs.push(new Paragraph({ children: [new PageBreak()] }));

  paragraphs.push(new Paragraph({
    children: [new TextRun({ text: "Proposal Acceptance", bold: true, size: 40, color: accent })],
    spacing: { after: 120 },
  }));

  paragraphs.push(new Paragraph({
    children: [new TextRun({ text: "By signing below, both parties agree to the terms outlined in this proposal.", size: 22, color: "6b7280" })],
    spacing: { after: 360 },
  }));

  // Investment table
  const totalCost = parseFloat(input.fields.total_cost || input.fields.totalCost || "0") || 0;
  const laborCost = parseFloat(input.fields.labor_cost || input.fields.laborCost || "0") || 0;
  const materialsCost = parseFloat(input.fields.materials_cost || input.fields.materialsCost || "0") || 0;

  if (totalCost > 0) {
    const rows: TableRow[] = [];
    if (laborCost > 0) {
      rows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Labor", size: 24 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${laborCost.toLocaleString()}`, size: 24 })] })] }),
        ],
      }));
    }
    if (materialsCost > 0) {
      rows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Materials & Equipment", size: 24 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${materialsCost.toLocaleString()}`, size: 24 })] })] }),
        ],
      }));
    }
    rows.push(new TableRow({
      children: [
        new TableCell({
          shading: { type: ShadingType.SOLID, color: accent, fill: accent },
          children: [new Paragraph({ children: [new TextRun({ text: "Total Investment", bold: true, size: 24, color: "FFFFFF" })] })],
        }),
        new TableCell({
          shading: { type: ShadingType.SOLID, color: accent, fill: accent },
          children: [new Paragraph({ children: [new TextRun({ text: `$${totalCost.toLocaleString()}`, bold: true, size: 24, color: "FFFFFF" })] })],
        }),
      ],
    }));

    paragraphs.push(new Table({ width: { size: 60, type: WidthType.PERCENTAGE }, rows }) as unknown as Paragraph);
    paragraphs.push(new Paragraph({ spacing: { after: 360 } }));
  }

  // Signature lines
  const sigLine = () => new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "9ca3af" } },
    spacing: { after: 60 },
    children: [new TextRun({ text: " ", size: 48 })],
  });

  const sigLabel = (text: string) => new Paragraph({
    children: [new TextRun({ text, size: 18, color: "9ca3af" })],
    spacing: { after: 240 },
  });

  paragraphs.push(new Paragraph({
    children: [new TextRun({ text: `Client: ${input.clientName}`, bold: true, size: 26 })],
    spacing: { after: 120 },
  }));
  paragraphs.push(sigLine());
  paragraphs.push(sigLabel("Signature"));
  paragraphs.push(sigLine());
  paragraphs.push(sigLabel("Printed Name"));
  paragraphs.push(sigLine());
  paragraphs.push(sigLabel("Date"));

  paragraphs.push(new Paragraph({
    children: [new TextRun({ text: `Contractor: ${input.businessName}`, bold: true, size: 26 })],
    spacing: { before: 360, after: 120 },
  }));
  paragraphs.push(sigLine());
  paragraphs.push(sigLabel("Signature"));
  paragraphs.push(new Paragraph({
    children: [new TextRun({ text: input.businessName, size: 24 })],
    spacing: { after: 60 },
  }));
  paragraphs.push(sigLabel("Printed Name"));
  paragraphs.push(sigLine());
  paragraphs.push(sigLabel("Date"));

  return paragraphs;
}

/**
 * Main export function — returns a Buffer containing the .docx file
 */
export async function exportToWord(input: WordExportInput): Promise<Buffer> {
  const accent = input.style.accentColor.replace("#", "");
  const allParagraphs: (Paragraph | Table)[] = [];

  // Cover page
  allParagraphs.push(...buildCoverPage(input));

  // Content sections — try to match by PROPOSAL_SECTIONS order first
  // then fall back to rendering all sectionContents
  const orderedSections = PROPOSAL_SECTIONS.filter(
    (s) => (input.sectionContents[s.id] || "").trim().length > 0
  );

  if (orderedSections.length > 0) {
    // Render each section in standard order
    for (const section of orderedSections) {
      const content = input.sectionContents[section.id] || "";
      if (!content.trim()) continue;
      allParagraphs.push(sectionHeader(section.title, input.style.accentColor));
      allParagraphs.push(...markdownToParagraphs(content, input.style.accentColor));
    }
  } else {
    // Fallback: render the full raw content as one body (handles AI-generated proposals
    // that don't use template section headings)
    const rawContent = input.sectionContents["content"] || Object.values(input.sectionContents).join("\n\n");
    if (rawContent.trim()) {
      allParagraphs.push(sectionHeader("Proposal Details", input.style.accentColor));
      allParagraphs.push(...markdownToParagraphs(rawContent, input.style.accentColor));
    }
  }

  // Signature page
  allParagraphs.push(...buildSignaturePage(input));

  const doc = new Document({
    numbering: {
      config: [{
        reference: "default-numbering",
        levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.LEFT }],
      }],
    },
    sections: [{
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: input.businessName, bold: true, size: 20, color: accent }),
                new TextRun({ text: `  ·  ${input.title}`, size: 20, color: "6b7280" }),
              ],
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" } },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: `${input.preparedDate}  ·  Generated with ProposAI`, size: 18, color: "9ca3af" }),
              ],
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: "e5e7eb" } },
            }),
          ],
        }),
      },
      properties: {
        page: {
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      children: allParagraphs as Paragraph[],
    }],
  });

  return Packer.toBuffer(doc);
}
