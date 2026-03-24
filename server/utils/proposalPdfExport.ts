import puppeteer from "puppeteer";
import { marked } from "marked";

export interface ProposalPdfData {
  /* Business / contractor info */
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  licenseNumber: string;
  /* Client info */
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  /* Proposal metadata */
  jobTitle: string;
  preparedDate: string;
  validUntil: string;
  /* Financials */
  laborCost: number;
  materialsCost: number;
  totalCost: number;
  /* The full AI-generated proposal content (markdown) */
  proposalMarkdown: string;
  /* Optional terms override from profile */
  termsOverride?: string;
}

/* ── helpers ────────────────────────────────────────────────── */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Convert markdown to sanitised HTML.
 * Strips free-plan watermark, placeholder text, and AI-generated signature/contact blocks.
 */
function mdToHtml(md: string): string {
  if (!md) return "<p>No content available.</p>";
  let cleaned = md
    // Remove free-plan watermark
    .replace(/---\n\*This proposal was generated with ProposAI Free[\s\S]*$/m, "")
    // Remove entire "Contact Information" section (AI sometimes adds this)
    .replace(/#{1,6}\s*Contact\s*Information[\s\S]*?(?=#{1,6}\s|$)/gi, "")
    // Remove entire "Accepted By" / signature block sections
    .replace(/#{1,6}\s*(Accepted By|Acceptance)[\s\S]*?(?=#{1,6}\s|$)/gi, "")
    // Remove standalone placeholder lines like [Your Phone Number]
    .replace(/^\[Your[^\]]+\]\s*$/gm, "")
    // Remove inline placeholders
    .replace(/\[Your[^\]]+\]/g, "")
    // Remove signature lines (underscores)
    .replace(/^_{5,}\s*$/gm, "")
    // Remove "Signature: ____" style lines
    .replace(/^(Signature|Printed Name|Title|Date):\s*_{3,}\s*$/gm, "")
    // Clean up excessive blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  // Convert markdown → HTML
  const html = marked.parse(cleaned, { async: false, gfm: true, breaks: true }) as string;
  return html;
}

/* ── main export ────────────────────────────────────────────── */

/**
 * Build the HTML string for a legacy (non-template) proposal.
 * Exported so the Word exporter can reuse the same HTML for DOCX conversion.
 */
export function buildProposalHtml(data: ProposalPdfData): string {
  const biz = {
    name:    data.businessName || "Your Company",
    phone:   data.businessPhone || "",
    email:   data.businessEmail || "",
    address: data.businessAddress || "",
    license: data.licenseNumber || "",
  };
  const client = {
    name:    data.clientName || "Valued Client",
    address: data.clientAddress || "",
    phone:   data.clientPhone || "",
    email:   data.clientEmail || "",
  };
  const jobTitle     = data.jobTitle || "Project Proposal";
  const preparedDate = data.preparedDate || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const validUntil   = data.validUntil || new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const laborCost     = Math.max(0, data.laborCost || 0);
  const materialsCost = Math.max(0, data.materialsCost || 0);
  const totalCost     = Math.max(1, data.totalCost || 5000);
  const laborPct      = totalCost > 0 ? Math.round((laborCost / totalCost) * 100) : 50;
  const matPct        = 100 - laborPct;
  const deposit       = fmt(totalCost * 0.5);

  const licLine = biz.license ? " &middot; Lic# " + esc(biz.license) : "";

  const proposalBodyHtml = mdToHtml(data.proposalMarkdown);
  const termsHtml = data.termsOverride
    ? "<p>" + esc(data.termsOverride).replace(/\n/g, "<br>") + "</p>"
    : "";

  // Delegate to the shared HTML builder
  return _buildLegacyHtml({ biz, client, jobTitle, preparedDate, validUntil, laborCost, materialsCost, totalCost, laborPct, matPct, deposit, licLine, proposalBodyHtml, termsHtml });
}

/**
 * Render a raw HTML string directly to PDF using Puppeteer.
 * Used when Claude generates the full HTML document.
 */
export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    // Give SVG charts and fonts time to render
    await new Promise((r) => setTimeout(r, 2500));

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "0.6in", right: "0.4in", bottom: "0.6in", left: "0.4in" },
      printBackground: true,
      preferCSSPageSize: false,
    }) as Buffer;

    return Buffer.from(pdfBuffer as Uint8Array);
  } finally {
    await browser.close();
  }
}

export async function generateProposalPdf(data: ProposalPdfData): Promise<Buffer> {
  const html = buildProposalHtml(data);

  /* ── render with Puppeteer ─────────────────────────────── */
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 2500));

    const pdfBuffer = await page.pdf({
      format: "Letter",
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      printBackground: true,
      preferCSSPageSize: false,
    }) as Buffer;

    return Buffer.from(pdfBuffer as Uint8Array);
  } finally {
    await browser.close();
  }
}

// Internal helper — builds the full HTML string for legacy proposals
function _buildLegacyHtml(p: {
  biz: { name: string; phone: string; email: string; address: string; license: string };
  client: { name: string; address: string; phone: string; email: string };
  jobTitle: string; preparedDate: string; validUntil: string;
  laborCost: number; materialsCost: number; totalCost: number;
  laborPct: number; matPct: number; deposit: string;
  licLine: string; proposalBodyHtml: string; termsHtml: string;
}): string {
  const { biz, client, jobTitle, preparedDate, validUntil, laborCost, materialsCost, totalCost, laborPct, matPct, deposit, licLine, proposalBodyHtml, termsHtml } = p;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(jobTitle)}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;color:#1e293b;background:#fff;font-size:10px;line-height:1.6;-webkit-font-smoothing:antialiased}

/* ═══════════════════════════════════════════════════════
   COVER PAGE
   ═══════════════════════════════════════════════════════ */
.cover-page{width:8.5in;min-height:11in;margin:0 auto;background:#fff;page-break-after:always;position:relative;overflow:hidden;display:flex;flex-direction:column}

.cover-header{
  background:linear-gradient(135deg,#0c1e33 0%,#1a3a5c 40%,#1e5a9e 100%);
  color:#fff;padding:0.6in 0.7in 0.45in;position:relative;overflow:hidden
}
.cover-header::after{
  content:"";position:absolute;bottom:0;left:0;right:0;height:4px;
  background:linear-gradient(90deg,#3b82f6,#60a5fa,#93c5fd)
}
.cover-company{font-size:26px;font-weight:800;letter-spacing:-0.5px;margin-bottom:2px}
.cover-tagline{font-size:10px;opacity:0.7;font-weight:400;letter-spacing:0.3px}

.cover-body{flex:1;padding:0.4in 0.7in 0.3in;display:flex;flex-direction:column}

.cover-title{font-size:28px;font-weight:800;color:#0c1e33;line-height:1.15;margin-bottom:0.06in;letter-spacing:-0.5px}
.cover-subtitle{font-size:11px;color:#64748b;font-weight:400;margin-bottom:0.3in}

.cover-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.14in;margin-bottom:0.3in}
.info-card{background:#f8fafc;border-left:3px solid #3b82f6;padding:0.14in 0.18in;border-radius:0 4px 4px 0}
.info-label{font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#3b82f6;margin-bottom:3px}
.info-value{font-size:9.5px;color:#1e293b;font-weight:500;line-height:1.5}

.highlights{display:grid;grid-template-columns:repeat(3,1fr);gap:0.12in;margin-bottom:0.3in}
.highlight-card{background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:6px;padding:0.14in;text-align:center}
.hl-icon{width:30px;height:30px;margin:0 auto 5px;background:#3b82f6;border-radius:50%;display:flex;align-items:center;justify-content:center}
.hl-icon svg{width:15px;height:15px;fill:#fff}
.highlight-title{font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#1e40af;margin-bottom:2px}
.highlight-value{font-size:11px;font-weight:700;color:#0c1e33}

.cover-trust{margin-top:auto;background:linear-gradient(180deg,#fff 0%,#f8fafc 40%,#eff6ff 100%);padding:0.2in 0;position:relative}
.cover-trust::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#e2e8f0,transparent)}
.trust-title{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#3b82f6;margin-bottom:10px;text-align:center}
.trust-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0.1in}
.trust-item{text-align:center;padding:0.08in}
.trust-icon{font-size:18px;margin-bottom:3px;color:#1e40af}
.trust-label{font-size:7.5px;font-weight:600;color:#334155;line-height:1.3}

.cover-footer{background:#f8fafc;padding:0.14in 0.7in;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0}
.cover-footer-left{font-size:8px;color:#64748b;line-height:1.5}
.cover-footer-right{font-size:7.5px;color:#94a3b8}

/* ═══════════════════════════════════════════════════════
   CONTENT PAGES — AI-generated proposal body
   ═══════════════════════════════════════════════════════ */
.content-page{width:8.5in;min-height:11in;margin:0 auto;background:#fff;padding:0.5in 0.65in 0.7in;position:relative}

.pg-header{display:flex;justify-content:space-between;align-items:center;padding-bottom:0.08in;border-bottom:2px solid #0c1e33;margin-bottom:0.25in}
.pg-header-co{font-size:11px;font-weight:700;color:#0c1e33}
.pg-header-title{font-size:8.5px;color:#64748b;font-weight:500}

/* Markdown-rendered proposal content */
.proposal-body h1{font-size:18px;font-weight:800;color:#0c1e33;margin:0.25in 0 0.1in;padding-bottom:0.06in;border-bottom:2px solid #3b82f6}
.proposal-body h2{font-size:14px;font-weight:700;color:#0c1e33;margin:0.22in 0 0.08in;padding-bottom:0.04in;border-bottom:1px solid #e2e8f0}
.proposal-body h3{font-size:12px;font-weight:700;color:#1e40af;margin:0.18in 0 0.06in}
.proposal-body h4{font-size:10.5px;font-weight:700;color:#334155;margin:0.14in 0 0.05in}
.proposal-body h5,.proposal-body h6{font-size:10px;font-weight:600;color:#475569;margin:0.1in 0 0.04in}

.proposal-body p{font-size:9.5px;line-height:1.7;color:#334155;margin-bottom:0.08in}

.proposal-body ul,.proposal-body ol{margin:0.06in 0 0.1in 0.2in;padding:0}
.proposal-body li{font-size:9.5px;line-height:1.65;color:#334155;margin-bottom:3px}
.proposal-body ul li{list-style-type:disc}
.proposal-body ol li{list-style-type:decimal}
.proposal-body li::marker{color:#3b82f6;font-weight:600}

.proposal-body table{width:100%;border-collapse:collapse;margin:0.1in 0 0.14in;font-size:9px}
.proposal-body th{background:#0c1e33;color:#fff;font-size:8px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;padding:6px 10px;text-align:left}
.proposal-body td{padding:5px 10px;border-bottom:1px solid #f1f5f9;vertical-align:top;line-height:1.5}
.proposal-body tr:nth-child(even) td{background:#f8fafc}

.proposal-body strong{font-weight:700;color:#1e293b}
.proposal-body em{font-style:italic;color:#475569}

.proposal-body blockquote{border-left:3px solid #3b82f6;background:#f8fafc;padding:0.08in 0.14in;margin:0.08in 0 0.12in;border-radius:0 4px 4px 0}
.proposal-body blockquote p{color:#475569;font-size:9px;margin-bottom:0}

.proposal-body hr{border:none;border-top:1px solid #e2e8f0;margin:0.2in 0}

.proposal-body code{font-family:'Courier New',monospace;background:#f1f5f9;padding:1px 4px;border-radius:3px;font-size:8.5px}

/* ═══════════════════════════════════════════════════════
   INVESTMENT & SIGNATURES PAGE
   ═══════════════════════════════════════════════════════ */
.finance-section{margin-top:0.3in;page-break-before:always;padding-top:0.3in}
.finance-section .pg-header{margin-bottom:0.2in}

.sec-head{font-size:13px;font-weight:700;color:#0c1e33;margin-bottom:0.08in;padding-bottom:0.05in;border-bottom:2px solid #3b82f6;display:flex;align-items:center;gap:6px}
.sec-num{width:20px;height:20px;background:#3b82f6;color:#fff;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}

.invest-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.14in;margin-top:0.06in}
.invest-left{display:flex;flex-direction:column;gap:0.1in}
.price-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:0.12in 0.16in}
.price-label{font-size:7.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;margin-bottom:3px}
.price-val{font-size:18px;font-weight:800;color:#1e40af}
.total-card{background:linear-gradient(135deg,#0c1e33,#1e5a9e);color:#fff;border-radius:6px;padding:0.14in 0.18in}
.total-card .price-label{color:rgba(255,255,255,0.7);font-size:8px}
.total-card .price-val{color:#fff;font-size:26px;margin-top:3px}

.chart-box{background:#fff;border-radius:6px;padding:0.14in;border:1px solid #e2e8f0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.chart-heading{font-size:10px;font-weight:700;color:#0c1e33;margin-bottom:8px}
.chart-canvas{width:190px;height:190px}

.pay-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.1in;margin:0.12in 0}
.pay-card{border:1px solid #e2e8f0;border-radius:5px;padding:0.1in;text-align:center}
.pay-card-title{font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;margin-bottom:2px}
.pay-card-amount{font-size:14px;font-weight:700;color:#0c1e33}
.pay-card-note{font-size:7.5px;color:#94a3b8;margin-top:2px}

.terms-section{margin-top:0.15in}
.terms-text{font-size:8.5px;line-height:1.55;color:#475569}

.warranty-box{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;border-radius:6px;padding:0.12in 0.16in;margin:0.12in 0}
.warranty-title{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#166534;margin-bottom:3px;display:flex;align-items:center;gap:4px}
.warranty-text{font-size:8.5px;color:#15803d;line-height:1.5}

.sig-section{margin-top:0.25in;padding-top:0.2in}
.sig-row{display:grid;grid-template-columns:1fr 1fr;gap:0.5in}
.sig-block{text-align:center}
.sig-line{border-top:1.5px solid #1e293b;margin-bottom:4px;margin-top:32px}
.sig-label{font-size:8px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px}
.sig-date{font-size:7px;color:#94a3b8;margin-top:2px}

.thank-you{background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:6px;padding:0.12in 0.16in;text-align:center;margin-top:0.15in}
.thank-you-title{font-size:11px;font-weight:700;color:#1e40af;margin-bottom:3px}
.thank-you-text{font-size:8.5px;color:#3b82f6}

.pg-footer{position:absolute;bottom:0;left:0;right:0;padding:0.1in 0.65in;display:flex;justify-content:space-between;font-size:7.5px;color:#94a3b8;border-top:1px solid #f1f5f9;background:#fff}

@media print{body{background:#fff}}
@page{margin:0;size:letter}
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════════════
     PAGE 1 – COVER
     ═══════════════════════════════════════════════════════════ -->
<div class="cover-page">
  <div class="cover-header">
    <div class="cover-company">${esc(biz.name)}</div>
    <div class="cover-tagline">Licensed &amp; Insured Contractor${licLine}</div>
  </div>

  <div class="cover-body">
    <div class="cover-title">${esc(jobTitle)}</div>
    <div class="cover-subtitle">Prepared for ${esc(client.name)} &middot; ${esc(preparedDate)}</div>

    <div class="cover-grid">
      <div class="info-card">
        <div class="info-label">Client</div>
        <div class="info-value">${esc(client.name)}${client.address ? "<br>" + esc(client.address) : ""}${client.phone ? "<br>" + esc(client.phone) : ""}${client.email ? "<br>" + esc(client.email) : ""}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Prepared By</div>
        <div class="info-value">${esc(biz.name)}${biz.phone ? "<br>" + esc(biz.phone) : ""}${biz.email ? "<br>" + esc(biz.email) : ""}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Job Site</div>
        <div class="info-value">${esc(client.address || "As specified")}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Proposal Valid Until</div>
        <div class="info-value">${esc(validUntil)}</div>
      </div>
    </div>

    <div class="highlights">
      <div class="highlight-card">
        <div class="hl-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.94s4.18 1.36 4.18 3.85c0 1.89-1.44 2.98-3.12 3.19z"/></svg></div>
        <div class="highlight-title">Total Investment</div>
        <div class="highlight-value">$${fmt(totalCost)}</div>
      </div>
      <div class="highlight-card">
        <div class="hl-icon"><svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg></div>
        <div class="highlight-title">Proposal</div>
        <div class="highlight-value">Custom Scope</div>
      </div>
      <div class="highlight-card">
        <div class="hl-icon"><svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg></div>
        <div class="highlight-title">Valid Through</div>
        <div class="highlight-value">${esc(validUntil)}</div>
      </div>
    </div>

    <div class="cover-trust">
      <div class="trust-title">Our Commitment to You</div>
      <div class="trust-grid">
        <div class="trust-item">
          <div class="trust-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="#1e40af"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg></div>
          <div class="trust-label">Licensed &amp;<br>Insured</div>
        </div>
        <div class="trust-item">
          <div class="trust-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="#1e40af"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></div>
          <div class="trust-label">5-Star<br>Rated</div>
        </div>
        <div class="trust-item">
          <div class="trust-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="#1e40af"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>
          <div class="trust-label">Satisfaction<br>Guaranteed</div>
        </div>
        <div class="trust-item">
          <div class="trust-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="#1e40af"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg></div>
          <div class="trust-label">Warranty<br>Included</div>
        </div>
      </div>
    </div>
  </div>

  <div class="cover-footer">
    <div class="cover-footer-left">${esc(biz.name)}${biz.address ? " &middot; " + esc(biz.address) : ""}${biz.phone ? "<br>" + esc(biz.phone) : ""}${biz.email ? " &middot; " + esc(biz.email) : ""}</div>
    <div class="cover-footer-right">Confidential</div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════
     CONTENT PAGES — Full AI-Generated Proposal
     ═══════════════════════════════════════════════════════════ -->
<div class="content-page">
  <div class="pg-header">
    <div class="pg-header-co">${esc(biz.name)}</div>
    <div class="pg-header-title">${esc(jobTitle)}</div>
  </div>

  <div class="proposal-body">
    ${proposalBodyHtml}
  </div>

  ${termsHtml ? '<div class="terms-section"><h3 style="font-size:12px;font-weight:700;color:#1e40af;margin:0.18in 0 0.06in;">Additional Terms &amp; Conditions</h3><div class="terms-text">' + termsHtml + '</div></div>' : ''}
</div>

<!-- ═══════════════════════════════════════════════════════════
     FINAL PAGE — INVESTMENT SUMMARY + SIGNATURES
     ═══════════════════════════════════════════════════════════ -->
<div class="content-page" style="page-break-before:always">
  <div class="pg-header">
    <div class="pg-header-co">${esc(biz.name)}</div>
    <div class="pg-header-title">${esc(jobTitle)}</div>
  </div>

  <div style="margin-top:0.1in">
    <div class="sec-head"><div class="sec-num">$</div> Investment Summary</div>
    <div class="invest-grid">
      <div class="invest-left">
        <div class="price-card">
          <div class="price-label">Labor</div>
          <div class="price-val">$${fmt(laborCost)}</div>
        </div>
        <div class="price-card">
          <div class="price-label">Materials</div>
          <div class="price-val">$${fmt(materialsCost)}</div>
        </div>
        <div class="total-card">
          <div class="price-label">Total Project Investment</div>
          <div class="price-val">$${fmt(totalCost)}</div>
        </div>
      </div>
      <div class="chart-box">
        <div class="chart-heading">Cost Breakdown</div>
        <div class="chart-canvas"><canvas id="costChart"></canvas></div>
      </div>
    </div>
  </div>

  <div style="margin-top:0.18in">
    <div class="sec-head"><div class="sec-num">&#9776;</div> Payment Schedule</div>
    <div class="pay-grid">
      <div class="pay-card">
        <div class="pay-card-title">Deposit (50%)</div>
        <div class="pay-card-amount">$${deposit}</div>
        <div class="pay-card-note">Due upon acceptance</div>
      </div>
      <div class="pay-card">
        <div class="pay-card-title">Balance (50%)</div>
        <div class="pay-card-amount">$${deposit}</div>
        <div class="pay-card-note">Due upon completion</div>
      </div>
    </div>
  </div>

  <div class="warranty-box">
    <div class="warranty-title">&#10003; Warranty &amp; Guarantee</div>
    <div class="warranty-text">All work is guaranteed to meet or exceed local building codes and manufacturer specifications. We stand behind our workmanship and materials with comprehensive warranty coverage.</div>
  </div>

  <div class="thank-you">
    <div class="thank-you-title">Thank You for Considering ${esc(biz.name)}</div>
    <div class="thank-you-text">We look forward to working with you. Please don't hesitate to reach out with any questions.</div>
  </div>

  <div class="sig-section">
    <div class="sig-row">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Client Signature</div>
        <div class="sig-date">Date: _______________</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Contractor Signature</div>
        <div class="sig-date">Date: _______________</div>
      </div>
    </div>
  </div>

  <div class="pg-footer">
    <div>${esc(biz.name)}${biz.address ? " &middot; " + esc(biz.address) : ""}</div>
    <div>Confidential</div>
  </div>
</div>

<script>
setTimeout(()=>{
  const ctx=document.getElementById('costChart');
  if(!ctx)return;
  new Chart(ctx,{
    type:'doughnut',
    data:{
      labels:['Labor (${laborPct}%)','Materials (${matPct}%)'],
      datasets:[{
        data:[${laborPct},${matPct}],
        backgroundColor:['#3b82f6','#f97316'],
        borderColor:['#2563eb','#ea580c'],
        borderWidth:2,
        borderRadius:4,
        hoverOffset:8
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:true,
      cutout:'45%',
      plugins:{
        legend:{position:'bottom',labels:{font:{size:9,weight:'600',family:'Inter'},padding:12,usePointStyle:true,pointStyle:'circle'}},
        tooltip:{backgroundColor:'rgba(12,30,51,0.92)',padding:10,titleFont:{size:10,weight:'700'},bodyFont:{size:9},cornerRadius:4}
      }
    }
  });
},600);
<\/script>
</body>
</html>`;
  return html;
}
