/**
 * Test script: Generate a proposal using the new system prompt and render to PDF via Puppeteer.
 * Usage: node test-proposal-gen.mjs
 */

import puppeteer from "puppeteer";
import fs from "fs";
import https from "https";
import http from "http";

const VECTOR_ENGINE_API_KEY = process.env.VECTOR_ENGINE_API_KEY;
const VECTOR_ENGINE_BASE_URL = (process.env.VECTOR_ENGINE_BASE_URL || "https://api.vectorengine.ai").replace(/\/$/, "");

const systemPrompt = `You are a professional proposal document generator. The user will send you a project summary. Transform it into a single, complete, self-contained HTML document ready for PDF conversion via Puppeteer.

STRICT OUTPUT RULES:
- Return ONLY raw HTML starting with <!DOCTYPE html>. No markdown, no backticks, no text before or after.
- Inline CSS only. No external stylesheets or fonts.
- Do NOT use emoji characters anywhere in the document.

PAGE LAYOUT (CRITICAL):
- The PDF is rendered by Puppeteer with top/bottom margins of 0.6in and left/right margins of 0.4in. Your HTML body content will be placed inside these margins.
- Do NOT add your own @page margin rules — Puppeteer controls the margins externally.
- The content area width is approximately 700px. Design your layout to fit within this width.
- html, body must have height: auto and overflow: visible — never set height: 100vh or overflow: hidden.

PAGE BREAK RULES (CRITICAL — these are the exact CSS rules that work in Chrome/Puppeteer):
- NEVER use break-inside: avoid or page-break-inside: avoid on large section-level divs — this causes content truncation when a section is taller than one page.
- To prevent orphaned headings (a heading alone at the bottom of a page with no content below it), use this exact CSS pattern on ALL h1, h2, h3 elements:
  h1::before, h2::before, h3::before {
    content: "";
    display: block;
    height: 5rem;
    margin-bottom: -5rem;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  This reserves 5rem of space before each heading so it cannot appear in the last 5rem of a page.
- To prevent table rows from splitting across pages: tr { break-inside: avoid; page-break-inside: avoid; }
- To prevent small callout boxes, stat cards, and chart containers from splitting: apply break-inside: avoid; page-break-inside: avoid; display: block; to those specific small elements only.
- Use orphans: 3; widows: 3; on p elements to prevent isolated lines at page boundaries.
- Do NOT use break-before: page on sections — that wastes space. Sections should flow naturally and share pages.
- Do NOT use position: running() or @page @top-right/@bottom-center content: element() — these are not supported by Chrome.

SVG CHARTS (required):
- Identify data in the summary that benefits from visualization — cost breakdowns, timelines, material quantities, payment schedules, efficiency ratings, etc.
- Render all charts as inline SVG (no JavaScript, no external libraries).
- Charts must be accurate, clearly labeled, and visually integrated with the document's design.
- SVG sizing: use width="100%" viewBox="0 0 640 [height]" — the 640px viewBox leaves adequate room for labels within the 700px content area.
- Inside each SVG, add at least 50px padding on the left for axis labels and 70px padding on the right for bar end labels — labels must NEVER be clipped.
- For horizontal bar charts: ensure bars are at most 480px wide so end labels have 70px of space on the right.
- Wrap each chart in a div with break-inside: avoid; page-break-inside: avoid; display: block; so charts never split across pages.
- Examples: bar chart for cost breakdown, Gantt-style chart for timeline, donut chart for budget allocation, comparison bars for equipment specs.

DESIGN:
- Make the document visually appealing and professional. You have full creative freedom over layout, typography, and color scheme.
- Optimized for A4 PDF output (printBackground: true in Puppeteer).
- Use a professional font stack with system fonts only (no Google Fonts): font-family: 'Segoe UI', Arial, sans-serif for body; font-family: Georgia, 'Times New Roman', serif for headings if you want a serif accent.

STRUCTURE:
- Organize content into logical sections with clear headings.
- End with an Acceptance & Signature block for both parties.`;

const approvedSummary = `HVAC System Replacement Proposal

Contractor: Summit Comfort Solutions LLC
License #: HVAC-2024-8891
Address: 4520 Industrial Blvd, Suite 200, Denver, CO 80216
Phone: (303) 555-7842
Email: proposals@summitcomfort.com

Client: John & Maria Rodriguez
Property: 2847 Maple Ridge Drive, Lakewood, CO 80227
Phone: (303) 555-2190
Email: rodriguez.jm@gmail.com

Proposal Date: March 24, 2026
Valid Until: April 23, 2026

Project Scope:
Complete removal and replacement of the existing 15-year-old Carrier 3.5-ton split system (Model 24ACC636A003) with a new high-efficiency Trane XV20i variable-speed heat pump system. The existing system has a SEER rating of 13 and has required $4,200 in repairs over the past 2 years. The new system will provide both heating and cooling with a SEER2 rating of 20.

Work includes:
- Removal and disposal of existing outdoor condenser unit, indoor air handler, and refrigerant lines
- Installation of Trane XV20i 4-ton variable-speed heat pump (Model 4TWV0048A1000A)
- Installation of Trane Hyperion TAM9 communicating air handler with variable-speed blower
- New R-410A refrigerant line set with proper brazing and pressure testing
- Replacement of existing 60-amp disconnect with new 70-amp rated disconnect
- Electrical panel upgrade: add dedicated 40-amp 240V circuit for heat pump
- Installation of Trane XL824 smart thermostat with Wi-Fi and zoning capability
- Complete ductwork inspection and sealing of all accessible joints with mastic
- New condensate drain line with safety float switch
- System startup, refrigerant charge verification, and airflow balancing
- City of Lakewood mechanical permit and final inspection

Materials & Equipment:
- Trane XV20i Heat Pump 4-ton: $6,850
- Trane Hyperion TAM9 Air Handler: $3,200
- Trane XL824 Smart Thermostat: $485
- Refrigerant line set (50ft, 3/8" x 3/4"): $380
- Electrical disconnect 70A: $145
- Electrical wiring and breaker: $320
- Ductwork mastic and sealing materials: $175
- Condensate line and float switch: $95
- Mounting pad and vibration isolators: $210
- Miscellaneous fittings and supplies: $340
Total Materials: $12,200

Labor:
- System removal and disposal (2 technicians, 4 hours): $960
- Heat pump and air handler installation (2 technicians, 8 hours): $1,920
- Electrical work (licensed electrician, 4 hours): $680
- Ductwork sealing (1 technician, 3 hours): $360
- Thermostat installation and programming: $240
- System startup, testing, and balancing (2 technicians, 3 hours): $720
- Permit fees and inspection coordination: $350
Total Labor: $5,230

Project Total: $17,430

Timeline:
- Week 1: Permit application and equipment ordering (5 business days)
- Week 2: Old system removal and electrical prep (1 day)
- Week 3: New system installation (2 days)
- Week 3: Ductwork sealing, thermostat, startup (1 day)
- Week 4: City inspection and project closeout (1 day)
Total Duration: Approximately 4 weeks from contract signing

Payment Schedule:
- Deposit (30%): $5,229 due at contract signing
- Progress payment (40%): $6,972 due at equipment delivery
- Final payment (30%): $5,229 due upon inspection approval

Warranty:
- Trane equipment: 10-year parts warranty (registered)
- Compressor: 12-year warranty
- Summit Comfort labor warranty: 2 years
- Satisfaction guarantee: 100% comfort guarantee for first heating and cooling season

Energy Savings Estimate:
- Current system efficiency: 13 SEER
- New system efficiency: 20 SEER2
- Estimated annual cooling savings: $680
- Estimated annual heating savings: $420
- Total estimated annual savings: $1,100
- Projected payback period: 4.7 years (accounting for avoided repair costs)

Terms:
- All work performed by licensed, insured HVAC technicians
- Permits and inspections included in quoted price
- Change orders require written approval and may adjust timeline/cost
- Payment by check, credit card (3% processing fee), or bank transfer
- Cancellation within 3 business days of signing: full refund of deposit`;

/**
 * Make an HTTP(S) request with a long timeout using Node's built-in http/https modules.
 */
function longFetch(url, body, apiKey) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const mod = parsedUrl.protocol === "https:" ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
      path: parsedUrl.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      timeout: 600000, // 10 minutes
    };

    const req = mod.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out after 10 minutes"));
    });

    req.on("error", reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log("=== Generating HTML proposal via VectorEngine API ===");
  console.log(`API Key present: ${!!VECTOR_ENGINE_API_KEY}`);
  console.log(`Base URL: ${VECTOR_ENGINE_BASE_URL}`);
  
  const startTime = Date.now();

  const data = await longFetch(
    `${VECTOR_ENGINE_BASE_URL}/v1/chat/completions`,
    {
      model: "claude-sonnet-4-6-thinking",
      max_tokens: 40000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: approvedSummary },
      ],
    },
    VECTOR_ENGINE_API_KEY
  );

  const genTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nHTML generated in ${genTime}s`);

  let html = data.choices?.[0]?.message?.content || "";
  
  // Strip markdown code fences if present
  html = html.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  
  // Ensure starts with <!DOCTYPE html>
  if (!html.toLowerCase().startsWith("<!doctype")) {
    const idx = html.toLowerCase().indexOf("<!doctype");
    if (idx > 0) html = html.slice(idx);
  }

  console.log(`HTML length: ${html.length} characters`);
  
  // Save HTML
  fs.writeFileSync("/home/ubuntu/test-proposal-output.html", html);
  console.log("Saved HTML to /home/ubuntu/test-proposal-output.html");

  // Render to PDF via Puppeteer
  console.log("\n=== Rendering PDF via Puppeteer ===");
  const pdfStart = Date.now();
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 2500));

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: { top: "0.6in", right: "0.4in", bottom: "0.6in", left: "0.4in" },
    printBackground: true,
    preferCSSPageSize: false,
  });

  await browser.close();

  const pdfTime = ((Date.now() - pdfStart) / 1000).toFixed(1);
  fs.writeFileSync("/home/ubuntu/test-proposal-output.pdf", pdfBuffer);
  console.log(`PDF rendered in ${pdfTime}s`);
  console.log(`PDF size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
  console.log("Saved PDF to /home/ubuntu/test-proposal-output.pdf");
  
  console.log("\n=== Done ===");
}

main().catch(console.error);
