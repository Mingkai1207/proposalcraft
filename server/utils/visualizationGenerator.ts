/**
 * Visualization Generator
 *
 * Renders data visualizations (Chart.js charts) as PNG images for embedding in PDFs.
 * Uses Puppeteer to render Chart.js in a headless browser, then returns a base64 PNG.
 */

import type { TemplateVisualization } from "../../shared/templateDefs";

export interface VisualizationData {
  laborCost?: number;
  materialsCost?: number;
  totalCost?: number;
  timeline?: string;
  jobScope?: string;
  currentBill?: number;
  annualProduction?: number;
  utilityRate?: number;
  systemSize?: number;
  incentives?: string;
  roofType?: string;
  [key: string]: string | number | undefined;
}

/**
 * Generate a Chart.js chart as a base64 PNG using Puppeteer
 */
async function renderChartToPng(chartConfig: object, width = 700, height = 350): Promise<string> {
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });

    const html = `<!DOCTYPE html>
<html>
<head>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: white; display: flex; align-items: center; justify-content: center; width: ${width}px; height: ${height}px; }
  canvas { display: block; }
</style>
</head>
<body>
<canvas id="chart" width="${width}" height="${height}"></canvas>
<script>
  const ctx = document.getElementById('chart').getContext('2d');
  new Chart(ctx, ${JSON.stringify(chartConfig)});
</script>
</body>
</html>`;

    await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 });
    // Wait for Chart.js to render
    await new Promise(r => setTimeout(r, 800));

    const screenshot = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width, height } });
    return `data:image/png;base64,${Buffer.from(screenshot).toString("base64")}`;
  } finally {
    await browser.close();
  }
}

/**
 * Generate a cost breakdown pie chart
 */
function buildCostBreakdownPieConfig(data: VisualizationData) {
  const labor = data.laborCost || 0;
  const materials = data.materialsCost || 0;
  const total = data.totalCost || labor + materials;
  const other = Math.max(0, total - labor - materials);

  const labels = ["Labor", "Materials"];
  const values = [labor, materials];
  if (other > 0) { labels.push("Other"); values.push(other); }

  return {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b"],
        borderColor: ["#2563eb", "#059669", "#d97706"],
        borderWidth: 2,
      }],
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        legend: { position: "right", labels: { font: { size: 13, family: "Arial" }, padding: 16 } },
        title: {
          display: true,
          text: `Total Investment: $${total.toLocaleString()}`,
          font: { size: 15, weight: "bold", family: "Arial" },
          padding: { bottom: 12 },
        },
        tooltip: {
          callbacks: {
            label: (ctx: { label: string; parsed: number }) =>
              `${ctx.label}: $${ctx.parsed.toLocaleString()} (${Math.round(ctx.parsed / total * 100)}%)`,
          },
        },
      },
    },
  };
}

/**
 * Generate a timeline Gantt-style bar chart
 */
function buildTimelineGanttConfig(data: VisualizationData) {
  // Parse job scope into phases
  const scope = data.jobScope || "";
  const lines = scope.split("\n").filter(l => l.trim().replace(/^[-*•]\s*/, "").length > 5).slice(0, 6);

  const phases = lines.length > 0 ? lines.map((l, i) => ({
    label: l.replace(/^[-*•\d.]\s*/, "").substring(0, 40),
    start: i,
    duration: 1 + Math.floor(Math.random() * 2),
  })) : [
    { label: "Site Preparation", start: 0, duration: 1 },
    { label: "Main Installation", start: 1, duration: 2 },
    { label: "Testing & Inspection", start: 3, duration: 1 },
    { label: "Final Walkthrough", start: 4, duration: 1 },
  ];

  const maxDay = Math.max(...phases.map(p => p.start + p.duration));
  const dayLabels = Array.from({ length: maxDay + 1 }, (_, i) => `Day ${i + 1}`);

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  return {
    type: "bar",
    data: {
      labels: dayLabels,
      datasets: phases.map((phase, i) => ({
        label: phase.label,
        data: dayLabels.map((_, dayIdx) =>
          dayIdx >= phase.start && dayIdx < phase.start + phase.duration ? 1 : 0
        ),
        backgroundColor: colors[i % colors.length] + "cc",
        borderColor: colors[i % colors.length],
        borderWidth: 1,
        borderRadius: 4,
      })),
    },
    options: {
      indexAxis: "y",
      responsive: false,
      animation: false,
      scales: {
        x: { stacked: true, ticks: { font: { size: 11, family: "Arial" } }, grid: { color: "#f0f0f0" } },
        y: { stacked: true, ticks: { font: { size: 11, family: "Arial" } } },
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: data.timeline ? `Estimated Timeline: ${data.timeline}` : "Project Schedule",
          font: { size: 14, weight: "bold", family: "Arial" },
          padding: { bottom: 10 },
        },
      },
    },
  };
}

/**
 * Generate a 25-year ROI line chart for solar proposals
 */
function buildRoiLineConfig(data: VisualizationData) {
  const totalCost = data.totalCost || 25000;
  const monthlyBill = data.currentBill || 200;
  const annualProduction = data.annualProduction || 10000;
  const utilityRate = data.utilityRate || 0.13;
  const annualSavings = Math.min(annualProduction * utilityRate, monthlyBill * 12);

  // Parse incentives to estimate net cost
  let netCost = totalCost;
  const incentivesStr = String(data.incentives || "");
  if (incentivesStr.includes("30%") || incentivesStr.toLowerCase().includes("itc")) {
    netCost = totalCost * 0.7;
  }

  const years = Array.from({ length: 26 }, (_, i) => `Year ${i}`);
  const cumulativeSavings = years.map((_, i) => Math.round(annualSavings * i * 1.03 ** i)); // 3% utility rate increase
  const systemCost = years.map(() => Math.round(netCost));

  return {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label: "Cumulative Savings",
          data: cumulativeSavings,
          borderColor: "#10b981",
          backgroundColor: "#10b98120",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        },
        {
          label: "System Cost (after incentives)",
          data: systemCost,
          borderColor: "#ef4444",
          backgroundColor: "transparent",
          borderDash: [6, 3],
          tension: 0,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: false,
      animation: false,
      scales: {
        y: {
          ticks: {
            callback: (v: number) => `$${(v / 1000).toFixed(0)}k`,
            font: { size: 11, family: "Arial" },
          },
          grid: { color: "#f0f0f0" },
        },
        x: { ticks: { font: { size: 10, family: "Arial" }, maxRotation: 45 } },
      },
      plugins: {
        legend: { labels: { font: { size: 12, family: "Arial" } } },
        title: {
          display: true,
          text: "25-Year Return on Investment",
          font: { size: 14, weight: "bold", family: "Arial" },
          padding: { bottom: 10 },
        },
      },
    },
  };
}

/**
 * Generate a savings bar chart for solar proposals
 */
function buildSavingsBarConfig(data: VisualizationData) {
  const monthlyBill = data.currentBill || 200;
  const annualProduction = data.annualProduction || 10000;
  const utilityRate = data.utilityRate || 0.13;
  const annualSavings = Math.min(annualProduction * utilityRate, monthlyBill * 12);

  const years = Array.from({ length: 10 }, (_, i) => `Year ${i + 1}`);
  const savings = years.map((_, i) => Math.round(annualSavings * 1.03 ** i));
  const bills = years.map((_, i) => Math.round(monthlyBill * 12 * 1.03 ** i));

  return {
    type: "bar",
    data: {
      labels: years,
      datasets: [
        {
          label: "Without Solar (Electric Bill)",
          data: bills,
          backgroundColor: "#ef444480",
          borderColor: "#ef4444",
          borderWidth: 1,
        },
        {
          label: "With Solar (Estimated Bill)",
          data: savings.map((s, i) => Math.max(0, bills[i] - s)),
          backgroundColor: "#10b98180",
          borderColor: "#10b981",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: false,
      animation: false,
      scales: {
        y: {
          ticks: { callback: (v: number) => `$${v.toLocaleString()}`, font: { size: 11, family: "Arial" } },
          grid: { color: "#f0f0f0" },
        },
        x: { ticks: { font: { size: 11, family: "Arial" } } },
      },
      plugins: {
        legend: { labels: { font: { size: 12, family: "Arial" } } },
        title: {
          display: true,
          text: "Annual Energy Cost: With vs. Without Solar",
          font: { size: 14, weight: "bold", family: "Arial" },
          padding: { bottom: 10 },
        },
      },
    },
  };
}

/**
 * Generate a material comparison bar chart for roofing
 */
function buildComparisonBarConfig(data: VisualizationData) {
  const materials = ["Asphalt\nShingles", "Metal\nRoofing", "Tile\nRoofing", "TPO\nFlat", "Cedar\nShake"];
  const lifespan = [25, 50, 50, 20, 30];
  const costPer100sqft = [150, 400, 600, 350, 450];
  const maintenance = [3, 1, 2, 2, 4]; // 1=low, 5=high

  return {
    type: "bar",
    data: {
      labels: materials,
      datasets: [
        {
          label: "Lifespan (years)",
          data: lifespan,
          backgroundColor: "#3b82f680",
          borderColor: "#3b82f6",
          borderWidth: 1,
          yAxisID: "y",
        },
        {
          label: "Cost per 100 sq ft ($)",
          data: costPer100sqft,
          backgroundColor: "#f59e0b80",
          borderColor: "#f59e0b",
          borderWidth: 1,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: false,
      animation: false,
      scales: {
        y: {
          type: "linear",
          position: "left",
          title: { display: true, text: "Lifespan (years)", font: { size: 11, family: "Arial" } },
          ticks: { font: { size: 11, family: "Arial" } },
          grid: { color: "#f0f0f0" },
        },
        y1: {
          type: "linear",
          position: "right",
          title: { display: true, text: "Cost per 100 sq ft ($)", font: { size: 11, family: "Arial" } },
          ticks: { callback: (v: number) => `$${v}`, font: { size: 11, family: "Arial" } },
          grid: { drawOnChartArea: false },
        },
        x: { ticks: { font: { size: 10, family: "Arial" } } },
      },
      plugins: {
        legend: { labels: { font: { size: 12, family: "Arial" } } },
        title: {
          display: true,
          text: "Roofing Material Comparison",
          font: { size: 14, weight: "bold", family: "Arial" },
          padding: { bottom: 10 },
        },
      },
    },
  };
}

/**
 * Generate a scope checklist as an HTML table (not a chart)
 * Returns an HTML string instead of a PNG
 */
function buildScopeChecklistHtml(data: VisualizationData): string {
  const scope = data.jobScope || "";
  const items = scope
    .split("\n")
    .map(l => l.replace(/^[-*•\d.]\s*/, "").trim())
    .filter(l => l.length > 3);

  if (items.length === 0) return "";

  const rows = items.map(item => `
    <tr>
      <td style="width:32px;text-align:center;padding:8px 4px;border-bottom:1px solid #e5e7eb;">
        <div style="width:18px;height:18px;border:2px solid #3b82f6;border-radius:3px;margin:0 auto;"></div>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">${item}</td>
    </tr>`).join("");

  return `
    <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="width:32px;padding:8px 4px;text-align:center;font-size:12px;color:#6b7280;border-bottom:2px solid #d1d5db;"></th>
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;border-bottom:2px solid #d1d5db;text-transform:uppercase;letter-spacing:0.05em;">Work Item</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/**
 * Main entry point: generate a visualization and return either a base64 PNG or HTML string
 */
export async function generateVisualization(
  viz: TemplateVisualization,
  data: VisualizationData
): Promise<{ type: "image"; base64: string } | { type: "html"; html: string }> {
  try {
    if (viz.type === "scope_checklist") {
      return { type: "html", html: buildScopeChecklistHtml(data) };
    }

    let chartConfig: object;
    switch (viz.type) {
      case "cost_breakdown_pie":
        chartConfig = buildCostBreakdownPieConfig(data);
        break;
      case "timeline_gantt":
        chartConfig = buildTimelineGanttConfig(data);
        break;
      case "roi_line":
        chartConfig = buildRoiLineConfig(data);
        break;
      case "savings_bar":
        chartConfig = buildSavingsBarConfig(data);
        break;
      case "comparison_bar":
        chartConfig = buildComparisonBarConfig(data);
        break;
      default:
        chartConfig = buildCostBreakdownPieConfig(data);
    }

    const base64 = await renderChartToPng(chartConfig, 680, 320);
    return { type: "image", base64 };
  } catch (err) {
    console.error(`[Visualization] Failed to generate ${viz.type}:`, err);
    // Return empty on failure — don't break the whole PDF
    return { type: "html", html: `<p style="color:#9ca3af;font-style:italic;font-size:12px;">Chart unavailable</p>` };
  }
}
