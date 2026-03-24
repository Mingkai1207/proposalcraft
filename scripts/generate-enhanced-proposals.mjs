import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENHANCED_SAMPLES = {
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
    jobTitle: "Complete HVAC System Replacement & Installation",
    preparedDate: "March 23, 2026",
    validUntil: "April 6, 2026",
    jobSite: "4412 Meadowbrook Lane, Austin TX",
    jobDetails: "Single-family home, 2,400 sq ft, 2-story, 3 climate zones",
    projectDetails: "Full HVAC System Replacement, Start: April 1, 2026, Duration: 2 days, Permit: Included",
    
    executiveSummary: "Arctic Breeze HVAC is pleased to provide this proposal for a complete HVAC system replacement at your residence. Your current 15-year-old system has reached the end of its serviceable life, and we recommend replacing it with a modern, high-efficiency heat pump system that will provide superior comfort, energy savings, and reliability for years to come.",
    
    scopeOfWork: [
      "Complete removal and disposal of existing 3-ton air conditioning system and furnace",
      "Disconnect and cap existing refrigerant lines, drain and dispose of refrigerant per EPA regulations",
      "Remove existing ductwork in master bedroom zone and replace with new insulated flexible ductwork",
      "Install new 4-ton Carrier 25HNH448A001 high-efficiency heat pump (SEER2 16, HSPF2 9.5)",
      "Install new variable-speed air handler with 5-ton capacity for future expansion",
      "Install new smart WiFi-enabled Honeywell Home T9 thermostat with remote access capability",
      "Install new 1-inch return air filter with MERV-13 rating for improved air quality",
      "Pressure test entire system for refrigerant leaks and seal any identified leaks",
      "Vacuum and charge system with R-410A refrigerant to manufacturer specifications",
      "System startup, calibration, and full operational testing",
      "Provide 5-year parts warranty and 2-year labor warranty",
      "Complete cleanup and removal of all old equipment and packaging materials",
    ],
    
    materials: [
      "Carrier 25HNH448A001 Heat Pump Unit (4-ton, SEER2 16) - $2,800",
      "Carrier variable-speed air handler with 5-ton capacity - $1,200",
      "Honeywell Home T9 Smart Thermostat with WiFi - $250",
      "Flexible ductwork insulation (R-8) and connectors - $400",
      "R-410A refrigerant (20 lbs) - $180",
      "Electrical components and wiring - $150",
      "Misc. hardware, fittings, and supplies - $220",
    ],
    
    timeline: [
      "Day 1: System removal and disposal (4-5 hours). New ductwork installation. Air handler installation.",
      "Day 2: Heat pump unit installation and connections. Thermostat installation. System testing and startup.",
      "Post-Installation: 30-day warranty period. 24/7 emergency support available.",
    ],
    
    whyChooseUs: "Arctic Breeze HVAC has been serving the Austin area for 18 years with a 4.9-star rating from over 500 verified customers. Our technicians are NATE-certified and factory-trained on all major brands. We offer same-day emergency service, transparent pricing with no hidden fees, and a satisfaction guarantee on all work.",
    
    termsAndConditions: "50% deposit ($3,350) due upon signing this proposal to secure your installation date. Final 50% ($3,350) due upon completion and system verification. All work includes 5-year manufacturer parts warranty and 2-year labor warranty. System includes 24/7 emergency support. Financing available through approved lenders.",
    
    laborCost: 2500,
    materialsCost: 5200,
    totalCost: 7700,
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
    jobTitle: "Complete Kitchen & Master Bathroom Plumbing Renovation",
    preparedDate: "March 23, 2026",
    validUntil: "April 6, 2026",
    jobSite: "789 Oak Ridge Road, Austin TX",
    jobDetails: "2-bedroom home built in 1995, kitchen and master bathroom complete renovation",
    projectDetails: "Full plumbing upgrade with new fixtures, Start: April 5, 2026, Duration: 3 days, Permit: Included",
    
    executiveSummary: "Flow Masters Plumbing is excited to present this comprehensive proposal for your kitchen and bathroom renovation. We will completely replace your aging plumbing infrastructure with modern copper supply lines and PVC drain lines, install premium fixtures, and ensure your home meets current plumbing codes.",
    
    scopeOfWork: [
      "Remove all existing plumbing fixtures from kitchen and master bathroom",
      "Cap and remove old galvanized steel supply lines throughout both areas",
      "Install new 3/4-inch copper supply lines from main water line to all fixtures",
      "Install new 1/2-inch copper branch lines to each fixture location",
      "Install new 2-inch and 1.5-inch PVC drain lines with proper slope and venting",
      "Install new P-traps and cleanouts at all drain locations",
      "Install new Kohler Bancroft kitchen sink with integrated drainboard",
      "Install new Kohler Forte kitchen faucet with pull-down sprayer",
      "Install new Moen Voss master bathroom vanity with dual sinks",
      "Install new Moen Align master bathroom faucet with motion sensor",
      "Install new Toto Neorest toilet with heated seat and bidet function",
      "Install new Delta shower valve with thermostatic mixing valve",
      "Install new Kohler frameless glass shower enclosure",
      "Complete pressure test of all supply lines (80 PSI)",
      "Complete smoke test of all drain lines for leaks",
      "Obtain city inspection and approval certificate",
      "Full cleanup and removal of all old materials",
    ],
    
    materials: [
      "Kohler Bancroft kitchen sink - $450",
      "Kohler Forte kitchen faucet with sprayer - $320",
      "Moen Voss dual-sink vanity - $680",
      "Moen Align bathroom faucet - $280",
      "Toto Neorest toilet - $1,200",
      "Delta shower valve and trim - $350",
      "Kohler frameless shower enclosure - $800",
      "Copper tubing and fittings (50 lbs) - $280",
      "PVC pipe and connectors - $150",
      "Valves, traps, and misc. hardware - $220",
    ],
    
    timeline: [
      "Day 1: Demolition and removal of old fixtures and plumbing. Installation of new supply and drain lines.",
      "Day 2: Installation of kitchen fixtures and bathroom vanity. Toilet and shower valve installation.",
      "Day 3: Shower enclosure installation. Final connections and pressure testing. City inspection.",
      "Post-Installation: 30-day warranty period. Emergency plumber on-call.",
    ],
    
    whyChooseUs: "Flow Masters Plumbing has been the trusted name in Austin plumbing for 22 years. We employ only licensed, insured plumbers with an average of 12 years experience. We guarantee our work with a 2-year warranty and offer 24/7 emergency service. Our customers consistently rate us 4.8 stars for professionalism and attention to detail.",
    
    termsAndConditions: "50% deposit ($2,100) required to schedule your project and order fixtures. Final 50% ($2,100) due upon completion and inspection approval. All work includes 2-year warranty on labor and 10-year warranty on fixtures. We handle all permit applications and inspections. Financing available.",
    
    laborCost: 1800,
    materialsCost: 5100,
    totalCost: 6900,
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
    jobTitle: "Electrical Panel Upgrade & Kitchen/Bathroom Outlet Installation",
    preparedDate: "March 23, 2026",
    validUntil: "April 6, 2026",
    jobSite: "321 Elm Street, Austin TX",
    jobDetails: "1970s home with original 100-amp service, needs upgrade to 200-amp for modern appliances",
    projectDetails: "Complete electrical panel upgrade and outlet installation, Start: April 8, 2026, Duration: 1 day, Permit: Included",
    
    executiveSummary: "Bright Spark Electric is pleased to provide this proposal for upgrading your home's electrical service from 100-amp to 200-amp capacity. Your current service is insufficient for modern appliances and creates a fire hazard. We will install a new main panel, upgrade all circuits, and add GFCI-protected outlets throughout your kitchen and bathrooms.",
    
    scopeOfWork: [
      "Obtain electrical permit from City of Austin",
      "Upgrade main service entrance from 100-amp to 200-amp capacity",
      "Install new 200-amp main breaker panel with 40 available circuit positions",
      "Install new 200-amp meter base and connect to utility company",
      "Disconnect and remove old 100-amp panel safely",
      "Install 8 new 20-amp GFCI circuits in kitchen with dedicated outlets for appliances",
      "Install 6 new 20-amp GFCI circuits in master and guest bathrooms",
      "Install 2 new 240V circuits for electric range and dryer",
      "Install 1 new 240V circuit for hot water heater",
      "Install new 15-amp circuit for bedroom ceiling fans",
      "Install new 20-amp circuit for living room entertainment center",
      "Install all new outlets with tamper-resistant covers",
      "Install new main disconnect switch with emergency shutoff",
      "Complete all connections per National Electrical Code (NEC)",
      "Perform comprehensive system testing and verification",
      "Obtain city inspection and approval certificate",
      "Provide homeowner with new electrical panel documentation",
    ],
    
    materials: [
      "200-amp main breaker panel (Siemens or Square D) - $1,200",
      "200-amp meter base - $350",
      "200-amp main disconnect switch - $200",
      "GFCI outlets (20 units) - $280",
      "12/2 and 10/2 copper wire (500 ft) - $420",
      "Circuit breakers (20 units, various amps) - $380",
      "Conduit, boxes, and connectors - $250",
      "Misc. hardware and supplies - $120",
    ],
    
    timeline: [
      "Pre-work: Permit application and approval (3-5 business days)",
      "Installation Day: Panel upgrade and all circuit installation (6-8 hours)",
      "Inspection: City electrical inspector verification (1-2 days after completion)",
      "Post-Installation: 24/7 emergency electrical support available",
    ],
    
    whyChooseUs: "Bright Spark Electric has been Austin's premier electrical contractor for 16 years. All our electricians are Master Electricians with 15+ years experience and current certifications. We specialize in panel upgrades and have completed over 2,000 installations. We guarantee all work and offer 10-year warranty on labor.",
    
    termsAndConditions: "50% deposit ($1,900) due upon signing to secure permit application. Final 50% ($1,900) due upon completion and city inspection approval. All work includes 10-year labor warranty and 5-year parts warranty. We handle all permits and inspections. Financing available for qualifying customers.",
    
    laborCost: 2200,
    materialsCost: 3400,
    totalCost: 5600,
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
    jobTitle: "Complete Roof Replacement with Premium Architectural Shingles",
    preparedDate: "March 23, 2026",
    validUntil: "April 6, 2026",
    jobSite: "555 Timber Lane, Austin TX",
    jobDetails: "1800 sq ft 2-story colonial home with 25-year-old asphalt shingles showing significant wear",
    projectDetails: "Complete roof replacement with 30-year warranty shingles, Start: April 10, 2026, Duration: 2 days, Permit: Included",
    
    executiveSummary: "Solid Roof Solutions is honored to present this proposal for your complete roof replacement. Your current roof has reached the end of its serviceable life with multiple areas of deterioration, missing shingles, and compromised flashing. We will install premium architectural shingles with a 30-year warranty, ensuring your home is protected for decades.",
    
    scopeOfWork: [
      "Obtain roofing permit from City of Austin",
      "Complete roof inspection and documentation of current condition",
      "Safely remove all existing asphalt shingles and underlying felt paper",
      "Inspect and replace any damaged or rotted plywood decking (estimated 150 sq ft)",
      "Install new 1/2-inch plywood decking where needed",
      "Install new synthetic underlayment for superior moisture protection",
      "Install new ice and water shield along all eaves and valleys",
      "Install new ridge vents for proper attic ventilation",
      "Install new GAF Timberline HD architectural shingles (30-year warranty)",
      "Install new aluminum flashing at all roof penetrations and valleys",
      "Install new gutters and downspouts (optional, quote available separately)",
      "Complete roof inspection and pressure wash to remove debris",
      "Obtain city inspection and final approval",
      "Provide homeowner with warranty documentation and maintenance guide",
      "Complete cleanup and removal of all old materials",
    ],
    
    materials: [
      "GAF Timberline HD architectural shingles (65 squares) - $2,100",
      "Synthetic underlayment and ice/water shield - $450",
      "Ridge vents and ventilation components - $280",
      "Aluminum flashing and trim - $320",
      "Plywood decking (150 sq ft) - $280",
      "Nails, fasteners, and misc. hardware - $150",
      "Permit and inspection fees - $100",
    ],
    
    timeline: [
      "Pre-work: Permit application (3-5 business days)",
      "Day 1: Complete removal of old roofing and inspection. Installation of new decking and underlayment.",
      "Day 2: Installation of ice/water shield, shingles, flashing, and ridge vents. Final inspection.",
      "Post-Installation: 30-year manufacturer warranty. 5-year labor warranty. Emergency repair hotline.",
    ],
    
    whyChooseUs: "Solid Roof Solutions has been Austin's trusted roofing company for 20 years. We are GAF Master Elite contractors, the highest certification available. Our team has completed over 5,000 roof replacements with a 4.9-star customer rating. We stand behind our work with a 5-year labor warranty and handle all permits and inspections.",
    
    termsAndConditions: "50% deposit ($3,150) required to schedule your project and order materials. Final 50% ($3,150) due upon completion and city inspection approval. All work includes 30-year manufacturer warranty on shingles and 5-year labor warranty. We handle all permits. Financing available for qualified customers.",
    
    laborCost: 3500,
    materialsCost: 3680,
    totalCost: 7180,
  },
};

function wrapText(text, maxWidth, fontSize) {
  const charWidth = fontSize * 0.5; // Approximate character width
  const charsPerLine = Math.floor(maxWidth / charWidth);
  const lines = [];
  const words = text.split(" ");
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length > charsPerLine) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + " " + word : word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

async function generateEnhancedProposal(tradeType, sampleData) {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([612, 792]); // 8.5 x 11 inches
  const { width, height } = page.getSize();

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 40;
  const margin = 40;
  const contentWidth = width - 2 * margin;
  const lineHeight = 12;

  const addText = (text, size, font, color, bold = false) => {
    if (y < margin + 50) {
      page = pdfDoc.addPage([612, 792]);
      y = height - margin;
    }
    page.drawText(text, {
      x: margin,
      y,
      size,
      font: bold ? helveticaBold : font,
      color,
      maxWidth: contentWidth,
    });
    y -= size + 4;
  };

  const addWrappedText = (text, size, font, color, indent = 0) => {
    const lines = wrapText(text, contentWidth - indent, size);
    for (const line of lines) {
      if (y < margin + 50) {
        page = pdfDoc.addPage([612, 792]);
        y = height - margin;
      }
      page.drawText(line, {
        x: margin + indent,
        y,
        size,
        font,
        color,
      });
      y -= lineHeight;
    }
  };

  // Header
  addText(sampleData.businessName, 24, helveticaBold, rgb(0.05, 0.1, 0.2), true);
  addText(sampleData.businessPhone + " · " + sampleData.businessEmail, 9, helvetica, rgb(0.5, 0.5, 0.5));
  addText(sampleData.businessAddress + " · Lic# " + sampleData.licenseNumber, 9, helvetica, rgb(0.5, 0.5, 0.5));
  y -= 10;

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 2,
    color: rgb(0.2, 0.4, 0.8),
  });
  y -= 20;

  // Title and dates
  addText(sampleData.jobTitle, 18, helveticaBold, rgb(0, 0, 0), true);
  addText(`Prepared for: ${sampleData.clientName}  ·  Date: ${sampleData.preparedDate}  ·  Valid until: ${sampleData.validUntil}`, 9, helvetica, rgb(0.3, 0.3, 0.3));
  y -= 15;

  // Client info boxes
  const boxHeight = 90;
  const boxWidth = (contentWidth - 20) / 3;

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

  let colY = y - 8;
  page.drawText("CLIENT INFORMATION", { x: margin + 5, y: colY, size: 9, font: helveticaBold, color: rgb(0.6, 0.6, 0.8) });
  colY -= 12;
  page.drawText(sampleData.clientName, { x: margin + 5, y: colY, size: 9, font: helveticaBold, color: rgb(0, 0, 0) });
  colY -= 11;
  const addressLines = sampleData.clientAddress.split(",");
  page.drawText(addressLines[0], { x: margin + 5, y: colY, size: 8, font: helvetica, color: rgb(0, 0, 0) });
  colY -= 10;
  page.drawText(addressLines.slice(1).join(","), { x: margin + 5, y: colY, size: 8, font: helvetica, color: rgb(0, 0, 0) });
  colY -= 10;
  page.drawText(sampleData.clientPhone, { x: margin + 5, y: colY, size: 8, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
  colY -= 10;
  page.drawText(sampleData.clientEmail, { x: margin + 5, y: colY, size: 8, font: helvetica, color: rgb(0.3, 0.3, 0.3) });

  const col2X = margin + boxWidth + 15;
  colY = y - 8;
  page.drawText("JOB SITE", { x: col2X, y: colY, size: 9, font: helveticaBold, color: rgb(0.6, 0.6, 0.8) });
  colY -= 12;
  page.drawText(sampleData.jobSite, { x: col2X, y: colY, size: 9, font: helveticaBold, color: rgb(0, 0, 0) });
  colY -= 11;
  page.drawText(sampleData.jobDetails, { x: col2X, y: colY, size: 8, font: helvetica, color: rgb(0.3, 0.3, 0.3), maxWidth: boxWidth - 10 });

  const col3X = margin + 2 * (boxWidth + 10);
  colY = y - 8;
  page.drawText("PROJECT DETAILS", { x: col3X, y: colY, size: 9, font: helveticaBold, color: rgb(0.6, 0.6, 0.8) });
  colY -= 12;
  page.drawText(sampleData.projectDetails, { x: col3X, y: colY, size: 8, font: helvetica, color: rgb(0, 0, 0), maxWidth: boxWidth - 10 });

  y -= boxHeight + 25;

  // Executive Summary
  addText("EXECUTIVE SUMMARY", 12, helveticaBold, rgb(0, 0, 0), true);
  addWrappedText(sampleData.executiveSummary, 9, helvetica, rgb(0.2, 0.2, 0.2));
  y -= 8;

  // Scope of Work
  addText("SCOPE OF WORK", 12, helveticaBold, rgb(0, 0, 0), true);
  for (const item of sampleData.scopeOfWork) {
    addWrappedText("• " + item, 8, helvetica, rgb(0.2, 0.2, 0.2), 10);
  }
  y -= 8;

  // Materials
  addText("MATERIALS & EQUIPMENT", 12, helveticaBold, rgb(0, 0, 0), true);
  for (const item of sampleData.materials) {
    addWrappedText("• " + item, 8, helvetica, rgb(0.2, 0.2, 0.2), 10);
  }
  y -= 8;

  // Project Timeline
  addText("PROJECT TIMELINE", 12, helveticaBold, rgb(0, 0, 0), true);
  for (const item of sampleData.timeline) {
    addWrappedText("• " + item, 8, helvetica, rgb(0.2, 0.2, 0.2), 10);
  }
  y -= 8;

  // Why Choose Us
  addText("WHY CHOOSE US", 12, helveticaBold, rgb(0, 0, 0), true);
  addWrappedText(sampleData.whyChooseUs, 9, helvetica, rgb(0.2, 0.2, 0.2));
  y -= 12;

  // Investment Summary
  addText("INVESTMENT SUMMARY", 12, helveticaBold, rgb(0, 0, 0), true);
  const summaryX = margin + 250;
  addText("Labor Cost:", 10, helvetica, rgb(0, 0, 0));
  page.drawText("$" + sampleData.laborCost.toLocaleString(), { x: summaryX, y: y + 2, size: 10, font: helveticaBold, color: rgb(0, 0, 0) });
  y -= 14;
  addText("Materials Cost:", 10, helvetica, rgb(0, 0, 0));
  page.drawText("$" + sampleData.materialsCost.toLocaleString(), { x: summaryX, y: y + 2, size: 10, font: helveticaBold, color: rgb(0, 0, 0) });
  y -= 14;

  page.drawLine({
    start: { x: margin, y },
    end: { x: summaryX + 100, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 14;

  addText("TOTAL INVESTMENT:", 11, helveticaBold, rgb(0.2, 0.4, 0.8), true);
  page.drawText("$" + sampleData.totalCost.toLocaleString(), { x: summaryX, y: y + 2, size: 11, font: helveticaBold, color: rgb(0.2, 0.4, 0.8) });
  y -= 18;

  // Terms
  addText("TERMS & CONDITIONS", 12, helveticaBold, rgb(0, 0, 0), true);
  addWrappedText(sampleData.termsAndConditions, 9, helvetica, rgb(0.2, 0.2, 0.2));

  return pdfDoc;
}

async function main() {
  const outputDir = path.join(__dirname, "..", "sample-proposals");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const [tradeType, sampleData] of Object.entries(ENHANCED_SAMPLES)) {
    console.log(`Generating enhanced ${tradeType} sample proposal...`);
    const pdfDoc = await generateEnhancedProposal(tradeType, sampleData);
    const pdfPath = path.join(outputDir, `sample_proposal_${tradeType}.pdf`);
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfPath, pdfBytes);
    console.log(`✓ Saved to ${pdfPath} (${Math.round(pdfBytes.length / 1024)} KB)`);
  }

  console.log("\n✓ All enhanced sample proposals generated successfully!");
  console.log(`Output directory: ${outputDir}`);
}

main().catch(console.error);
