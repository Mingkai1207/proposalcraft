import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLES = {
  hvac: {
    businessName: "Arctic Breeze HVAC",
    businessPhone: "(512) 847-3920",
    businessEmail: "info@arcticbreezehvac.com",
    businessAddress: "2841 Ridgeline Dr, Austin, TX 78741",
    licenseNumber: "HVAC-TX-88421",
    clientName: "David & Sarah Johnson",
    clientAddress: "4412 Meadowbrook Lane, Austin, TX 78745",
    clientPhone: "(512) 334-7821",
    clientEmail: "djohnson@email.com",
    jobTitle: "HVAC System Replacement & Installation",
    preparedDate: "March 23, 2026",
    validUntil: "April 6, 2026",
    jobSite: "4412 Meadowbrook Lane, Austin TX",
    jobDetails: "Single-family home, 2,400 sq ft, 2-story, 3 zones",
    projectDetails: "Full HVAC Replacement, Start: April 1, 2026, Duration: 2 days, Permit: Included",
    scope: [
      "Remove existing 15-year-old HVAC system",
      "Install new 4-ton high-efficiency heat pump (SEER2 16)",
      "Install new ductwork in master bedroom zone",
      "Upgrade thermostat to smart WiFi-enabled model",
      "System testing and 5-year warranty activation",
    ],
    materials: [
      "Carrier 25HNH448A001 Heat Pump Unit",
      "Flexible ductwork and insulation",
      "Honeywell Home T9 Smart Thermostat",
      "Refrigerant and misc. supplies",
    ],
    laborCost: 2500,
    materialsCost: 4200,
    totalCost: 6700,
    terms: "50% deposit due upon signing, 50% due upon completion. 5-year parts warranty included.",
  },
  plumbing: {
    businessName: "Flow Masters Plumbing",
    businessPhone: "(512) 555-0123",
    businessEmail: "info@flowmastersplumbing.com",
    businessAddress: "1200 Water St, Austin, TX 78704",
    licenseNumber: "PLB-TX-45123",
    clientName: "Michael Chen",
    clientAddress: "789 Oak Ridge Road, Austin, TX 78704",
    clientPhone: "(512) 555-4567",
    clientEmail: "mchen@email.com",
    jobTitle: "Kitchen & Bathroom Plumbing Renovation",
    preparedDate: "March 23, 2026",
    validUntil: "April 6, 2026",
    jobSite: "789 Oak Ridge Road, Austin TX",
    jobDetails: "2-bedroom home, kitchen and master bath renovation",
    projectDetails: "Full plumbing upgrade, Start: April 5, 2026, Duration: 3 days, Permit: Included",
    scope: [
      "Remove old plumbing fixtures",
      "Install new copper supply lines",
      "Install new PVC drain lines",
      "Install new fixtures: kitchen sink, faucet, and master bath vanity",
      "Pressure test and inspection",
    ],
    materials: [
      "Copper tubing and fittings",
      "PVC pipe and connectors",
      "Kohler kitchen sink and faucet",
      "Moen bathroom vanity set",
    ],
    laborCost: 1800,
    materialsCost: 2400,
    totalCost: 4200,
    terms: "50% deposit due upon signing, 50% due upon completion. 2-year workmanship warranty.",
  },
  electrical: {
    businessName: "Bright Spark Electric",
    businessPhone: "(512) 555-9999",
    businessEmail: "info@brightspark.com",
    businessAddress: "555 Power Lane, Austin, TX 78701",
    licenseNumber: "ELC-TX-78901",
    clientName: "Jennifer Martinez",
    clientAddress: "321 Elm Street, Austin, TX 78702",
    clientPhone: "(512) 555-8888",
    clientEmail: "jmartinez@email.com",
    jobTitle: "Home Electrical Panel Upgrade & Outlet Installation",
    preparedDate: "March 23, 2026",
    validUntil: "April 6, 2026",
    jobSite: "321 Elm Street, Austin TX",
    jobDetails: "1970s home, 100-amp service, needs upgrade to 200-amp",
    projectDetails: "Electrical panel upgrade, Start: April 8, 2026, Duration: 1 day, Permit: Included",
    scope: [
      "Upgrade main electrical panel from 100-amp to 200-amp service",
      "Install 8 new GFCI outlets in kitchen and bathrooms",
      "Install 2 new 240V circuits for appliances",
      "Full system inspection and testing",
      "Obtain city inspection certificate",
    ],
    materials: [
      "200-amp main breaker panel",
      "GFCI outlets and switches",
      "12/2 and 10/2 copper wire",
      "Breakers and misc. hardware",
    ],
    laborCost: 2200,
    materialsCost: 1600,
    totalCost: 3800,
    terms: "50% deposit due upon signing, 50% due upon completion. 10-year workmanship warranty.",
  },
  roofing: {
    businessName: "Solid Roof Solutions",
    businessPhone: "(512) 555-1111",
    businessEmail: "info@solidroof.com",
    businessAddress: "777 Shingle Ave, Austin, TX 78703",
    licenseNumber: "ROF-TX-56789",
    clientName: "Robert Williams",
    clientAddress: "555 Timber Lane, Austin, TX 78705",
    clientPhone: "(512) 555-2222",
    clientEmail: "rwilliams@email.com",
    jobTitle: "Full Roof Replacement with Architectural Shingles",
    preparedDate: "March 23, 2026",
    validUntil: "April 6, 2026",
    jobSite: "555 Timber Lane, Austin TX",
    jobDetails: "1800 sq ft, 2-story colonial, 25-year-old asphalt shingles",
    projectDetails: "Complete roof replacement, Start: April 10, 2026, Duration: 2 days, Permit: Included",
    scope: [
      "Remove existing asphalt shingles and inspect decking",
      "Replace damaged plywood sections",
      "Install new ice and water shield",
      "Install premium architectural shingles (30-year warranty)",
      "Install new ridge vents and flashing",
      "Clean and haul away all debris",
    ],
    materials: [
      "GAF Timberline HD architectural shingles",
      "Ice and water shield",
      "Plywood decking",
      "Ridge vents and flashing",
    ],
    laborCost: 3500,
    materialsCost: 2800,
    totalCost: 6300,
    terms: "50% deposit due upon signing, 50% due upon completion. 30-year manufacturer warranty + 5-year workmanship warranty.",
  },
};

async function generateProposal(tradeType, sampleData) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // 8.5 x 11 inches
  const { width, height } = page.getSize();

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 40;
  const margin = 40;
  const contentWidth = width - 2 * margin;

  // Header: Business Info
  page.drawText(sampleData.businessName, {
    x: margin,
    y,
    size: 28,
    font: helveticaBold,
    color: rgb(0.05, 0.1, 0.2),
  });
  y -= 25;

  page.drawText(sampleData.businessPhone + " · " + sampleData.businessEmail, {
    x: margin,
    y,
    size: 10,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= 15;

  page.drawText(sampleData.businessAddress + " · Lic# " + sampleData.licenseNumber, {
    x: margin,
    y,
    size: 10,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= 25;

  // Blue divider line
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 2,
    color: rgb(0.2, 0.4, 0.8),
  });
  y -= 20;

  // Job Title
  page.drawText(sampleData.jobTitle, {
    x: margin,
    y,
    size: 20,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  y -= 18;

  page.drawText(
    `Prepared for: ${sampleData.clientName}  ·  Date: ${sampleData.preparedDate}  ·  Valid until: ${sampleData.validUntil}`,
    {
      x: margin,
      y,
      size: 9,
      font: helvetica,
      color: rgb(0.3, 0.3, 0.3),
    }
  );
  y -= 25;

  // Three-column info box
  const boxHeight = 80;
  const boxWidth = (contentWidth - 20) / 3;

  // Draw boxes
  [0, 1, 2].forEach((i) => {
    const boxX = margin + i * (boxWidth + 10);
    page.drawRectangle({
      x: boxX,
      y: y - boxHeight,
      width: boxWidth,
      height: boxHeight,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });
  });

  // Column 1: Client Information
  let colY = y - 10;
  page.drawText("CLIENT INFORMATION", {
    x: margin + 5,
    y: colY,
    size: 10,
    font: helveticaBold,
    color: rgb(0.6, 0.6, 0.8),
  });
  colY -= 14;
  page.drawText(sampleData.clientName, {
    x: margin + 5,
    y: colY,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  colY -= 12;
  page.drawText(sampleData.clientAddress.split(",")[0], {
    x: margin + 5,
    y: colY,
    size: 9,
    font: helvetica,
    color: rgb(0, 0, 0),
  });
  colY -= 11;
  page.drawText(sampleData.clientAddress.split(",").slice(1).join(","), {
    x: margin + 5,
    y: colY,
    size: 9,
    font: helvetica,
    color: rgb(0, 0, 0),
  });
  colY -= 11;
  page.drawText(sampleData.clientPhone + " · " + sampleData.clientEmail, {
    x: margin + 5,
    y: colY,
    size: 8,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Column 2: Job Site
  colY = y - 10;
  const col2X = margin + boxWidth + 15;
  page.drawText("JOB SITE", {
    x: col2X,
    y: colY,
    size: 10,
    font: helveticaBold,
    color: rgb(0.6, 0.6, 0.8),
  });
  colY -= 14;
  page.drawText(sampleData.jobSite.split(",")[0], {
    x: col2X,
    y: colY,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  colY -= 12;
  page.drawText(sampleData.jobSite.split(",").slice(1).join(","), {
    x: col2X,
    y: colY,
    size: 9,
    font: helvetica,
    color: rgb(0, 0, 0),
  });
  colY -= 11;
  page.drawText(sampleData.jobDetails, {
    x: col2X,
    y: colY,
    size: 8,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Column 3: Project Details
  colY = y - 10;
  const col3X = margin + 2 * (boxWidth + 10);
  page.drawText("PROJECT DETAILS", {
    x: col3X,
    y: colY,
    size: 10,
    font: helveticaBold,
    color: rgb(0.6, 0.6, 0.8),
  });
  colY -= 14;
  page.drawText(sampleData.projectDetails, {
    x: col3X,
    y: colY,
    size: 8,
    font: helvetica,
    color: rgb(0, 0, 0),
    maxWidth: boxWidth - 10,
  });

  y -= boxHeight + 30;

  // Scope of Work
  page.drawText("SCOPE OF WORK", {
    x: margin,
    y,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  y -= 15;

  sampleData.scope.forEach((item) => {
    page.drawText("• " + item, {
      x: margin + 10,
      y,
      size: 9,
      font: helvetica,
      color: rgb(0, 0, 0),
      maxWidth: contentWidth - 20,
    });
    y -= 12;
  });

  y -= 10;

  // Materials
  page.drawText("MATERIALS & EQUIPMENT", {
    x: margin,
    y,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  y -= 15;

  sampleData.materials.forEach((item) => {
    page.drawText("• " + item, {
      x: margin + 10,
      y,
      size: 9,
      font: helvetica,
      color: rgb(0, 0, 0),
      maxWidth: contentWidth - 20,
    });
    y -= 12;
  });

  y -= 10;

  // Investment Summary
  page.drawText("INVESTMENT SUMMARY", {
    x: margin,
    y,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  y -= 15;

  const summaryX = margin + 200;
  page.drawText("Labor Cost:", {
    x: margin,
    y,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0),
  });
  page.drawText("$" + sampleData.laborCost.toLocaleString(), {
    x: summaryX,
    y,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  y -= 14;

  page.drawText("Materials Cost:", {
    x: margin,
    y,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0),
  });
  page.drawText("$" + sampleData.materialsCost.toLocaleString(), {
    x: summaryX,
    y,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  y -= 14;

  page.drawLine({
    start: { x: margin, y },
    end: { x: summaryX + 100, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 14;

  page.drawText("TOTAL INVESTMENT:", {
    x: margin,
    y,
    size: 11,
    font: helveticaBold,
    color: rgb(0.2, 0.4, 0.8),
  });
  page.drawText("$" + sampleData.totalCost.toLocaleString(), {
    x: summaryX,
    y,
    size: 11,
    font: helveticaBold,
    color: rgb(0.2, 0.4, 0.8),
  });

  return pdfDoc;
}

async function main() {
  const outputDir = path.join(__dirname, "..", "sample-proposals");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const [tradeType, sampleData] of Object.entries(SAMPLES)) {
    console.log(`Generating ${tradeType} sample proposal...`);
    const pdfDoc = await generateProposal(tradeType, sampleData);
    const pdfPath = path.join(outputDir, `sample_proposal_${tradeType}.pdf`);
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfPath, pdfBytes);
    console.log(`✓ Saved to ${pdfPath}`);
  }

  console.log("\n✓ All sample proposals generated successfully!");
  console.log(`Output directory: ${outputDir}`);
}

main().catch(console.error);
