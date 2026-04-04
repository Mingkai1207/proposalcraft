/**
 * Template-Aware PDF Renderer
 *
 * Renders a proposal using one of 5 visual styles:
 *   modern-wave, classic-letterhead, bold-dark, minimal-clean, executive-sidebar
 *
 * All styles share the same proposal sections; only the visual presentation differs.
 */

import { marked } from "marked";
import type { TemplateStyle } from "../../shared/templateDefs";
import { generateVisualization } from "./visualizationGenerator";

export interface TemplatePdfInput {
  style: TemplateStyle;
  title: string;
  tradeType: string;
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

// ─── Markdown → HTML ─────────────────────────────────────────────────────────

function mdToHtml(md: string): string {
  if (!md) return "";
  const cleaned = md
    .replace(/\[Your[^\]]+\]/g, "")
    .replace(/^(Signature|Printed Name|Title|Date):\s*_{3,}\s*$/gm, "")
    .replace(/#{1,6}\s*(Accepted By|Acceptance|Signature|Contact Information)[\s\S]*?(?=#{1,6}\s|$)/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return marked.parse(cleaned) as string;
}

// ─── Visualization helpers ────────────────────────────────────────────────────

async function buildVizHtml(
  fields: Record<string, string>,
  style: TemplateStyle
): Promise<{ costPie: string; timelineBar: string; paymentBar: string }> {
  const laborCost = parseFloat(fields.labor_cost || "0") || 0;
  const materialsCost = parseFloat(fields.materials_cost || "0") || 0;
  const totalCost = parseFloat(fields.total_cost || "0") || 0;
  const estimatedDays = parseInt(fields.estimated_days || "0") || 0;
  const paymentTerms = fields.payment_terms || "50% upfront, 50% on completion";

  const vizData = {
    laborCost,
    materialsCost,
    totalCost,
    timeline: `${estimatedDays} days`,
    estimatedDays,
    jobScope: fields.job_description || "",
    currentBill: 0,
    annualProduction: 0,
    utilityRate: 0,
    systemSize: 0,
    incentives: "",
    roofType: "",
  };

  let costPie = "";
  let timelineBar = "";
  let paymentBar = "";

  if (totalCost > 0 && (laborCost > 0 || materialsCost > 0)) {
    const pieResult = await generateVisualization(
      {
        id: "cost_breakdown_pie",
        type: "cost_breakdown_pie",
        title: "Investment Breakdown",
        dataFields: ["labor_cost", "materials_cost", "total_cost"],
        description: "Labor vs. materials breakdown",
      },
      vizData
    );
    costPie = pieResult.type === "image"
      ? `<img src="${pieResult.base64}" style="max-width:100%;height:auto;" alt="Cost Breakdown" />`
      : pieResult.html;
  }

  if (estimatedDays > 0) {
    const ganttResult = await generateVisualization(
      {
        id: "timeline_gantt",
        type: "timeline_gantt",
        title: "Project Schedule",
        dataFields: ["estimated_days"],
        description: "Project phases timeline",
      },
      vizData
    );
    timelineBar = ganttResult.type === "image"
      ? `<img src="${ganttResult.base64}" style="max-width:100%;height:auto;" alt="Project Timeline" />`
      : ganttResult.html;
  }

  if (totalCost > 0) {
    const payResult = await generateVisualization(
      {
        id: "payment_schedule_bar",
        type: "payment_schedule_bar",
        title: "Payment Schedule",
        dataFields: ["total_cost", "payment_terms"],
        description: "Payment milestones",
      },
      { ...vizData, paymentTerms }
    );
    paymentBar = payResult.type === "image"
      ? `<img src="${payResult.base64}" style="max-width:100%;height:auto;" alt="Payment Schedule" />`
      : payResult.html;
  }

  return { costPie, timelineBar, paymentBar };
}

// ─── Section renderer ─────────────────────────────────────────────────────────

const SECTION_ORDER = [
  "executive_summary",
  "scope_of_work",
  "materials_equipment",
  "timeline",
  "investment",
  "terms",
];

const SECTION_TITLES: Record<string, string> = {
  executive_summary: "Executive Summary",
  scope_of_work: "Scope of Work",
  materials_equipment: "Materials & Equipment",
  timeline: "Project Timeline",
  investment: "Investment Summary",
  terms: "Terms & Conditions",
};

// ─── Style: Modern Wave ───────────────────────────────────────────────────────

function buildModernWaveHtml(input: TemplatePdfInput, sections: string, vizHtml: { costPie: string; timelineBar: string; paymentBar: string }): string {
  const { style } = input;
  const laborCost = parseFloat(input.fields.labor_cost || "0") || 0;
  const materialsCost = parseFloat(input.fields.materials_cost || "0") || 0;
  const totalCost = parseFloat(input.fields.total_cost || "0") || 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${input.title}</title>
<style>
  /* System fonts only — no external imports for PDF reliability */
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',-apple-system,Arial,sans-serif; color:${style.textColor}; background:#fff; font-size:13.5px; line-height:1.65; }

  /* Cover */
  .cover { min-height:100vh; page-break-after:always; }
  .cover-header {
    background: linear-gradient(135deg, ${style.primaryColor} 0%, ${style.accentColor} 100%);
    padding: 52px 60px 44px;
    color: #fff;
    position: relative;
    overflow: hidden;
  }
  .cover-header::after {
    content:'';
    position:absolute;
    bottom:-40px; right:-40px;
    width:200px; height:200px;
    border-radius:50%;
    background: rgba(255,255,255,0.08);
  }
  .cover-header::before {
    content:'';
    position:absolute;
    bottom:-80px; right:60px;
    width:140px; height:140px;
    border-radius:50%;
    background: rgba(255,255,255,0.05);
  }
  .cover-biz { font-size:20px; font-weight:700; margin-bottom:40px; letter-spacing:-0.3px; }
  .cover-label { font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; opacity:0.7; margin-bottom:8px; }
  .cover-title { font-size:38px; font-weight:800; line-height:1.15; letter-spacing:-0.8px; margin-bottom:10px; }
  .cover-sub { font-size:15px; opacity:0.8; }
  .cover-body { padding:44px 60px; background:#f0fdfa; display:grid; grid-template-columns:1fr 1fr; gap:24px; }
  .info-card { background:#fff; border-radius:12px; padding:22px 24px; border:1px solid #d1fae5; }
  .info-card h4 { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#6b7280; margin-bottom:10px; }
  .info-card p { font-size:13.5px; font-weight:600; color:#111827; }
  .info-card .sub { font-size:12px; font-weight:400; color:#6b7280; margin-top:3px; }
  .highlights { grid-column:1/-1; background:#fff; border-radius:12px; padding:22px 24px; border:1px solid #d1fae5; }
  .highlights h4 { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#6b7280; margin-bottom:16px; }
  .hl-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
  .hl-item { text-align:center; padding:16px; background:#f0fdfa; border-radius:8px; }
  .hl-val { font-size:26px; font-weight:800; color:${style.primaryColor}; line-height:1; margin-bottom:4px; }
  .hl-lbl { font-size:10px; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px; }

  /* Running header */
  .run-header { background:${style.primaryColor}; padding:12px 60px; display:flex; justify-content:space-between; align-items:center; }
  .run-header-title { color:#fff; font-size:12px; font-weight:600; }
  .run-header-sub { color:rgba(255,255,255,0.65); font-size:11px; }

  /* Content */
  .content { padding:36px 60px 60px; }
  .section { margin-bottom:36px; page-break-inside:avoid; }
  .section-title { font-size:17px; font-weight:700; color:${style.primaryColor}; margin-bottom:14px; padding-bottom:8px; border-bottom:2px solid #ccfbf1; }
  .section-content p { color:#374151; margin-bottom:10px; line-height:1.7; }
  .section-content h1,.section-content h2,.section-content h3 { font-size:14px; font-weight:600; color:#111827; margin:14px 0 6px; }
  .section-content ul,.section-content ol { padding-left:20px; margin-bottom:12px; }
  .section-content li { color:#374151; margin-bottom:5px; line-height:1.6; }
  .section-content li::marker { color:${style.primaryColor}; }
  .section-content strong { color:#111827; font-weight:600; }
  .section-content table { width:100%; border-collapse:collapse; margin:12px 0; font-size:12.5px; }
  .section-content th { background:#f0fdfa; color:#374151; padding:8px 12px; text-align:left; font-weight:600; border:1px solid #d1fae5; }
  .section-content td { padding:8px 12px; border:1px solid #e5e7eb; color:#374151; }
  .section-content tr:nth-child(even) td { background:#f9fafb; }
  .section-content blockquote { border-left:3px solid ${style.primaryColor}; padding:8px 16px; margin:12px 0; background:#f0fdfa; border-radius:0 6px 6px 0; color:#374151; font-style:italic; }
  .viz-box { background:#f9fafb; border-radius:12px; padding:24px; border:1px solid #e5e7eb; text-align:center; margin-top:12px; }

  /* Signature */
  .sig-page { page-break-before:always; padding:40px 60px; }
  .sig-h { font-size:22px; font-weight:800; color:${style.primaryColor}; margin-bottom:6px; }
  .sig-sub { color:#6b7280; font-size:13px; margin-bottom:28px; }
  .inv-table { width:100%; border-collapse:collapse; margin-bottom:32px; font-size:13.5px; }
  .inv-table th { background:${style.primaryColor}; color:#fff; padding:10px 16px; text-align:left; font-weight:600; }
  .inv-table td { padding:10px 16px; border-bottom:1px solid #e5e7eb; }
  .inv-table .total td { font-weight:700; font-size:15px; background:#f0fdfa; color:${style.primaryColor}; }
  .sig-grid { display:grid; grid-template-columns:1fr 1fr; gap:32px; margin-top:32px; }
  .sig-block { border-top:2px solid #e5e7eb; padding-top:16px; }
  .sig-block h3 { font-size:12px; font-weight:600; color:#374151; margin-bottom:22px; }
  .sig-line { border-bottom:1px solid #9ca3af; height:32px; margin-bottom:5px; }
  .sig-lbl { font-size:10px; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:14px; }
  .sig-pre { font-size:13px; color:#374151; font-weight:500; margin-bottom:4px; }

  /* Footer */
  .footer { position:fixed; bottom:0; left:0; right:0; padding:8px 60px; background:#fff; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; font-size:10px; color:#9ca3af; }
</style>
</head>
<body>

<div class="cover">
  <div class="cover-header">
    <div class="cover-biz">${input.businessName}</div>
    <div class="cover-label">Proposal</div>
    <div class="cover-title">${input.title}</div>
    <div class="cover-sub">Prepared for ${input.clientName}${input.clientAddress ? ` · ${input.clientAddress}` : ""}</div>
  </div>
  <div class="cover-body">
    <div class="info-card">
      <h4>Prepared For</h4>
      <p>${input.clientName}</p>
      ${input.clientAddress ? `<p class="sub">${input.clientAddress}</p>` : ""}
      ${input.clientEmail ? `<p class="sub">${input.clientEmail}</p>` : ""}
    </div>
    <div class="info-card">
      <h4>Prepared By</h4>
      <p>${input.businessName}</p>
      ${input.businessPhone ? `<p class="sub">${input.businessPhone}</p>` : ""}
      ${input.businessEmail ? `<p class="sub">${input.businessEmail}</p>` : ""}
      ${input.licenseNumber ? `<p class="sub">License: ${input.licenseNumber}</p>` : ""}
    </div>
    <div class="info-card">
      <h4>Proposal Date</h4>
      <p>${input.preparedDate}</p>
    </div>
    <div class="info-card">
      <h4>Valid Until</h4>
      <p>${input.validUntil}</p>
    </div>
    ${totalCost > 0 ? `
    <div class="highlights">
      <h4>Investment Summary</h4>
      <div class="hl-grid">
        ${laborCost > 0 ? `<div class="hl-item"><div class="hl-val">$${laborCost.toLocaleString()}</div><div class="hl-lbl">Labor</div></div>` : ""}
        ${materialsCost > 0 ? `<div class="hl-item"><div class="hl-val">$${materialsCost.toLocaleString()}</div><div class="hl-lbl">Materials</div></div>` : ""}
        <div class="hl-item"><div class="hl-val">$${totalCost.toLocaleString()}</div><div class="hl-lbl">Total</div></div>
      </div>
    </div>` : ""}
  </div>
</div>

<div class="run-header">
  <div class="run-header-title">${input.title}</div>
  <div class="run-header-sub">${input.businessName} · ${input.preparedDate}</div>
</div>
<div class="content">
  ${sections}
  ${vizHtml.costPie ? `<div class="section"><div class="section-title">Investment Breakdown</div><div class="viz-box">${vizHtml.costPie}</div></div>` : ""}
  ${vizHtml.timelineBar ? `<div class="section"><div class="section-title">Project Schedule</div><div class="viz-box">${vizHtml.timelineBar}</div></div>` : ""}
  ${vizHtml.paymentBar ? `<div class="section"><div class="section-title">Payment Schedule</div><div class="viz-box">${vizHtml.paymentBar}</div></div>` : ""}
</div>

<div class="sig-page">
  <div class="sig-h">Proposal Acceptance</div>
  <div class="sig-sub">Review and sign below to authorize this proposal and begin the project.</div>
  ${totalCost > 0 ? `
  <table class="inv-table">
    <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      ${laborCost > 0 ? `<tr><td>Labor</td><td style="text-align:right">$${laborCost.toLocaleString()}</td></tr>` : ""}
      ${materialsCost > 0 ? `<tr><td>Materials & Equipment</td><td style="text-align:right">$${materialsCost.toLocaleString()}</td></tr>` : ""}
      <tr class="total"><td>Total Investment</td><td style="text-align:right">$${totalCost.toLocaleString()}</td></tr>
    </tbody>
  </table>` : ""}
  <div class="sig-grid">
    <div class="sig-block">
      <h3>Client — ${input.clientName}</h3>
      <div class="sig-line"></div><div class="sig-lbl">Signature</div>
      <div class="sig-line"></div><div class="sig-lbl">Printed Name</div>
      <div class="sig-line"></div><div class="sig-lbl">Date</div>
    </div>
    <div class="sig-block">
      <h3>Contractor — ${input.businessName}</h3>
      <div class="sig-line"></div><div class="sig-lbl">Signature</div>
      <div class="sig-pre">${input.businessName}</div><div class="sig-lbl">Printed Name</div>
      <div class="sig-line"></div><div class="sig-lbl">Date</div>
    </div>
  </div>
</div>

<div class="footer">
  <span>${input.businessName}</span>
  <span>${input.title} · ${input.preparedDate}</span>
  <span>ProposAI</span>
</div>
</body></html>`;
}

// ─── Style: Classic Letterhead ────────────────────────────────────────────────

function buildClassicLetterheadHtml(input: TemplatePdfInput, sections: string, vizHtml: { costPie: string; timelineBar: string; paymentBar: string }): string {
  const { style } = input;
  const laborCost = parseFloat(input.fields.labor_cost || "0") || 0;
  const materialsCost = parseFloat(input.fields.materials_cost || "0") || 0;
  const totalCost = parseFloat(input.fields.total_cost || "0") || 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${input.title}</title>
<style>
  /* System fonts only — no external imports for PDF reliability */
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Georgia,'Times New Roman',serif; color:${style.textColor}; background:${style.bgColor}; font-size:13.5px; line-height:1.7; }

  /* Cover */
  .cover { min-height:100vh; page-break-after:always; padding:0; }
  .cover-top-bar { height:8px; background:${style.accentColor}; }
  .cover-header { padding:48px 64px 36px; border-bottom:1px solid #e8e0d0; }
  .cover-header-row { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:36px; }
  .cover-biz-block h1 { font-family:Georgia,'Times New Roman',serif; font-size:22px; font-weight:700; color:${style.primaryColor}; }
  .cover-biz-block p { font-size:12px; color:#6b7280; margin-top:4px; }
  .cover-proposal-label { font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:${style.accentColor}; margin-bottom:10px; }
  .cover-title { font-family:Georgia,'Times New Roman',serif; font-size:34px; font-weight:700; color:${style.primaryColor}; line-height:1.2; margin-bottom:8px; }
  .cover-sub { font-size:14px; color:#6b7280; }
  .cover-meta { padding:36px 64px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:32px; border-bottom:1px solid #e8e0d0; }
  .meta-block h4 { font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:${style.accentColor}; margin-bottom:8px; }
  .meta-block p { font-size:13.5px; font-weight:600; color:${style.primaryColor}; }
  .meta-block .sub { font-size:12px; font-weight:400; color:#6b7280; margin-top:3px; }
  .cover-summary { padding:36px 64px; }
  .cover-summary h4 { font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:${style.accentColor}; margin-bottom:20px; }
  .sum-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  .sum-item { border:1px solid #e8e0d0; border-radius:6px; padding:18px; text-align:center; background:#fff; }
  .sum-val { font-family:Georgia,'Times New Roman',serif; font-size:24px; font-weight:700; color:${style.primaryColor}; }
  .sum-lbl { font-size:10px; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px; margin-top:4px; }

  /* Running header */
  .run-header { padding:10px 64px; border-bottom:2px solid ${style.primaryColor}; display:flex; justify-content:space-between; align-items:center; }
  .run-header-title { font-family:Georgia,'Times New Roman',serif; font-size:13px; font-weight:600; color:${style.primaryColor}; }
  .run-header-sub { font-size:11px; color:#9ca3af; }

  /* Content */
  .content { padding:36px 64px 60px; }
  .section { margin-bottom:36px; page-break-inside:avoid; }
  .section-title { font-family:Georgia,'Times New Roman',serif; font-size:18px; font-weight:700; color:${style.primaryColor}; margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid ${style.accentColor}; }
  .section-content p { color:#374151; margin-bottom:10px; line-height:1.75; }
  .section-content h1,.section-content h2,.section-content h3 { font-family:Georgia,'Times New Roman',serif; font-size:14px; font-weight:600; color:${style.primaryColor}; margin:14px 0 6px; }
  .section-content ul,.section-content ol { padding-left:22px; margin-bottom:12px; }
  .section-content li { color:#374151; margin-bottom:5px; line-height:1.7; }
  .section-content li::marker { color:${style.accentColor}; }
  .section-content strong { color:#111827; font-weight:600; }
  .section-content table { width:100%; border-collapse:collapse; margin:12px 0; font-size:12.5px; }
  .section-content th { background:${style.primaryColor}; color:#fff; padding:8px 14px; text-align:left; font-weight:600; }
  .section-content td { padding:8px 14px; border-bottom:1px solid #e8e0d0; color:#374151; }
  .section-content tr:nth-child(even) td { background:#faf8f3; }
  .section-content blockquote { border-left:3px solid ${style.accentColor}; padding:8px 16px; margin:12px 0; background:#faf8f3; color:#374151; font-style:italic; }
  .viz-box { background:#faf8f3; border-radius:8px; padding:24px; border:1px solid #e8e0d0; text-align:center; margin-top:12px; }

  /* Signature */
  .sig-page { page-break-before:always; padding:40px 64px; }
  .sig-h { font-family:Georgia,'Times New Roman',serif; font-size:24px; font-weight:700; color:${style.primaryColor}; margin-bottom:6px; }
  .sig-sub { color:#6b7280; font-size:13px; margin-bottom:28px; }
  .inv-table { width:100%; border-collapse:collapse; margin-bottom:32px; font-size:13.5px; }
  .inv-table th { background:${style.primaryColor}; color:#fff; padding:10px 16px; text-align:left; font-weight:600; }
  .inv-table td { padding:10px 16px; border-bottom:1px solid #e8e0d0; }
  .inv-table .total td { font-weight:700; font-size:15px; background:#faf8f3; color:${style.primaryColor}; }
  .sig-grid { display:grid; grid-template-columns:1fr 1fr; gap:32px; margin-top:32px; }
  .sig-block { border-top:2px solid #e8e0d0; padding-top:16px; }
  .sig-block h3 { font-size:12px; font-weight:600; color:#374151; margin-bottom:22px; }
  .sig-line { border-bottom:1px solid #9ca3af; height:32px; margin-bottom:5px; }
  .sig-lbl { font-size:10px; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:14px; }
  .sig-pre { font-size:13px; color:#374151; font-weight:500; margin-bottom:4px; }

  /* Footer */
  .footer { position:fixed; bottom:0; left:0; right:0; padding:8px 64px; background:${style.bgColor}; border-top:2px solid ${style.primaryColor}; display:flex; justify-content:space-between; font-size:10px; color:#9ca3af; }
  .bottom-bar { height:4px; background:${style.accentColor}; position:fixed; bottom:28px; left:0; right:0; }
</style>
</head>
<body>

<div class="cover">
  <div class="cover-top-bar"></div>
  <div class="cover-header">
    <div class="cover-header-row">
      <div class="cover-biz-block">
        <h1>${input.businessName}</h1>
        ${input.businessAddress ? `<p>${input.businessAddress}</p>` : ""}
        ${input.businessPhone ? `<p>${input.businessPhone}</p>` : ""}
        ${input.licenseNumber ? `<p>License: ${input.licenseNumber}</p>` : ""}
      </div>
    </div>
    <div class="cover-proposal-label">Proposal · ${input.tradeType}</div>
    <div class="cover-title">${input.title}</div>
    <div class="cover-sub">Prepared for ${input.clientName}</div>
  </div>
  <div class="cover-meta">
    <div class="meta-block">
      <h4>Prepared For</h4>
      <p>${input.clientName}</p>
      ${input.clientAddress ? `<p class="sub">${input.clientAddress}</p>` : ""}
      ${input.clientEmail ? `<p class="sub">${input.clientEmail}</p>` : ""}
    </div>
    <div class="meta-block">
      <h4>Proposal Date</h4>
      <p>${input.preparedDate}</p>
    </div>
    <div class="meta-block">
      <h4>Valid Until</h4>
      <p>${input.validUntil}</p>
    </div>
  </div>
  ${totalCost > 0 ? `
  <div class="cover-summary">
    <h4>Investment Summary</h4>
    <div class="sum-grid">
      ${laborCost > 0 ? `<div class="sum-item"><div class="sum-val">$${laborCost.toLocaleString()}</div><div class="sum-lbl">Labor</div></div>` : ""}
      ${materialsCost > 0 ? `<div class="sum-item"><div class="sum-val">$${materialsCost.toLocaleString()}</div><div class="sum-lbl">Materials</div></div>` : ""}
      <div class="sum-item"><div class="sum-val">$${totalCost.toLocaleString()}</div><div class="sum-lbl">Total Investment</div></div>
    </div>
  </div>` : ""}
</div>

<div class="run-header">
  <div class="run-header-title">${input.title}</div>
  <div class="run-header-sub">${input.businessName} · ${input.preparedDate}</div>
</div>
<div class="content">
  ${sections}
  ${vizHtml.costPie ? `<div class="section"><div class="section-title">Investment Breakdown</div><div class="viz-box">${vizHtml.costPie}</div></div>` : ""}
  ${vizHtml.timelineBar ? `<div class="section"><div class="section-title">Project Schedule</div><div class="viz-box">${vizHtml.timelineBar}</div></div>` : ""}
  ${vizHtml.paymentBar ? `<div class="section"><div class="section-title">Payment Schedule</div><div class="viz-box">${vizHtml.paymentBar}</div></div>` : ""}
</div>

<div class="sig-page">
  <div class="sig-h">Proposal Acceptance</div>
  <div class="sig-sub">By signing below, both parties agree to the terms set forth in this proposal.</div>
  ${totalCost > 0 ? `
  <table class="inv-table">
    <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      ${laborCost > 0 ? `<tr><td>Labor</td><td style="text-align:right">$${laborCost.toLocaleString()}</td></tr>` : ""}
      ${materialsCost > 0 ? `<tr><td>Materials & Equipment</td><td style="text-align:right">$${materialsCost.toLocaleString()}</td></tr>` : ""}
      <tr class="total"><td>Total Investment</td><td style="text-align:right">$${totalCost.toLocaleString()}</td></tr>
    </tbody>
  </table>` : ""}
  <div class="sig-grid">
    <div class="sig-block">
      <h3>Client — ${input.clientName}</h3>
      <div class="sig-line"></div><div class="sig-lbl">Signature</div>
      <div class="sig-line"></div><div class="sig-lbl">Printed Name</div>
      <div class="sig-line"></div><div class="sig-lbl">Date</div>
    </div>
    <div class="sig-block">
      <h3>Contractor — ${input.businessName}</h3>
      <div class="sig-line"></div><div class="sig-lbl">Signature</div>
      <div class="sig-pre">${input.businessName}</div><div class="sig-lbl">Printed Name</div>
      <div class="sig-line"></div><div class="sig-lbl">Date</div>
    </div>
  </div>
</div>

<div class="bottom-bar"></div>
<div class="footer">
  <span>${input.businessName}</span>
  <span>${input.title} · ${input.preparedDate}</span>
  <span>ProposAI</span>
</div>
</body></html>`;
}

// ─── Style: Bold Dark ─────────────────────────────────────────────────────────

function buildBoldDarkHtml(input: TemplatePdfInput, sections: string, vizHtml: { costPie: string; timelineBar: string; paymentBar: string }): string {
  const { style } = input;
  const laborCost = parseFloat(input.fields.labor_cost || "0") || 0;
  const materialsCost = parseFloat(input.fields.materials_cost || "0") || 0;
  const totalCost = parseFloat(input.fields.total_cost || "0") || 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${input.title}</title>
<style>
  /* System fonts only — no external imports for PDF reliability */
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',-apple-system,Arial,sans-serif; color:${style.textColor}; background:#fff; font-size:13.5px; line-height:1.65; }

  /* Cover */
  .cover { min-height:100vh; page-break-after:always; }
  .cover-header { background:${style.primaryColor}; padding:56px 64px 48px; color:#fff; }
  .cover-biz { font-size:14px; font-weight:500; color:rgba(255,255,255,0.6); letter-spacing:1px; text-transform:uppercase; margin-bottom:48px; }
  .cover-label { display:inline-block; background:${style.accentColor}; color:#fff; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:4px 12px; border-radius:4px; margin-bottom:16px; }
  .cover-title { font-size:40px; font-weight:900; line-height:1.1; letter-spacing:-1px; margin-bottom:12px; }
  .cover-sub { font-size:15px; color:rgba(255,255,255,0.65); }
  .cover-body { padding:40px 64px; background:#f8fafc; display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .info-card { background:#fff; border-radius:8px; padding:22px 24px; border-left:4px solid ${style.accentColor}; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
  .info-card h4 { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#9ca3af; margin-bottom:8px; }
  .info-card p { font-size:13.5px; font-weight:700; color:${style.primaryColor}; }
  .info-card .sub { font-size:12px; font-weight:400; color:#6b7280; margin-top:3px; }
  .highlights { grid-column:1/-1; background:${style.primaryColor}; border-radius:8px; padding:24px; }
  .highlights h4 { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:rgba(255,255,255,0.5); margin-bottom:16px; }
  .hl-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
  .hl-item { text-align:center; padding:16px; background:rgba(255,255,255,0.06); border-radius:6px; border:1px solid rgba(255,255,255,0.1); }
  .hl-val { font-size:28px; font-weight:900; color:${style.accentColor}; line-height:1; margin-bottom:4px; }
  .hl-lbl { font-size:10px; color:rgba(255,255,255,0.5); text-transform:uppercase; letter-spacing:0.5px; }

  /* Running header */
  .run-header { background:${style.primaryColor}; padding:12px 64px; display:flex; justify-content:space-between; align-items:center; }
  .run-header-title { color:#fff; font-size:12px; font-weight:700; }
  .run-header-sub { color:rgba(255,255,255,0.5); font-size:11px; }

  /* Content */
  .content { padding:36px 64px 60px; }
  .section { margin-bottom:36px; page-break-inside:avoid; }
  .section-title { font-size:17px; font-weight:800; color:${style.primaryColor}; margin-bottom:14px; padding-bottom:8px; border-bottom:3px solid ${style.accentColor}; }
  .section-content p { color:#374151; margin-bottom:10px; line-height:1.7; }
  .section-content h1,.section-content h2,.section-content h3 { font-size:14px; font-weight:700; color:${style.primaryColor}; margin:14px 0 6px; }
  .section-content ul,.section-content ol { padding-left:20px; margin-bottom:12px; }
  .section-content li { color:#374151; margin-bottom:5px; line-height:1.6; }
  .section-content li::marker { color:${style.accentColor}; }
  .section-content strong { color:#111827; font-weight:700; }
  .section-content table { width:100%; border-collapse:collapse; margin:12px 0; font-size:12.5px; }
  .section-content th { background:${style.primaryColor}; color:#fff; padding:8px 12px; text-align:left; font-weight:700; }
  .section-content td { padding:8px 12px; border-bottom:1px solid #e5e7eb; color:#374151; }
  .section-content tr:nth-child(even) td { background:#f8fafc; }
  .section-content blockquote { border-left:4px solid ${style.accentColor}; padding:8px 16px; margin:12px 0; background:#f8fafc; color:#374151; font-style:italic; }
  .viz-box { background:#f8fafc; border-radius:8px; padding:24px; border:1px solid #e5e7eb; text-align:center; margin-top:12px; }

  /* Signature */
  .sig-page { page-break-before:always; padding:40px 64px; }
  .sig-h { font-size:24px; font-weight:900; color:${style.primaryColor}; margin-bottom:6px; }
  .sig-sub { color:#6b7280; font-size:13px; margin-bottom:28px; }
  .inv-table { width:100%; border-collapse:collapse; margin-bottom:32px; font-size:13.5px; }
  .inv-table th { background:${style.primaryColor}; color:#fff; padding:10px 16px; text-align:left; font-weight:700; }
  .inv-table td { padding:10px 16px; border-bottom:1px solid #e5e7eb; }
  .inv-table .total td { font-weight:800; font-size:15px; background:${style.primaryColor}; color:${style.accentColor}; }
  .sig-grid { display:grid; grid-template-columns:1fr 1fr; gap:32px; margin-top:32px; }
  .sig-block { border-top:3px solid ${style.accentColor}; padding-top:16px; }
  .sig-block h3 { font-size:12px; font-weight:700; color:#374151; margin-bottom:22px; }
  .sig-line { border-bottom:1px solid #9ca3af; height:32px; margin-bottom:5px; }
  .sig-lbl { font-size:10px; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:14px; }
  .sig-pre { font-size:13px; color:#374151; font-weight:600; margin-bottom:4px; }

  /* Footer */
  .footer { position:fixed; bottom:0; left:0; right:0; padding:8px 64px; background:${style.primaryColor}; display:flex; justify-content:space-between; font-size:10px; color:rgba(255,255,255,0.4); }
</style>
</head>
<body>

<div class="cover">
  <div class="cover-header">
    <div class="cover-biz">${input.businessName}</div>
    <div class="cover-label">${input.tradeType} Proposal</div>
    <div class="cover-title">${input.title}</div>
    <div class="cover-sub">Prepared for ${input.clientName}${input.clientAddress ? ` · ${input.clientAddress}` : ""}</div>
  </div>
  <div class="cover-body">
    <div class="info-card">
      <h4>Prepared For</h4>
      <p>${input.clientName}</p>
      ${input.clientAddress ? `<p class="sub">${input.clientAddress}</p>` : ""}
      ${input.clientEmail ? `<p class="sub">${input.clientEmail}</p>` : ""}
    </div>
    <div class="info-card">
      <h4>Prepared By</h4>
      <p>${input.businessName}</p>
      ${input.businessPhone ? `<p class="sub">${input.businessPhone}</p>` : ""}
      ${input.businessEmail ? `<p class="sub">${input.businessEmail}</p>` : ""}
      ${input.licenseNumber ? `<p class="sub">License: ${input.licenseNumber}</p>` : ""}
    </div>
    <div class="info-card">
      <h4>Proposal Date</h4>
      <p>${input.preparedDate}</p>
    </div>
    <div class="info-card">
      <h4>Valid Until</h4>
      <p>${input.validUntil}</p>
    </div>
    ${totalCost > 0 ? `
    <div class="highlights">
      <h4>Investment Summary</h4>
      <div class="hl-grid">
        ${laborCost > 0 ? `<div class="hl-item"><div class="hl-val">$${laborCost.toLocaleString()}</div><div class="hl-lbl">Labor</div></div>` : ""}
        ${materialsCost > 0 ? `<div class="hl-item"><div class="hl-val">$${materialsCost.toLocaleString()}</div><div class="hl-lbl">Materials</div></div>` : ""}
        <div class="hl-item"><div class="hl-val">$${totalCost.toLocaleString()}</div><div class="hl-lbl">Total</div></div>
      </div>
    </div>` : ""}
  </div>
</div>

<div class="run-header">
  <div class="run-header-title">${input.title}</div>
  <div class="run-header-sub">${input.businessName} · ${input.preparedDate}</div>
</div>
<div class="content">
  ${sections}
  ${vizHtml.costPie ? `<div class="section"><div class="section-title">Investment Breakdown</div><div class="viz-box">${vizHtml.costPie}</div></div>` : ""}
  ${vizHtml.timelineBar ? `<div class="section"><div class="section-title">Project Schedule</div><div class="viz-box">${vizHtml.timelineBar}</div></div>` : ""}
  ${vizHtml.paymentBar ? `<div class="section"><div class="section-title">Payment Schedule</div><div class="viz-box">${vizHtml.paymentBar}</div></div>` : ""}
</div>

<div class="sig-page">
  <div class="sig-h">Proposal Acceptance</div>
  <div class="sig-sub">Review and sign below to authorize this proposal and begin the project.</div>
  ${totalCost > 0 ? `
  <table class="inv-table">
    <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      ${laborCost > 0 ? `<tr><td>Labor</td><td style="text-align:right">$${laborCost.toLocaleString()}</td></tr>` : ""}
      ${materialsCost > 0 ? `<tr><td>Materials & Equipment</td><td style="text-align:right">$${materialsCost.toLocaleString()}</td></tr>` : ""}
      <tr class="total"><td>Total Investment</td><td style="text-align:right">$${totalCost.toLocaleString()}</td></tr>
    </tbody>
  </table>` : ""}
  <div class="sig-grid">
    <div class="sig-block">
      <h3>Client — ${input.clientName}</h3>
      <div class="sig-line"></div><div class="sig-lbl">Signature</div>
      <div class="sig-line"></div><div class="sig-lbl">Printed Name</div>
      <div class="sig-line"></div><div class="sig-lbl">Date</div>
    </div>
    <div class="sig-block">
      <h3>Contractor — ${input.businessName}</h3>
      <div class="sig-line"></div><div class="sig-lbl">Signature</div>
      <div class="sig-pre">${input.businessName}</div><div class="sig-lbl">Printed Name</div>
      <div class="sig-line"></div><div class="sig-lbl">Date</div>
    </div>
  </div>
</div>

<div class="footer">
  <span>${input.businessName}</span>
  <span>${input.title} · ${input.preparedDate}</span>
  <span>ProposAI</span>
</div>
</body></html>`;
}

// ─── Style: Minimal Clean ─────────────────────────────────────────────────────

function buildMinimalCleanHtml(input: TemplatePdfInput, sections: string, vizHtml: { costPie: string; timelineBar: string; paymentBar: string }): string {
  const { style } = input;
  const laborCost = parseFloat(input.fields.labor_cost || "0") || 0;
  const materialsCost = parseFloat(input.fields.materials_cost || "0") || 0;
  const totalCost = parseFloat(input.fields.total_cost || "0") || 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${input.title}</title>
<style>
  /* System fonts only — no external imports for PDF reliability */
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',-apple-system,Arial,sans-serif; color:${style.textColor}; background:${style.bgColor}; font-size:13.5px; line-height:1.7; }

  /* Cover */
  .cover { min-height:100vh; page-break-after:always; padding:64px 72px; }
  .cover-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:64px; padding-bottom:24px; border-bottom:1px solid #cbd5e1; }
  .cover-biz { font-size:16px; font-weight:600; color:#1e293b; }
  .cover-biz-sub { font-size:12px; color:#94a3b8; margin-top:4px; }
  .cover-date { font-size:12px; color:#94a3b8; text-align:right; }
  .cover-main { margin-bottom:64px; }
  .cover-label { font-size:11px; font-weight:500; letter-spacing:2px; text-transform:uppercase; color:${style.accentColor}; margin-bottom:12px; }
  .cover-title { font-size:36px; font-weight:300; color:#0f172a; line-height:1.2; letter-spacing:-0.5px; margin-bottom:12px; }
  .cover-sub { font-size:15px; color:#64748b; font-weight:300; }
  .cover-meta { display:grid; grid-template-columns:1fr 1fr; gap:32px; padding-top:32px; border-top:1px solid #e2e8f0; }
  .meta-block h4 { font-size:10px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#94a3b8; margin-bottom:8px; }
  .meta-block p { font-size:13.5px; font-weight:500; color:#1e293b; }
  .meta-block .sub { font-size:12px; font-weight:400; color:#64748b; margin-top:3px; }
  .cover-summary { margin-top:40px; padding:28px; background:#fff; border-radius:8px; border:1px solid #e2e8f0; }
  .cover-summary h4 { font-size:10px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#94a3b8; margin-bottom:16px; }
  .sum-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  .sum-item { text-align:center; padding:16px; }
  .sum-val { font-size:24px; font-weight:300; color:${style.accentColor}; letter-spacing:-0.5px; }
  .sum-lbl { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; margin-top:4px; }

  /* Running header */
  .run-header { padding:12px 72px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; }
  .run-header-title { font-size:12px; font-weight:500; color:#1e293b; }
  .run-header-sub { font-size:11px; color:#94a3b8; }

  /* Content */
  .content { padding:36px 72px 60px; }
  .section { margin-bottom:40px; page-break-inside:avoid; }
  .section-title { font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:${style.accentColor}; margin-bottom:16px; padding-bottom:8px; border-bottom:1px solid #e2e8f0; }
  .section-content p { color:#475569; margin-bottom:10px; line-height:1.75; font-weight:300; }
  .section-content h1,.section-content h2,.section-content h3 { font-size:14px; font-weight:600; color:#1e293b; margin:14px 0 6px; }
  .section-content ul,.section-content ol { padding-left:20px; margin-bottom:12px; }
  .section-content li { color:#475569; margin-bottom:5px; line-height:1.7; font-weight:300; }
  .section-content li::marker { color:${style.accentColor}; }
  .section-content strong { color:#1e293b; font-weight:600; }
  .section-content table { width:100%; border-collapse:collapse; margin:12px 0; font-size:12.5px; }
  .section-content th { background:#f1f5f9; color:#475569; padding:8px 12px; text-align:left; font-weight:600; border-bottom:2px solid #cbd5e1; }
  .section-content td { padding:8px 12px; border-bottom:1px solid #f1f5f9; color:#475569; }
  .section-content blockquote { border-left:2px solid ${style.accentColor}; padding:8px 16px; margin:12px 0; color:#64748b; font-style:italic; font-weight:300; }
  .viz-box { background:#fff; border-radius:8px; padding:24px; border:1px solid #e2e8f0; text-align:center; margin-top:12px; }

  /* Signature */
  .sig-page { page-break-before:always; padding:40px 72px; }
  .sig-h { font-size:22px; font-weight:300; color:#0f172a; letter-spacing:-0.5px; margin-bottom:6px; }
  .sig-sub { color:#64748b; font-size:13px; font-weight:300; margin-bottom:28px; }
  .inv-table { width:100%; border-collapse:collapse; margin-bottom:32px; font-size:13.5px; }
  .inv-table th { background:#f1f5f9; color:#475569; padding:10px 16px; text-align:left; font-weight:600; border-bottom:2px solid #cbd5e1; }
  .inv-table td { padding:10px 16px; border-bottom:1px solid #f1f5f9; color:#475569; }
  .inv-table .total td { font-weight:600; font-size:15px; color:${style.accentColor}; border-top:2px solid #cbd5e1; }
  .sig-grid { display:grid; grid-template-columns:1fr 1fr; gap:32px; margin-top:32px; }
  .sig-block { border-top:1px solid #e2e8f0; padding-top:16px; }
  .sig-block h3 { font-size:11px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#94a3b8; margin-bottom:22px; }
  .sig-line { border-bottom:1px solid #cbd5e1; height:32px; margin-bottom:5px; }
  .sig-lbl { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:14px; }
  .sig-pre { font-size:13px; color:#475569; font-weight:400; margin-bottom:4px; }

  /* Footer */
  .footer { position:fixed; bottom:0; left:0; right:0; padding:8px 72px; background:${style.bgColor}; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:10px; color:#94a3b8; }
</style>
</head>
<body>

<div class="cover">
  <div class="cover-top">
    <div>
      <div class="cover-biz">${input.businessName}</div>
      ${input.businessPhone ? `<div class="cover-biz-sub">${input.businessPhone}</div>` : ""}
      ${input.licenseNumber ? `<div class="cover-biz-sub">License: ${input.licenseNumber}</div>` : ""}
    </div>
    <div class="cover-date">
      <div>${input.preparedDate}</div>
      <div style="margin-top:4px;color:#cbd5e1;">Valid until ${input.validUntil}</div>
    </div>
  </div>
  <div class="cover-main">
    <div class="cover-label">${input.tradeType} Proposal</div>
    <div class="cover-title">${input.title}</div>
    <div class="cover-sub">Prepared for ${input.clientName}</div>
  </div>
  <div class="cover-meta">
    <div class="meta-block">
      <h4>Client</h4>
      <p>${input.clientName}</p>
      ${input.clientAddress ? `<p class="sub">${input.clientAddress}</p>` : ""}
      ${input.clientEmail ? `<p class="sub">${input.clientEmail}</p>` : ""}
    </div>
    <div class="meta-block">
      <h4>Contractor</h4>
      <p>${input.businessName}</p>
      ${input.businessAddress ? `<p class="sub">${input.businessAddress}</p>` : ""}
      ${input.businessEmail ? `<p class="sub">${input.businessEmail}</p>` : ""}
    </div>
  </div>
  ${totalCost > 0 ? `
  <div class="cover-summary">
    <h4>Investment</h4>
    <div class="sum-grid">
      ${laborCost > 0 ? `<div class="sum-item"><div class="sum-val">$${laborCost.toLocaleString()}</div><div class="sum-lbl">Labor</div></div>` : ""}
      ${materialsCost > 0 ? `<div class="sum-item"><div class="sum-val">$${materialsCost.toLocaleString()}</div><div class="sum-lbl">Materials</div></div>` : ""}
      <div class="sum-item"><div class="sum-val">$${totalCost.toLocaleString()}</div><div class="sum-lbl">Total</div></div>
    </div>
  </div>` : ""}
</div>

<div class="run-header">
  <div class="run-header-title">${input.title}</div>
  <div class="run-header-sub">${input.businessName} · ${input.preparedDate}</div>
</div>
<div class="content">
  ${sections}
  ${vizHtml.costPie ? `<div class="section"><div class="section-title">Investment Breakdown</div><div class="viz-box">${vizHtml.costPie}</div></div>` : ""}
  ${vizHtml.timelineBar ? `<div class="section"><div class="section-title">Project Schedule</div><div class="viz-box">${vizHtml.timelineBar}</div></div>` : ""}
  ${vizHtml.paymentBar ? `<div class="section"><div class="section-title">Payment Schedule</div><div class="viz-box">${vizHtml.paymentBar}</div></div>` : ""}
</div>

<div class="sig-page">
  <div class="sig-h">Proposal Acceptance</div>
  <div class="sig-sub">By signing below, both parties agree to the terms set forth in this proposal.</div>
  ${totalCost > 0 ? `
  <table class="inv-table">
    <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      ${laborCost > 0 ? `<tr><td>Labor</td><td style="text-align:right">$${laborCost.toLocaleString()}</td></tr>` : ""}
      ${materialsCost > 0 ? `<tr><td>Materials & Equipment</td><td style="text-align:right">$${materialsCost.toLocaleString()}</td></tr>` : ""}
      <tr class="total"><td>Total Investment</td><td style="text-align:right">$${totalCost.toLocaleString()}</td></tr>
    </tbody>
  </table>` : ""}
  <div class="sig-grid">
    <div class="sig-block">
      <h3>Client — ${input.clientName}</h3>
      <div class="sig-line"></div><div class="sig-lbl">Signature</div>
      <div class="sig-line"></div><div class="sig-lbl">Printed Name</div>
      <div class="sig-line"></div><div class="sig-lbl">Date</div>
    </div>
    <div class="sig-block">
      <h3>Contractor — ${input.businessName}</h3>
      <div class="sig-line"></div><div class="sig-lbl">Signature</div>
      <div class="sig-pre">${input.businessName}</div><div class="sig-lbl">Printed Name</div>
      <div class="sig-line"></div><div class="sig-lbl">Date</div>
    </div>
  </div>
</div>

<div class="footer">
  <span>${input.businessName}</span>
  <span>${input.title} · ${input.preparedDate}</span>
  <span>ProposAI</span>
</div>
</body></html>`;
}

// ─── Style: Executive Sidebar ─────────────────────────────────────────────────

function buildExecutiveSidebarHtml(input: TemplatePdfInput, sections: string, vizHtml: { costPie: string; timelineBar: string; paymentBar: string }): string {
  const { style } = input;
  const laborCost = parseFloat(input.fields.labor_cost || "0") || 0;
  const materialsCost = parseFloat(input.fields.materials_cost || "0") || 0;
  const totalCost = parseFloat(input.fields.total_cost || "0") || 0;
  const estimatedDays = input.fields.estimated_days || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${input.title}</title>
<style>
  /* System fonts only — no external imports for PDF reliability */
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',-apple-system,Arial,sans-serif; color:${style.textColor}; background:#fff; font-size:13.5px; line-height:1.65; }

  /* Cover — sidebar layout */
  .cover { min-height:100vh; page-break-after:always; display:grid; grid-template-columns:280px 1fr; }
  .cover-sidebar { background:${style.primaryColor}; padding:48px 32px; color:#fff; display:flex; flex-direction:column; }
  .cover-sidebar-logo { font-size:18px; font-weight:800; margin-bottom:48px; letter-spacing:-0.3px; }
  .cover-sidebar h4 { font-size:9px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,0.45); margin-bottom:8px; }
  .cover-sidebar p { font-size:13px; font-weight:500; color:rgba(255,255,255,0.9); margin-bottom:4px; }
  .cover-sidebar .sub { font-size:11px; color:rgba(255,255,255,0.55); }
  .sidebar-divider { border:none; border-top:1px solid rgba(255,255,255,0.12); margin:24px 0; }
  .sidebar-metric { margin-bottom:20px; }
  .sidebar-metric-val { font-size:28px; font-weight:800; color:${style.accentColor}; line-height:1; }
  .sidebar-metric-lbl { font-size:10px; color:rgba(255,255,255,0.45); text-transform:uppercase; letter-spacing:0.5px; margin-top:4px; }
  .cover-main { padding:48px 48px; display:flex; flex-direction:column; justify-content:center; }
  .cover-label { font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:${style.accentColor}; margin-bottom:12px; }
  .cover-title { font-size:34px; font-weight:800; line-height:1.15; letter-spacing:-0.5px; color:#0f172a; margin-bottom:12px; }
  .cover-sub { font-size:14px; color:#64748b; margin-bottom:40px; }
  .cover-client { background:#f8fafc; border-radius:10px; padding:24px; border:1px solid #e2e8f0; }
  .cover-client h4 { font-size:10px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#94a3b8; margin-bottom:10px; }
  .cover-client p { font-size:14px; font-weight:600; color:#1e293b; }
  .cover-client .sub { font-size:12px; font-weight:400; color:#64748b; margin-top:3px; }

  /* Content pages — sidebar layout */
  .page-wrap { display:grid; grid-template-columns:280px 1fr; min-height:100vh; }
  .page-sidebar { background:${style.primaryColor}; padding:32px; color:#fff; }
  .page-sidebar-title { font-size:12px; font-weight:700; color:#fff; margin-bottom:4px; }
  .page-sidebar-sub { font-size:10px; color:rgba(255,255,255,0.45); margin-bottom:24px; }
  .page-sidebar-toc { }
  .toc-item { font-size:11px; color:rgba(255,255,255,0.6); padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.08); }
  .toc-item.active { color:${style.accentColor}; font-weight:600; }
  .page-content { padding:36px 48px 60px; }
  .section { margin-bottom:36px; page-break-inside:avoid; }
  .section-title { font-size:17px; font-weight:700; color:${style.primaryColor}; margin-bottom:14px; padding-bottom:8px; border-bottom:2px solid #dcfce7; }
  .section-content p { color:#374151; margin-bottom:10px; line-height:1.7; }
  .section-content h1,.section-content h2,.section-content h3 { font-size:14px; font-weight:600; color:${style.primaryColor}; margin:14px 0 6px; }
  .section-content ul,.section-content ol { padding-left:20px; margin-bottom:12px; }
  .section-content li { color:#374151; margin-bottom:5px; line-height:1.6; }
  .section-content li::marker { color:${style.accentColor}; }
  .section-content strong { color:#111827; font-weight:600; }
  .section-content table { width:100%; border-collapse:collapse; margin:12px 0; font-size:12.5px; }
  .section-content th { background:#f0fdf4; color:#374151; padding:8px 12px; text-align:left; font-weight:600; border:1px solid #dcfce7; }
  .section-content td { padding:8px 12px; border:1px solid #e5e7eb; color:#374151; }
  .section-content tr:nth-child(even) td { background:#f9fafb; }
  .section-content blockquote { border-left:3px solid ${style.accentColor}; padding:8px 16px; margin:12px 0; background:#f0fdf4; color:#374151; font-style:italic; }
  .viz-box { background:#f9fafb; border-radius:8px; padding:24px; border:1px solid #e5e7eb; text-align:center; margin-top:12px; }

  /* Signature */
  .sig-page { page-break-before:always; display:grid; grid-template-columns:280px 1fr; min-height:40vh; }
  .sig-sidebar { background:${style.primaryColor}; padding:32px; color:#fff; }
  .sig-sidebar h4 { font-size:9px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,0.45); margin-bottom:8px; }
  .sig-sidebar p { font-size:13px; color:rgba(255,255,255,0.8); }
  .sig-main { padding:40px 48px; }
  .sig-h { font-size:22px; font-weight:800; color:${style.primaryColor}; margin-bottom:6px; }
  .sig-sub { color:#6b7280; font-size:13px; margin-bottom:28px; }
  .inv-table { width:100%; border-collapse:collapse; margin-bottom:32px; font-size:13.5px; }
  .inv-table th { background:${style.primaryColor}; color:#fff; padding:10px 16px; text-align:left; font-weight:600; }
  .inv-table td { padding:10px 16px; border-bottom:1px solid #e5e7eb; }
  .inv-table .total td { font-weight:700; font-size:15px; background:#f0fdf4; color:${style.primaryColor}; }
  .sig-grid { display:grid; grid-template-columns:1fr 1fr; gap:32px; margin-top:32px; }
  .sig-block { border-top:2px solid #e5e7eb; padding-top:16px; }
  .sig-block h3 { font-size:12px; font-weight:600; color:#374151; margin-bottom:22px; }
  .sig-line { border-bottom:1px solid #9ca3af; height:32px; margin-bottom:5px; }
  .sig-lbl { font-size:10px; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:14px; }
  .sig-pre { font-size:13px; color:#374151; font-weight:500; margin-bottom:4px; }
</style>
</head>
<body>

<div class="cover">
  <div class="cover-sidebar">
    <div class="cover-sidebar-logo">${input.businessName}</div>
    <hr class="sidebar-divider">
    <h4>Prepared By</h4>
    ${input.businessAddress ? `<p>${input.businessAddress}</p>` : ""}
    ${input.businessPhone ? `<p>${input.businessPhone}</p>` : ""}
    ${input.businessEmail ? `<p class="sub">${input.businessEmail}</p>` : ""}
    ${input.licenseNumber ? `<p class="sub">License: ${input.licenseNumber}</p>` : ""}
    <hr class="sidebar-divider">
    <h4>Proposal Date</h4>
    <p>${input.preparedDate}</p>
    <hr class="sidebar-divider">
    <h4>Valid Until</h4>
    <p>${input.validUntil}</p>
    ${totalCost > 0 ? `<hr class="sidebar-divider">
    <div class="sidebar-metric">
      <div class="sidebar-metric-val">$${totalCost.toLocaleString()}</div>
      <div class="sidebar-metric-lbl">Total Investment</div>
    </div>` : ""}
    ${estimatedDays ? `<div class="sidebar-metric">
      <div class="sidebar-metric-val">${estimatedDays}</div>
      <div class="sidebar-metric-lbl">Estimated Days</div>
    </div>` : ""}
  </div>
  <div class="cover-main">
    <div class="cover-label">${input.tradeType} Proposal</div>
    <div class="cover-title">${input.title}</div>
    <div class="cover-sub">Prepared for ${input.clientName}</div>
    <div class="cover-client">
      <h4>Client Information</h4>
      <p>${input.clientName}</p>
      ${input.clientAddress ? `<p class="sub">${input.clientAddress}</p>` : ""}
      ${input.clientEmail ? `<p class="sub">${input.clientEmail}</p>` : ""}
    </div>
  </div>
</div>

<div class="page-wrap">
  <div class="page-sidebar">
    <div class="page-sidebar-title">${input.businessName}</div>
    <div class="page-sidebar-sub">${input.preparedDate}</div>
    <div class="page-sidebar-toc">
      <div class="toc-item">Executive Summary</div>
      <div class="toc-item">Scope of Work</div>
      <div class="toc-item">Materials & Equipment</div>
      <div class="toc-item">Project Timeline</div>
      <div class="toc-item">Investment Summary</div>
      <div class="toc-item">Terms & Conditions</div>
    </div>
  </div>
  <div class="page-content">
    ${sections}
    ${vizHtml.costPie ? `<div class="section"><div class="section-title">Investment Breakdown</div><div class="viz-box">${vizHtml.costPie}</div></div>` : ""}
    ${vizHtml.timelineBar ? `<div class="section"><div class="section-title">Project Schedule</div><div class="viz-box">${vizHtml.timelineBar}</div></div>` : ""}
    ${vizHtml.paymentBar ? `<div class="section"><div class="section-title">Payment Schedule</div><div class="viz-box">${vizHtml.paymentBar}</div></div>` : ""}
  </div>
</div>

<div class="sig-page">
  <div class="sig-sidebar">
    <h4>Prepared By</h4>
    <p>${input.businessName}</p>
    ${totalCost > 0 ? `<hr style="border:none;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0;">
    <h4>Total Investment</h4>
    <p style="font-size:20px;font-weight:800;color:${style.accentColor};">$${totalCost.toLocaleString()}</p>` : ""}
  </div>
  <div class="sig-main">
    <div class="sig-h">Proposal Acceptance</div>
    <div class="sig-sub">Review and sign below to authorize this proposal and begin the project.</div>
    ${totalCost > 0 ? `
    <table class="inv-table">
      <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        ${laborCost > 0 ? `<tr><td>Labor</td><td style="text-align:right">$${laborCost.toLocaleString()}</td></tr>` : ""}
        ${materialsCost > 0 ? `<tr><td>Materials & Equipment</td><td style="text-align:right">$${materialsCost.toLocaleString()}</td></tr>` : ""}
        <tr class="total"><td>Total Investment</td><td style="text-align:right">$${totalCost.toLocaleString()}</td></tr>
      </tbody>
    </table>` : ""}
    <div class="sig-grid">
      <div class="sig-block">
        <h3>Client — ${input.clientName}</h3>
        <div class="sig-line"></div><div class="sig-lbl">Signature</div>
        <div class="sig-line"></div><div class="sig-lbl">Printed Name</div>
        <div class="sig-line"></div><div class="sig-lbl">Date</div>
      </div>
      <div class="sig-block">
        <h3>Contractor — ${input.businessName}</h3>
        <div class="sig-line"></div><div class="sig-lbl">Signature</div>
        <div class="sig-pre">${input.businessName}</div><div class="sig-lbl">Printed Name</div>
        <div class="sig-line"></div><div class="sig-lbl">Date</div>
      </div>
    </div>
  </div>
</div>

</body></html>`;
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export async function buildHtml(input: TemplatePdfInput): Promise<string> {
  const { style, sectionContents } = input;

  // Build sections HTML
  const sectionsHtml = SECTION_ORDER
    .map((id) => {
      const content = sectionContents[id] || "";
      if (!content.trim()) return "";
      const title = SECTION_TITLES[id] || id;
      return `<div class="section">
        <div class="section-title">${title}</div>
        <div class="section-content">${mdToHtml(content)}</div>
      </div>`;
    })
    .filter(Boolean)
    .join("\n");

  // Build visualizations
  const vizHtml = await buildVizHtml(input.fields, style);

  // Route to the correct style renderer
  switch (style.id) {
    case "classic-letterhead":
      return buildClassicLetterheadHtml(input, sectionsHtml, vizHtml);
    case "bold-dark":
      return buildBoldDarkHtml(input, sectionsHtml, vizHtml);
    case "minimal-clean":
      return buildMinimalCleanHtml(input, sectionsHtml, vizHtml);
    case "executive-sidebar":
      return buildExecutiveSidebarHtml(input, sectionsHtml, vizHtml);
    case "modern-wave":
    default:
      return buildModernWaveHtml(input, sectionsHtml, vizHtml);
  }
}

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
    // Block network requests — user-provided section content could include external URLs
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const url = req.url();
      if (url.startsWith("data:") || url.startsWith("about:")) {
        req.continue();
      } else {
        req.abort();
      }
    });
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
