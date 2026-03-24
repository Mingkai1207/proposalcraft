
import { generateProposalPdf } from "../server/utils/proposalPdfExport.ts";
import fs from "fs";

const data = {
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
  jobSite: "4412 Meadowbrook Lane, Austin, TX 78745 — Single-family home, 2,400 sq ft, 2-story, 3 zones",
  jobDetails: "",
  projectDetails: "",
  executiveSummary: "This proposal outlines the comprehensive replacement of your existing 3-ton HVAC system at 4412 Meadowbrook Lane with a new, high-efficiency Carrier 16 SEER system. Our solution ensures improved comfort, energy savings, and reliable performance for your property, backed by our commitment to quality workmanship and 25 years of industry experience.",
  scopeOfWork: [
    "System Disconnection & Removal: Safely disconnect and remove the existing 3-ton outdoor air conditioning unit and indoor coil/furnace. All old refrigerant will be recovered and disposed of environmentally responsibly.",
    "New Outdoor Unit Installation: Install a new Carrier 24ACC336A003 3-ton 16 SEER air conditioning condenser unit on an approved equipment pad in the existing location.",
    "New Indoor Coil Installation: Install a new Carrier evaporator coil, properly matched to the new outdoor unit, within your existing furnace or air handler plenum.",
    "Refrigerant Line Replacement: Install new, appropriately sized copper refrigerant lines between the new outdoor condenser unit and the new indoor evaporator coil with all necessary insulation and fittings.",
    "Thermostat Upgrade: Install a new Honeywell Home T6 Pro programmable thermostat for precise temperature control and energy management.",
    "Ductwork Inspection & Sealing: Inspect all accessible ductwork for leaks, damage, or disconnections. Seal any identified leaks with mastic sealant to improve system efficiency.",
    "Electrical Connections: Make all necessary electrical connections for the new outdoor and indoor units, ensuring compliance with local electrical codes.",
    "System Startup & Testing: Perform complete system startup, charge verification, airflow testing across all zones, and operational check of all components."
  ],
  materials: [
    "Carrier 24ACC336A003 — 3-Ton 16 SEER AC Condenser Unit",
    "Carrier CNPVP3617ALA — Cased Evaporator Coil",
    "Honeywell Home T6 Pro Programmable Thermostat",
    '3/8" & 3/4" Insulated Copper Refrigerant Line Set (up to 50 ft)',
    "R-410A Refrigerant (factory charge + field adjustment)",
    "Condensate Drain Line & Safety Float Switch",
    "Equipment Mounting Pad & Vibration Isolators",
    "Mastic Duct Sealant & Foil Tape for Ductwork Repairs"
  ],
  timeline: [
    "Day 1 (Morning): Equipment delivery, site preparation, and removal of existing outdoor condenser and indoor coil.",
    "Day 1 (Afternoon): Installation of new outdoor condenser unit, new refrigerant lines, and electrical connections.",
    "Day 2 (Morning): Installation of new indoor evaporator coil, thermostat, and condensate drain.",
    "Day 2 (Afternoon): System startup, refrigerant charge verification, airflow testing, zone balancing, and final walkthrough with homeowner."
  ],
  whyChooseUs: "Arctic Breeze HVAC has served the Austin area for over 25 years. We are fully licensed, bonded, and insured. Our technicians are NATE-certified and factory-trained on all major brands. We offer a 10-year parts warranty and a 2-year labor warranty on all installations. Our A+ BBB rating and 4.9-star Google reviews reflect our commitment to customer satisfaction.",
  termsAndConditions: "A 50% deposit ($3,848.50) is required upon acceptance of this proposal. The remaining balance is due upon satisfactory completion of the installation. This proposal is valid for 14 days from the date above. Any changes to the scope of work may result in additional charges, which will be communicated and approved in writing before proceeding. All work is guaranteed to meet or exceed local building codes and manufacturer specifications.",
  laborCost: 2450,
  materialsCost: 5247,
  totalCost: 7697,
};

const buf = await generateProposalPdf(data);
fs.writeFileSync("test-output.pdf", buf);
console.log("PDF saved to test-output.pdf (" + buf.length + " bytes)");
