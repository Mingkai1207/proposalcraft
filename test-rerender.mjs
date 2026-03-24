import fs from "fs";
import puppeteer from "puppeteer";

// Read the existing HTML (the original, not the previously patched version)
let html = fs.readFileSync("/home/ubuntu/test-proposal-output.html", "utf-8");

// Inject CSS that prevents orphaned headings without forcing every section to a new page
const cssInjection = `
/* Prevent orphaned headings at bottom of page */
h1, h2, h3, h4 {
  break-after: avoid !important;
}
/* Prevent orphaned lines */
body {
  orphans: 3;
  widows: 3;
}
/* Keep small blocks together */
.info-card, .warranty-card, .signature-block, .next-steps {
  break-inside: avoid;
}
/* Keep table rows together with their header */
thead {
  break-after: avoid;
}
tr {
  break-inside: avoid;
}
`;

// Inject before </style>
if (html.includes("</style>")) {
  html = html.replace("</style>", cssInjection + "\n</style>");
} else {
  html = html.replace("</head>", "<style>" + cssInjection + "</style>\n</head>");
}

fs.writeFileSync("/home/ubuntu/test-proposal-patched.html", html);
console.log("Patched HTML saved");

// Render PDF
console.log("=== Rendering PDF via Puppeteer ===");
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
fs.writeFileSync("/home/ubuntu/test-proposal-patched.pdf", pdfBuffer);
console.log(`PDF rendered in ${pdfTime}s`);
console.log(`PDF size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
console.log(`Pages: ${pdfBuffer.length} bytes`);
console.log("Saved to /home/ubuntu/test-proposal-patched.pdf");
