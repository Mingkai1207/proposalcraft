/**
 * Template-Aware PDF Renderer
 *
 * Renders a proposal using its template definition:
 * - Professional cover page with template accent color
 * - Each section rendered with proper typography
 * - Data visualizations (charts) embedded as images
 * - Signature page at the end
 */

import { marked } from "marked";
import type { ProposalTemplateDef } from "../../shared/templateDefs";
import { generateVisualization, type VisualizationData } from "./visualizationGenerator";

export interface TemplatePdfInput {
  template: ProposalTemplateDef;
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
  /** Section content keyed by section id — AI-filled text (markdown) */
  sectionContents: Record<string, string>;
  /** Raw field values for visualization data */
  fields: Record<string, string>;
}

/**
 * Convert markdown to clean HTML for embedding in PDF
 */
function mdToHtml(md: string): string {
  if (!md) return "";
  // Strip any remaining placeholder text
  const cleaned = md
    .replace(/\[Your[^\]]+\]/g, "")
    .replace(/^(Signature|Printed Name|Title|Date):\s*_{3,}\s*$/gm, "")
    .replace(/#{1,6}\s*(Accepted By|Acceptance|Signature|Contact Information)[\s\S]*?(?=#{1,6}\s|$)/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return marked.parse(cleaned) as string;
}

/**
 * Build the full HTML document for the PDF
 */
async function buildHtml(input: TemplatePdfInput): Promise<string> {
  const { template, fields } = input;
  const accent = template.accentColor;
  const secondary = template.secondaryColor;

  // Build visualization data from fields
  const vizData: VisualizationData = {
    laborCost: parseFloat(fields.laborCost || "0") || 0,
    materialsCost: parseFloat(fields.materialsCost || "0") || 0,
    totalCost: parseFloat(fields.totalCost || "0") || 0,
    timeline: fields.timeline || "",
    jobScope: fields.jobScope || "",
    currentBill: parseFloat(fields.currentBill || "0") || 0,
    annualProduction: parseFloat(fields.annualProduction || "0") || 0,
    utilityRate: parseFloat(fields.utilityRate || "0") || 0,
    systemSize: parseFloat(fields.systemSize || "0") || 0,
    incentives: fields.incentives || "",
    roofType: fields.roofType || "",
  };

  // Pre-generate all visualizations
  const vizHtmlMap: Record<string, string> = {};
  for (const section of template.sections) {
    if (section.type !== "visualization" || !section.visualizationId) continue;
    const vizDef = template.visualizations.find(v => v.id === section.visualizationId);
    if (!vizDef) continue;
    const result = await generateVisualization(vizDef, vizData);
    if (result.type === "image") {
      vizHtmlMap[section.id] = `<img src="${result.base64}" style="max-width:100%;height:auto;border-radius:8px;" alt="${vizDef.title}" />`;
    } else {
      vizHtmlMap[section.id] = result.html;
    }
  }

  // Build sections HTML
  const sectionsHtml = template.sections.map(section => {
    if (section.type === "visualization") {
      const vizContent = vizHtmlMap[section.id] || "";
      if (!vizContent) return "";
      return `
        <div class="section">
          <h2 class="section-title">${section.title}</h2>
          <div class="viz-container">${vizContent}</div>
        </div>`;
    }

    const content = input.sectionContents[section.id] || "";
    if (!content.trim()) return "";
    return `
      <div class="section">
        <h2 class="section-title">${section.title}</h2>
        <div class="section-content">${mdToHtml(content)}</div>
      </div>`;
  }).filter(Boolean).join("\n");

  // Cost summary for signature page
  const laborCost = vizData.laborCost || 0;
  const materialsCost = vizData.materialsCost || 0;
  const totalCost = vizData.totalCost || laborCost + materialsCost;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${input.title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', Arial, sans-serif;
    color: #1f2937;
    background: white;
    font-size: 14px;
    line-height: 1.6;
  }

  /* ── Cover Page ── */
  .cover-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    page-break-after: always;
  }

  .cover-header {
    background: linear-gradient(135deg, ${accent} 0%, ${accent}dd 60%, ${accent}99 100%);
    padding: 48px 56px 40px;
    color: white;
    flex: 0 0 auto;
  }

  .cover-logo-area {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 40px;
  }

  .cover-business-name {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.3px;
  }

  .cover-badge {
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 20px;
    padding: 4px 14px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .cover-title {
    font-size: 36px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.5px;
    margin-bottom: 8px;
  }

  .cover-subtitle {
    font-size: 16px;
    opacity: 0.85;
    font-weight: 400;
  }

  .cover-body {
    flex: 1;
    padding: 40px 56px;
    background: ${secondary};
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    align-content: start;
  }

  .cover-info-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }

  .cover-info-card h3 {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #9ca3af;
    margin-bottom: 12px;
  }

  .cover-info-card p {
    font-size: 14px;
    color: #374151;
    line-height: 1.5;
    font-weight: 500;
  }

  .cover-info-card .sub {
    font-size: 12px;
    color: #6b7280;
    font-weight: 400;
    margin-top: 2px;
  }

  .cover-highlights {
    grid-column: 1 / -1;
    background: white;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }

  .cover-highlights h3 {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #9ca3af;
    margin-bottom: 16px;
  }

  .highlight-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .highlight-item {
    text-align: center;
    padding: 16px;
    background: ${secondary};
    border-radius: 8px;
  }

  .highlight-value {
    font-size: 24px;
    font-weight: 700;
    color: ${accent};
    line-height: 1;
    margin-bottom: 4px;
  }

  .highlight-label {
    font-size: 11px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* ── Content Pages ── */
  .content-pages {
    padding: 0;
  }

  .page-header {
    background: ${accent};
    padding: 16px 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .page-header-title {
    color: white;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  .page-header-sub {
    color: rgba(255,255,255,0.7);
    font-size: 12px;
  }

  .content-body {
    padding: 40px 56px;
    max-width: 100%;
  }

  .section {
    margin-bottom: 40px;
    page-break-inside: avoid;
  }

  .section-title {
    font-size: 18px;
    font-weight: 700;
    color: ${accent};
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid ${secondary};
    letter-spacing: -0.2px;
  }

  .section-content h1, .section-content h2, .section-content h3 {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
    margin: 16px 0 8px;
  }

  .section-content p {
    color: #374151;
    margin-bottom: 10px;
    line-height: 1.7;
  }

  .section-content ul, .section-content ol {
    padding-left: 20px;
    margin-bottom: 12px;
  }

  .section-content li {
    color: #374151;
    margin-bottom: 6px;
    line-height: 1.6;
  }

  .section-content li::marker {
    color: ${accent};
  }

  .section-content strong {
    color: #111827;
    font-weight: 600;
  }

  .section-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 13px;
  }

  .section-content th {
    background: ${secondary};
    color: #374151;
    padding: 8px 12px;
    text-align: left;
    font-weight: 600;
    border: 1px solid #e5e7eb;
  }

  .section-content td {
    padding: 8px 12px;
    border: 1px solid #e5e7eb;
    color: #374151;
  }

  .section-content tr:nth-child(even) td {
    background: #f9fafb;
  }

  .section-content blockquote {
    border-left: 3px solid ${accent};
    padding: 8px 16px;
    margin: 12px 0;
    background: ${secondary};
    border-radius: 0 6px 6px 0;
    color: #374151;
    font-style: italic;
  }

  .viz-container {
    background: #f9fafb;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid #e5e7eb;
    text-align: center;
  }

  /* ── Signature Page ── */
  .signature-page {
    page-break-before: always;
    padding: 40px 56px;
  }

  .signature-title {
    font-size: 22px;
    font-weight: 700;
    color: ${accent};
    margin-bottom: 8px;
  }

  .signature-subtitle {
    color: #6b7280;
    font-size: 13px;
    margin-bottom: 32px;
  }

  .investment-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 32px;
    font-size: 14px;
  }

  .investment-table th {
    background: ${accent};
    color: white;
    padding: 10px 16px;
    text-align: left;
    font-weight: 600;
  }

  .investment-table td {
    padding: 10px 16px;
    border-bottom: 1px solid #e5e7eb;
  }

  .investment-table tr:last-child td {
    font-weight: 700;
    font-size: 16px;
    background: ${secondary};
    color: ${accent};
  }

  .sig-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    margin-top: 32px;
  }

  .sig-block {
    border-top: 2px solid #e5e7eb;
    padding-top: 16px;
  }

  .sig-block h3 {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 24px;
  }

  .sig-line {
    border-bottom: 1px solid #9ca3af;
    margin-bottom: 6px;
    height: 32px;
  }

  .sig-label {
    font-size: 11px;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 16px;
  }

  .sig-prefilled {
    font-size: 13px;
    color: #374151;
    font-weight: 500;
    margin-bottom: 4px;
  }

  /* ── Footer ── */
  .page-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 10px 56px;
    background: white;
    border-top: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    color: #9ca3af;
  }

  @media print {
    .page-footer { position: fixed; }
  }
</style>
</head>
<body>

<!-- ── Cover Page ── -->
<div class="cover-page">
  <div class="cover-header">
    <div class="cover-logo-area">
      <div class="cover-business-name">${input.businessName}</div>
      <div class="cover-badge">Proposal</div>
    </div>
    <div class="cover-title">${input.title}</div>
    <div class="cover-subtitle">Prepared for ${input.clientName}${input.clientAddress ? ` · ${input.clientAddress}` : ""}</div>
  </div>

  <div class="cover-body">
    <div class="cover-info-card">
      <h3>Prepared For</h3>
      <p>${input.clientName}</p>
      ${input.clientAddress ? `<p class="sub">${input.clientAddress}</p>` : ""}
      ${input.clientEmail ? `<p class="sub">${input.clientEmail}</p>` : ""}
    </div>

    <div class="cover-info-card">
      <h3>Prepared By</h3>
      <p>${input.businessName}</p>
      ${input.businessPhone ? `<p class="sub">${input.businessPhone}</p>` : ""}
      ${input.businessEmail ? `<p class="sub">${input.businessEmail}</p>` : ""}
      ${input.licenseNumber ? `<p class="sub">License: ${input.licenseNumber}</p>` : ""}
    </div>

    <div class="cover-info-card">
      <h3>Proposal Date</h3>
      <p>${input.preparedDate}</p>
    </div>

    <div class="cover-info-card">
      <h3>Valid Until</h3>
      <p>${input.validUntil}</p>
    </div>

    ${totalCost > 0 ? `
    <div class="cover-highlights">
      <h3>Investment Summary</h3>
      <div class="highlight-grid">
        ${laborCost > 0 ? `<div class="highlight-item">
          <div class="highlight-value">$${laborCost.toLocaleString()}</div>
          <div class="highlight-label">Labor</div>
        </div>` : ""}
        ${materialsCost > 0 ? `<div class="highlight-item">
          <div class="highlight-value">$${materialsCost.toLocaleString()}</div>
          <div class="highlight-label">Materials</div>
        </div>` : ""}
        <div class="highlight-item">
          <div class="highlight-value">$${totalCost.toLocaleString()}</div>
          <div class="highlight-label">Total Investment</div>
        </div>
      </div>
    </div>` : ""}
  </div>
</div>

<!-- ── Content Pages ── -->
<div class="content-pages">
  <div class="page-header">
    <div class="page-header-title">${input.title}</div>
    <div class="page-header-sub">${input.businessName} · ${input.preparedDate}</div>
  </div>
  <div class="content-body">
    ${sectionsHtml}
  </div>
</div>

<!-- ── Signature / Investment Page ── -->
<div class="signature-page">
  <div class="signature-title">Proposal Acceptance</div>
  <div class="signature-subtitle">Review and sign below to authorize this proposal and begin the project.</div>

  ${totalCost > 0 ? `
  <table class="investment-table">
    <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      ${laborCost > 0 ? `<tr><td>Labor</td><td style="text-align:right">$${laborCost.toLocaleString()}</td></tr>` : ""}
      ${materialsCost > 0 ? `<tr><td>Materials & Equipment</td><td style="text-align:right">$${materialsCost.toLocaleString()}</td></tr>` : ""}
      <tr><td><strong>Total Investment</strong></td><td style="text-align:right"><strong>$${totalCost.toLocaleString()}</strong></td></tr>
    </tbody>
  </table>` : ""}

  <div class="sig-grid">
    <div class="sig-block">
      <h3>Client Acceptance — ${input.clientName}</h3>
      <div class="sig-line"></div>
      <div class="sig-label">Signature</div>
      <div class="sig-line"></div>
      <div class="sig-label">Printed Name</div>
      <div class="sig-line"></div>
      <div class="sig-label">Date</div>
    </div>

    <div class="sig-block">
      <h3>Contractor — ${input.businessName}</h3>
      <div class="sig-line"></div>
      <div class="sig-label">Signature</div>
      <div class="sig-prefilled">${input.businessName}</div>
      <div class="sig-label">Printed Name</div>
      <div class="sig-line"></div>
      <div class="sig-label">Date</div>
    </div>
  </div>
</div>

<!-- Footer -->
<div class="page-footer">
  <span>${input.businessName}</span>
  <span>${input.title} · ${input.preparedDate}</span>
  <span>Generated with ProposAI</span>
</div>

</body>
</html>`;
}

/**
 * Build and return the HTML string for a proposal (exported for reuse by Word exporter)
 */
export { buildHtml };

/**
 * Render the template proposal to a PDF buffer using Puppeteer
 */
export async function renderTemplatePdf(input: TemplatePdfInput): Promise<Buffer> {
  const html = await buildHtml(input);

  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "16mm", left: "0mm" },
      displayHeaderFooter: false,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
