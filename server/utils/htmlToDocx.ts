/**
 * HTML to DOCX Converter
 *
 * Converts an HTML string to a .docx Buffer using the `docx` npm package.
 * No native dependencies (LibreOffice is not available in the production container).
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

function stripTags(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<\/tr>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, "")
  ).trim();
}

interface DocSection {
  level: number; // 0=body, 1=h1, 2=h2, 3=h3
  heading?: string;
  lines: string[];
}

function parseHtmlToSections(html: string): DocSection[] {
  const sections: DocSection[] = [];
  // Split on heading tags, capturing the tag level and content
  const parts = html.split(/(<h[1-4][^>]*>[\s\S]*?<\/h[1-4]>)/gi);

  let currentSection: DocSection = { level: 0, lines: [] };

  for (const part of parts) {
    const headingMatch = part.match(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/i);
    if (headingMatch) {
      if (currentSection.lines.length > 0 || currentSection.heading) {
        sections.push(currentSection);
      }
      const level = parseInt(headingMatch[1], 10);
      const headingText = stripTags(headingMatch[2]).trim();
      currentSection = { level, heading: headingText, lines: [] };
    } else {
      // Check for table rows to extract text
      const text = stripTags(part);
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      currentSection.lines.push(...lines);
    }
  }

  if (currentSection.lines.length > 0 || currentSection.heading) {
    sections.push(currentSection);
  }

  return sections;
}

function headingLevel(level: number): typeof HeadingLevel[keyof typeof HeadingLevel] {
  switch (level) {
    case 1: return HeadingLevel.HEADING_1;
    case 2: return HeadingLevel.HEADING_2;
    case 3: return HeadingLevel.HEADING_3;
    default: return HeadingLevel.HEADING_4;
  }
}

/**
 * Convert an HTML string to a .docx Buffer using the `docx` npm package.
 * Extracts heading structure and body text; no LibreOffice required.
 */
export async function htmlToDocx(html: string): Promise<Buffer> {
  const sections = parseHtmlToSections(html);
  const children: Paragraph[] = [];

  for (const section of sections) {
    if (section.heading) {
      children.push(
        new Paragraph({
          text: section.heading,
          heading: headingLevel(section.level),
          spacing: { before: 360, after: 120 },
        })
      );
    }

    for (const line of section.lines) {
      if (!line.trim()) continue;
      const isBullet = line.startsWith("• ");
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: isBullet ? line : line,
              size: 22, // 11pt
            }),
          ],
          bullet: isBullet ? { level: 0 } : undefined,
          spacing: { after: 80 },
        })
      );
    }
  }

  if (children.length === 0) {
    children.push(new Paragraph({ text: "" }));
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
