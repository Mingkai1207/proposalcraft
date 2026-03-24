/**
 * End-to-end PDF generation test using the actual templatePdfRenderer
 * Generates a PDF for proposal 180001 and saves it to /tmp/test_output.pdf
 */
import { createPool } from 'mysql2/promise';
import { writeFileSync } from 'fs';

const conn = createPool(process.env.DATABASE_URL);

const [rows] = await conn.query(
  'SELECT p.*, u.email as userEmail, u.name as userName FROM proposals p JOIN users u ON p.userId = u.id WHERE p.id = 180001'
);
const proposal = rows[0];

console.log('Proposal:', proposal.title, '| templateId:', proposal.templateId);

// Simulate the exact same code path as exportPdf
const { getTemplateStyle } = await import('./shared/templateDefs.js');
const { renderTemplatePdf } = await import('./server/utils/templatePdfRenderer.js');

const style = getTemplateStyle(proposal.templateId);
const fields = proposal.templateFields ? JSON.parse(proposal.templateFields) : {};

const TITLE_TO_ID = {
  "Executive Summary": "executive_summary",
  "Scope of Work": "scope_of_work",
  "Materials & Equipment": "materials_equipment",
  "Project Timeline": "timeline",
  "Investment Summary": "investment",
  "Terms & Conditions": "terms",
};

const sectionContents = {};
const content = proposal.generatedContent || "";
const sectionMatches = Array.from(content.matchAll(/## ([^\n]+)\n([\s\S]*?)(?=\n## |$)/g));
for (const match of sectionMatches) {
  const sectionTitle = match[1].trim();
  if (!sectionTitle) continue;
  sectionContents[sectionTitle] = match[2].trim();
  const id = TITLE_TO_ID[sectionTitle];
  if (id) sectionContents[id] = match[2].trim();
}

console.log('Sections found:', Object.keys(sectionContents).filter(k => !k.includes(' ')));

const pdfBuffer = await renderTemplatePdf({
  style,
  title: proposal.title,
  tradeType: proposal.tradeType || "General Contracting",
  businessName: proposal.userName || "Test Business",
  businessPhone: "",
  businessEmail: proposal.userEmail || "",
  businessAddress: "",
  licenseNumber: "",
  clientName: proposal.clientName || "Valued Client",
  clientAddress: proposal.clientAddress || "",
  clientEmail: proposal.clientEmail || "",
  preparedDate: new Date(proposal.createdAt).toLocaleDateString(),
  validUntil: new Date(new Date(proposal.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  sectionContents,
  fields,
});

writeFileSync('/tmp/test_output.pdf', pdfBuffer);
console.log(`\n✅ PDF generated successfully! Size: ${pdfBuffer.length} bytes`);
console.log('Saved to: /tmp/test_output.pdf');
process.exit(0);
