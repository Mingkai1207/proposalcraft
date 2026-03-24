import puppeteer from "puppeteer";

export interface ProposalPdfData {
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  licenseNumber: string;
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  jobTitle: string;
  preparedDate: string;
  validUntil: string;
  jobSite: string;
  jobDetails: string;
  projectDetails: string;
  executiveSummary: string;
  scopeOfWork: string[];
  materials: string[];
  timeline: string[];
  whyChooseUs: string;
  termsAndConditions: string;
  laborCost: number;
  materialsCost: number;
  totalCost: number;
}

/* ── helpers ────────────────────────────────────────────────── */

function clean(text: string | undefined | null): string {
  if (!text) return "";
  let s = String(text);
  s = s.replace(/^#{1,6}\s+/gm, "");
  s = s.replace(/\*{1,3}(.+?)\*{1,3}/g, "$1");
  s = s.replace(/_{1,3}(.+?)_{1,3}/g, "$1");
  s = s.replace(/```[\s\S]*?```/g, "");
  s = s.replace(/`(.+?)`/g, "$1");
  s = s.replace(/<[^>]*>/g, "");
  s = s.replace(/!\[.*?\]\(.*?\)/g, "");
  s = s.replace(/\[(.+?)\]\(.*?\)/g, "$1");
  s = s.replace(/^[\s]*[-*+•]\s+/gm, "");
  s = s.replace(/^[\s]*\d+[.)]\s+/gm, "");
  s = s.replace(/^>\s+/gm, "");
  s = s.replace(/^[\s]*[-*_]{3,}[\s]*$/gm, "");
  s = s.replace(/[ \t]{2,}/g, " ");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

function cleanArr(items: string[] | undefined | null, max = 12): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((i) => clean(i))
    .filter((i) => i.length > 2)
    .slice(0, max);
}

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

/* ── main export ────────────────────────────────────────────── */

export async function generateProposalPdf(data: ProposalPdfData): Promise<Buffer> {
  const d = {
    businessName:    clean(data.businessName) || "Your Company",
    businessPhone:   clean(data.businessPhone) || "(555) 000-0000",
    businessEmail:   clean(data.businessEmail) || "info@company.com",
    businessAddress: clean(data.businessAddress) || "123 Main St, City, ST 12345",
    licenseNumber:   clean(data.licenseNumber) || "",
    clientName:      clean(data.clientName) || "Valued Client",
    clientAddress:   clean(data.clientAddress) || "",
    clientPhone:     clean(data.clientPhone) || "",
    clientEmail:     clean(data.clientEmail) || "",
    jobTitle:        clean(data.jobTitle) || "Project Proposal",
    preparedDate:    clean(data.preparedDate) || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    validUntil:      clean(data.validUntil) || new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    jobSite:         clean(data.jobSite) || "",
    executiveSummary: clean(data.executiveSummary) || "We are pleased to present this proposal for your project.",
    scopeOfWork:     cleanArr(data.scopeOfWork),
    materials:       cleanArr(data.materials),
    timeline:        cleanArr(data.timeline, 6),
    whyChooseUs:     clean(data.whyChooseUs) || "",
    termsAndConditions: clean(data.termsAndConditions) || "50% deposit required upon acceptance. Balance due upon completion. This proposal is valid for 30 days.",
    laborCost:       Math.max(0, data.laborCost || 0),
    materialsCost:   Math.max(0, data.materialsCost || 0),
    totalCost:       Math.max(1, data.totalCost || 5000),
  };

  if (d.scopeOfWork.length === 0) d.scopeOfWork = ["Complete project assessment and planning", "Professional installation per industry standards", "Final inspection and quality assurance", "Site cleanup and walkthrough"];
  if (d.materials.length === 0) d.materials = ["Premium-grade materials as specified", "All necessary hardware and fasteners", "Manufacturer-warranted components"];
  if (d.timeline.length === 0) d.timeline = ["Day 1: Site preparation and mobilization", "Day 2: Primary installation work", "Day 3: Testing, inspection, and cleanup"];

  const laborPct  = d.totalCost > 0 ? Math.round((d.laborCost / d.totalCost) * 100) : 50;
  const matPct    = 100 - laborPct;
  const licLine   = d.licenseNumber ? ` · Lic# ${esc(d.licenseNumber)}` : "";
  const deposit   = fmt(d.totalCost * 0.5);

  // Build scope quick-list for cover page (first 4 items, abbreviated)
  const quickScope = d.scopeOfWork.slice(0, 5).map(item => {
    // Take first ~60 chars or first sentence
    const short = item.length > 65 ? item.substring(0, 62).replace(/\s+\S*$/, "") + "..." : item;
    // Extract just the title part if there's a colon
    const colonIdx = short.indexOf(":");
    return colonIdx > 0 && colonIdx < 45 ? short.substring(0, colonIdx) : short;
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(d.jobTitle)}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;color:#1e293b;background:#fff;font-size:9.5px;line-height:1.5;-webkit-font-smoothing:antialiased}

.page{width:8.5in;height:11in;margin:0 auto;padding:0;background:#fff;page-break-after:always;position:relative;overflow:hidden}

/* ═══════════════════════════════════════════════════════
   COVER PAGE
   ═══════════════════════════════════════════════════════ */
.cover{display:flex;flex-direction:column;height:11in}

.cover-header{
  background:linear-gradient(135deg,#0c1e33 0%,#1a3a5c 40%,#1e5a9e 100%);
  color:#fff;padding:0.55in 0.7in 0.4in;position:relative;overflow:hidden
}
.cover-header::before{
  content:'';position:absolute;top:-60%;right:-20%;width:70%;height:200%;
  background:radial-gradient(ellipse,rgba(59,130,246,0.15) 0%,transparent 70%);
  pointer-events:none
}
.cover-header::after{
  content:'';position:absolute;bottom:0;left:0;right:0;height:4px;
  background:linear-gradient(90deg,#3b82f6,#60a5fa,#93c5fd)
}
.cover-company{font-size:24px;font-weight:800;letter-spacing:-0.5px;margin-bottom:2px}
.cover-tagline{font-size:9.5px;opacity:0.7;font-weight:400;letter-spacing:0.3px}

.cover-body{flex:1;display:flex;flex-direction:column;padding:0.35in 0.7in 0}

.cover-title{font-size:26px;font-weight:800;color:#0c1e33;line-height:1.15;margin-bottom:0.04in;letter-spacing:-0.5px}
.cover-subtitle{font-size:10.5px;color:#64748b;font-weight:400;margin-bottom:0.25in}

.cover-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.12in;margin-bottom:0.2in}
.info-card{background:#f8fafc;border-left:3px solid #3b82f6;padding:0.12in 0.16in;border-radius:0 4px 4px 0}
.info-label{font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#3b82f6;margin-bottom:2px}
.info-value{font-size:9px;color:#1e293b;font-weight:500;line-height:1.45}

/* Highlights strip */
.highlights{display:grid;grid-template-columns:repeat(3,1fr);gap:0.1in;margin-bottom:0.2in}
.highlight-card{background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:6px;padding:0.12in;text-align:center}
.hl-icon{width:28px;height:28px;margin:0 auto 4px;background:#3b82f6;border-radius:50%;display:flex;align-items:center;justify-content:center}
.hl-icon svg{width:14px;height:14px;fill:#fff}
.highlight-title{font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#1e40af;margin-bottom:1px}
.highlight-value{font-size:10.5px;font-weight:700;color:#0c1e33}

/* Quick summary on cover */
.cover-summary{background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:0.15in 0.18in;margin-bottom:0.15in}
.cover-summary-title{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#3b82f6;margin-bottom:5px}
.cover-summary-text{font-size:9px;color:#475569;line-height:1.6}

/* What's included quick list */
.cover-included{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;border-radius:6px;padding:0.14in 0.18in;margin-bottom:0.15in}

/* Cover trust section */
.cover-trust{flex:1;background:linear-gradient(180deg,#fff 0%,#f8fafc 40%,#eff6ff 100%);padding:0.18in 0.7in;position:relative;display:flex;flex-direction:column;justify-content:center}
.cover-trust::before{content:'';position:absolute;top:0;left:0.7in;right:0.7in;height:1px;background:linear-gradient(90deg,transparent,#e2e8f0,transparent)}
.trust-title{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#3b82f6;margin-bottom:8px;text-align:center}
.trust-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0.1in}
.trust-item{text-align:center;padding:0.08in}
.trust-icon{font-size:18px;margin-bottom:3px;color:#1e40af}
.trust-label{font-size:7.5px;font-weight:600;color:#334155;line-height:1.3}
.cover-included-title{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#166534;margin-bottom:6px}
.cover-included-list{display:grid;grid-template-columns:1fr 1fr;gap:3px 12px}
.cover-included-item{font-size:8.5px;color:#15803d;display:flex;align-items:flex-start;gap:5px;line-height:1.4}
.cover-included-item::before{content:'✓';font-weight:700;color:#16a34a;flex-shrink:0;margin-top:0px}

.cover-footer{background:#f8fafc;padding:0.14in 0.7in;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0}
.cover-footer-left{font-size:8px;color:#64748b;line-height:1.5}
.cover-footer-right{font-size:7.5px;color:#94a3b8}

/* ═══════════════════════════════════════════════════════
   CONTENT PAGES
   ═══════════════════════════════════════════════════════ */
.content{padding:0.4in 0.55in 0.5in;position:relative}

.pg-header{display:flex;justify-content:space-between;align-items:center;padding-bottom:0.06in;border-bottom:2px solid #0c1e33;margin-bottom:0.18in}
.pg-header-co{font-size:10.5px;font-weight:700;color:#0c1e33}
.pg-header-title{font-size:8px;color:#64748b;font-weight:500}

.sec{margin-bottom:0.16in}
.sec-head{font-size:12px;font-weight:700;color:#0c1e33;margin-bottom:0.06in;padding-bottom:0.04in;border-bottom:2px solid #3b82f6;display:flex;align-items:center;gap:6px}
.sec-num{width:18px;height:18px;background:#3b82f6;color:#fff;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0}

.body-text{font-size:9px;line-height:1.6;color:#334155}

/* Tables */
.data-table{width:100%;border-collapse:separate;border-spacing:0;margin-top:0.04in;border-radius:4px;overflow:hidden;border:1px solid #e2e8f0}
.data-table th{background:#0c1e33;color:#fff;font-size:7.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;padding:5px 8px;text-align:left}
.data-table td{padding:5px 8px;font-size:8.5px;border-bottom:1px solid #f1f5f9;vertical-align:top;line-height:1.45}
.data-table tr:nth-child(even) td{background:#f8fafc}
.data-table tr:last-child td{border-bottom:none}
.row-num{color:#3b82f6;font-weight:700;width:24px;text-align:center}
.row-bullet{color:#3b82f6;font-weight:700;width:18px;text-align:center;font-size:6px}

/* Timeline */
.tl-wrap{margin-top:0.04in}
.tl-item{display:flex;gap:8px;margin-bottom:4px;position:relative}
.tl-dot{width:7px;height:7px;background:#3b82f6;border-radius:50%;margin-top:3px;flex-shrink:0;position:relative;z-index:1}
.tl-item:not(:last-child) .tl-dot::after{content:'';position:absolute;top:7px;left:2.5px;width:2px;height:calc(100% + 4px);background:#dbeafe}
.tl-text{font-size:9px;color:#334155;line-height:1.45}

/* Why Choose Us */
.wcu-box{background:linear-gradient(135deg,#fefce8,#fef9c3);border:1px solid #fde68a;border-radius:6px;padding:0.1in 0.14in;margin-top:0.04in}
.wcu-text{font-size:8.5px;color:#713f12;line-height:1.55}

/* Important note box */
.note-box{background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:6px;padding:0.12in 0.16in;margin-top:0.04in}
.note-title{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#1e40af;margin-bottom:4px;display:flex;align-items:center;gap:4px}
.note-text{font-size:8.5px;color:#1e3a5f;line-height:1.55}
.note-list{margin-top:4px;display:grid;grid-template-columns:1fr 1fr;gap:2px 12px}
.note-list-item{font-size:8px;color:#1e3a5f;display:flex;align-items:center;gap:4px}
.note-list-item::before{content:'';font-size:4px;color:#3b82f6;width:4px;height:4px;background:#3b82f6;border-radius:50%;flex-shrink:0}

/* Investment */
.invest-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.12in;margin-top:0.04in}
.invest-left{display:flex;flex-direction:column;gap:0.08in}
.price-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:0.1in 0.14in}
.price-label{font-size:7px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;margin-bottom:2px}
.price-val{font-size:17px;font-weight:800;color:#1e40af}
.total-card{background:linear-gradient(135deg,#0c1e33,#1e5a9e);color:#fff;border-radius:6px;padding:0.12in 0.16in}
.total-card .price-label{color:rgba(255,255,255,0.7);font-size:7.5px}
.total-card .price-val{color:#fff;font-size:24px;margin-top:2px}

/* Chart */
.chart-box{background:#fff;border-radius:6px;padding:0.12in;border:1px solid #e2e8f0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.chart-heading{font-size:9.5px;font-weight:700;color:#0c1e33;margin-bottom:6px}
.chart-canvas{width:180px;height:180px}

/* Payment schedule */
.pay-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.08in;margin-top:0.04in;margin-bottom:0.1in}
.pay-card{border:1px solid #e2e8f0;border-radius:5px;padding:0.08in;text-align:center}
.pay-card-title{font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;margin-bottom:1px}
.pay-card-amount{font-size:13px;font-weight:700;color:#0c1e33}
.pay-card-note{font-size:7px;color:#94a3b8;margin-top:1px}

.terms-text{font-size:8px;line-height:1.5;color:#475569}

/* Warranty box */
.warranty-box{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;border-radius:6px;padding:0.1in 0.14in;margin-bottom:0.1in}
.warranty-title{font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#166534;margin-bottom:2px;display:flex;align-items:center;gap:4px}
.warranty-text{font-size:8px;color:#15803d;line-height:1.45}

/* Signatures */
.sig-section{margin-top:0.18in;padding-top:0.15in}
.sig-row{display:grid;grid-template-columns:1fr 1fr;gap:0.4in}
.sig-block{text-align:center}
.sig-line{border-top:1.5px solid #1e293b;margin-bottom:3px;margin-top:28px}
.sig-label{font-size:7.5px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px}
.sig-date{font-size:6.5px;color:#94a3b8;margin-top:1px}

/* Thank you banner */
.thank-you{background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:6px;padding:0.1in 0.14in;text-align:center;margin-top:0.12in}
.thank-you-title{font-size:10px;font-weight:700;color:#1e40af;margin-bottom:2px}
.thank-you-text{font-size:8px;color:#3b82f6}

/* Footer */
.pg-footer{position:absolute;bottom:0;left:0;right:0;padding:0.08in 0.55in;display:flex;justify-content:space-between;font-size:7px;color:#94a3b8;border-top:1px solid #f1f5f9;background:#fff}

/* Page 3 layout */
.page3-inner{padding-bottom:0.3in}

@media print{body{background:#fff}.page{margin:0;box-shadow:none}}
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════════════
     PAGE 1 – COVER
     ═══════════════════════════════════════════════════════════ -->
<div class="page cover">
  <div class="cover-header">
    <div class="cover-company">${esc(d.businessName)}</div>
    <div class="cover-tagline">Licensed &amp; Insured Contractor${licLine}</div>
  </div>

  <div class="cover-body">
    <div class="cover-title">${esc(d.jobTitle)}</div>
    <div class="cover-subtitle">Prepared for ${esc(d.clientName)} · ${esc(d.preparedDate)}</div>

    <div class="cover-grid">
      <div class="info-card">
        <div class="info-label">Client</div>
        <div class="info-value">${esc(d.clientName)}${d.clientAddress ? "<br>" + esc(d.clientAddress) : ""}${d.clientPhone ? "<br>" + esc(d.clientPhone) : ""}${d.clientEmail ? "<br>" + esc(d.clientEmail) : ""}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Job Site</div>
        <div class="info-value">${esc(d.jobSite || d.clientAddress || "As specified")}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Prepared By</div>
        <div class="info-value">${esc(d.businessName)}<br>${esc(d.businessPhone)}<br>${esc(d.businessEmail)}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Proposal Valid Until</div>
        <div class="info-value">${esc(d.validUntil)}</div>
      </div>
    </div>

    <div class="highlights">
      <div class="highlight-card">
        <div class="hl-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.94s4.18 1.36 4.18 3.85c0 1.89-1.44 2.98-3.12 3.19z"/></svg></div>
        <div class="highlight-title">Total Investment</div>
        <div class="highlight-value">$${fmt(d.totalCost)}</div>
      </div>
      <div class="highlight-card">
        <div class="hl-icon"><svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg></div>
        <div class="highlight-title">Scope Items</div>
        <div class="highlight-value">${d.scopeOfWork.length} Services</div>
      </div>
      <div class="highlight-card">
        <div class="hl-icon"><svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg></div>
        <div class="highlight-title">Timeline</div>
        <div class="highlight-value">${d.timeline.length} Phase${d.timeline.length > 1 ? "s" : ""}</div>
      </div>
    </div>

    <div class="cover-summary">
      <div class="cover-summary-title">Project Overview</div>
      <div class="cover-summary-text">${esc(d.executiveSummary)}</div>
    </div>

    <div class="cover-included">
      <div class="cover-included-title">What's Included</div>
      <div class="cover-included-list">
        ${quickScope.map(item => `<div class="cover-included-item">${esc(item)}</div>`).join("")}
        ${d.materials.length > 0 ? `<div class="cover-included-item">All materials &amp; equipment</div>` : ""}
        <div class="cover-included-item">Warranty &amp; guarantee</div>
        <div class="cover-included-item">Site cleanup &amp; walkthrough</div>
      </div>
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

  <div class="cover-footer">
    <div class="cover-footer-left">${esc(d.businessName)} · ${esc(d.businessAddress)}<br>${esc(d.businessPhone)} · ${esc(d.businessEmail)}</div>
    <div class="cover-footer-right">Page 1 of 3</div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════
     PAGE 2 – SCOPE OF WORK + MATERIALS + TIMELINE
     ═══════════════════════════════════════════════════════════ -->
<div class="page content">
  <div class="pg-header">
    <div class="pg-header-co">${esc(d.businessName)}</div>
    <div class="pg-header-title">${esc(d.jobTitle)}</div>
  </div>

  <div class="sec">
    <div class="sec-head"><div class="sec-num">1</div> Scope of Work</div>
    <table class="data-table">
      <thead><tr><th style="width:24px">#</th><th>Description</th></tr></thead>
      <tbody>
        ${d.scopeOfWork.map((item, i) => `<tr><td class="row-num">${i + 1}</td><td>${esc(item)}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>

  <div class="sec">
    <div class="sec-head"><div class="sec-num">2</div> Materials &amp; Equipment</div>
    <table class="data-table">
      <thead><tr><th style="width:18px"></th><th>Item</th></tr></thead>
      <tbody>
        ${d.materials.map((item) => `<tr><td class="row-bullet">●</td><td>${esc(item)}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>

  <div class="sec">
    <div class="sec-head"><div class="sec-num">3</div> Project Timeline</div>
    <div class="tl-wrap">
      ${d.timeline.map((item) => `<div class="tl-item"><div class="tl-dot"></div><div class="tl-text">${esc(item)}</div></div>`).join("")}
    </div>
  </div>

  ${d.whyChooseUs ? `
  <div class="sec">
    <div class="sec-head"><div class="sec-num" style="font-size:11px">★</div> Why Choose Us</div>
    <div class="wcu-box">
      <div class="wcu-text">${esc(d.whyChooseUs)}</div>
    </div>
  </div>` : ""}

  <div class="sec">
    <div class="note-box">
      <div class="note-title">Important Information</div>
      <div class="note-text">This proposal includes all labor, materials, and equipment necessary to complete the project as described above. Our commitment to quality ensures:</div>
      <div class="note-list">
        <div class="note-list-item">Licensed &amp; insured work</div>
        <div class="note-list-item">Code-compliant installation</div>
        <div class="note-list-item">Manufacturer warranties</div>
        <div class="note-list-item">Complete site cleanup</div>
        <div class="note-list-item">Post-project inspection</div>
        <div class="note-list-item">Satisfaction guarantee</div>
      </div>
    </div>
  </div>

  <div class="pg-footer">
    <div>${esc(d.businessName)} · Confidential</div>
    <div>Page 2 of 3</div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════
     PAGE 3 – INVESTMENT + CHART + TERMS + SIGNATURES
     ═══════════════════════════════════════════════════════════ -->
<div class="page content">
  <div class="page3-inner">
    <div class="pg-header">
      <div class="pg-header-co">${esc(d.businessName)}</div>
      <div class="pg-header-title">${esc(d.jobTitle)}</div>
    </div>

    <div class="sec">
      <div class="sec-head"><div class="sec-num">4</div> Investment Summary</div>
      <div class="invest-grid">
        <div class="invest-left">
          <div class="price-card">
            <div class="price-label">Labor</div>
            <div class="price-val">$${fmt(d.laborCost)}</div>
          </div>
          <div class="price-card">
            <div class="price-label">Materials</div>
            <div class="price-val">$${fmt(d.materialsCost)}</div>
          </div>
          <div class="total-card">
            <div class="price-label">Total Project Investment</div>
            <div class="price-val">$${fmt(d.totalCost)}</div>
          </div>
        </div>
        <div class="chart-box">
          <div class="chart-heading">Cost Breakdown</div>
          <div class="chart-canvas"><canvas id="costChart"></canvas></div>
        </div>
      </div>
    </div>

    <div class="sec">
      <div class="sec-head"><div class="sec-num">5</div> Payment Schedule</div>
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
      <div class="warranty-title">✓ Warranty &amp; Guarantee</div>
      <div class="warranty-text">All work is guaranteed to meet or exceed local building codes and manufacturer specifications. We stand behind our workmanship and materials with comprehensive warranty coverage for your peace of mind.</div>
    </div>

    <div class="sec">
      <div class="sec-head"><div class="sec-num">6</div> Terms &amp; Conditions</div>
      <div class="terms-text">${esc(d.termsAndConditions)}</div>
    </div>

    <div class="thank-you">
      <div class="thank-you-title">Thank You for Considering ${esc(d.businessName)}</div>
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
  </div>

  <div class="pg-footer">
    <div>${esc(d.businessName)} · ${esc(d.businessAddress)}</div>
    <div>Page 3 of 3</div>
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
