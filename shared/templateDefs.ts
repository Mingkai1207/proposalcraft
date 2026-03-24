/**
 * ProposAI Template Definitions
 *
 * Each template defines:
 *  - id, name, trade, style variant
 *  - sections (ordered list of content blocks)
 *  - inputFields (what the user must fill in)
 *  - visualizations (data charts to auto-generate)
 *  - aiInstructions (per-section guidance for the fill engine)
 */

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "date"
  | "select"
  | "multiline_list";

export interface TemplateField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select fields
  hint?: string;
}

export type VisualizationType =
  | "cost_breakdown_pie"
  | "timeline_gantt"
  | "savings_bar"
  | "comparison_bar"
  | "roi_line"
  | "scope_checklist";

export interface TemplateVisualization {
  id: string;
  type: VisualizationType;
  title: string;
  /** Which input fields feed into this chart */
  dataFields: string[];
  description: string;
}

export type StyleVariant = "modern" | "classic" | "minimal";

export interface TemplateSection {
  id: string;
  title: string;
  /** "ai_filled" = AI expands user inputs; "user_filled" = rendered directly; "visualization" = chart */
  type: "ai_filled" | "user_filled" | "visualization";
  /** For ai_filled: which input fields the AI should use */
  inputFields?: string[];
  /** For visualization: which visualization id */
  visualizationId?: string;
  /** Guidance for the AI when filling this section */
  aiPrompt?: string;
}

export interface ProposalTemplateDef {
  id: string;
  name: string;
  trade: string;
  style: StyleVariant;
  description: string;
  /** Accent color for this template style */
  accentColor: string;
  secondaryColor: string;
  sections: TemplateSection[];
  inputFields: TemplateField[];
  visualizations: TemplateVisualization[];
}

// ─── Shared field sets ────────────────────────────────────────────────────────

const CLIENT_FIELDS: TemplateField[] = [
  { id: "clientName", label: "Client Name", type: "text", placeholder: "John & Sarah Smith", required: true },
  { id: "clientAddress", label: "Property Address", type: "text", placeholder: "123 Main St, Austin TX 78701", required: true },
  { id: "clientEmail", label: "Client Email", type: "text", placeholder: "client@email.com", required: false },
];

const COST_FIELDS: TemplateField[] = [
  { id: "laborCost", label: "Labor Cost ($)", type: "currency", placeholder: "3500", required: false, hint: "Leave blank to let AI estimate" },
  { id: "materialsCost", label: "Materials Cost ($)", type: "currency", placeholder: "2500", required: false },
  { id: "totalCost", label: "Total Investment ($)", type: "currency", placeholder: "6000", required: false },
];

const TIMELINE_FIELD: TemplateField = {
  id: "timeline", label: "Estimated Timeline", type: "text", placeholder: "3–5 business days", required: false,
};

const SCOPE_FIELD: TemplateField = {
  id: "jobScope", label: "Job Scope (bullet points or description)", type: "textarea",
  placeholder: "- Replace 200A main panel\n- Install 4 new circuits\n- Add GFCI outlets in kitchen/bathrooms",
  required: true,
  hint: "Enter bullet points or a short description — AI will expand into professional paragraphs",
};

// ─── Template definitions ─────────────────────────────────────────────────────

export const TEMPLATE_DEFS: ProposalTemplateDef[] = [

  // ── HVAC Modern ──────────────────────────────────────────────────────────────
  {
    id: "hvac-modern",
    name: "HVAC — Modern",
    trade: "hvac",
    style: "modern",
    description: "Bold blue gradient header, cost breakdown pie chart, and Gantt timeline. Ideal for system replacements and new installs.",
    accentColor: "#1e40af",
    secondaryColor: "#dbeafe",
    inputFields: [
      ...CLIENT_FIELDS,
      SCOPE_FIELD,
      { id: "systemType", label: "System Type", type: "select", required: true,
        options: ["Central A/C + Furnace", "Heat Pump System", "Mini-Split / Ductless", "Boiler System", "Ductwork Only", "Air Handler Replacement"] },
      { id: "systemSize", label: "System Size (tons/BTU)", type: "text", placeholder: "3-ton / 36,000 BTU", required: false },
      { id: "seerRating", label: "SEER2 Rating", type: "text", placeholder: "18 SEER2", required: false },
      { id: "brandModel", label: "Brand & Model", type: "text", placeholder: "Carrier 24ACC636A003", required: false },
      { id: "materials", label: "Additional Materials / Equipment", type: "textarea", placeholder: "Refrigerant lines, thermostat, disconnect box...", required: false },
      TIMELINE_FIELD,
      ...COST_FIELDS,
      { id: "warranty", label: "Warranty Terms", type: "text", placeholder: "10-year parts, 2-year labor", required: false },
    ],
    sections: [
      { id: "executive_summary", title: "Executive Summary", type: "ai_filled",
        inputFields: ["clientName", "clientAddress", "systemType", "jobScope"],
        aiPrompt: "Write a 2-3 sentence executive summary that states what system is being installed/replaced, the property address, and the key benefit (comfort, efficiency, reliability). Be specific and confident." },
      { id: "scope_of_work", title: "Scope of Work", type: "ai_filled",
        inputFields: ["jobScope", "systemType", "systemSize", "seerRating", "brandModel"],
        aiPrompt: "Expand the job scope into a detailed, numbered list of work items. Use HVAC terminology: SEER2, BTU, tonnage, refrigerant type, load calculation, ductwork CFM. Each item should be a complete sentence describing exactly what will be done." },
      { id: "materials_equipment", title: "Materials & Equipment", type: "ai_filled",
        inputFields: ["systemType", "brandModel", "seerRating", "materials"],
        aiPrompt: "List all equipment and materials with specifications. Include brand, model number, SEER2/AFUE rating, warranty info. Format as a clean bulleted list with specs on each line." },
      { id: "cost_visualization", title: "Investment Breakdown", type: "visualization", visualizationId: "cost_breakdown_pie" },
      { id: "timeline", title: "Project Timeline", type: "visualization", visualizationId: "timeline_gantt" },
      { id: "why_us", title: "Why Choose Us", type: "ai_filled",
        inputFields: ["systemType"],
        aiPrompt: "Write 3-4 sentences about why this contractor is the right choice. Mention EPA 608 certification, manufacturer authorization, permit-pulling capability, and post-install commissioning. Keep it confident but not boastful." },
      { id: "terms", title: "Terms & Conditions", type: "ai_filled",
        inputFields: ["totalCost", "warranty"],
        aiPrompt: "Write standard HVAC contractor terms: 50% deposit on signing, balance due on completion, warranty terms, permit responsibility, change order policy, and liability. Be specific and professional." },
    ],
    visualizations: [
      { id: "cost_breakdown_pie", type: "cost_breakdown_pie", title: "Investment Breakdown",
        dataFields: ["laborCost", "materialsCost", "totalCost"],
        description: "Pie chart showing labor vs. materials split" },
      { id: "timeline_gantt", type: "timeline_gantt", title: "Project Schedule",
        dataFields: ["timeline", "jobScope"],
        description: "Horizontal bar chart showing project phases and durations" },
    ],
  },

  // ── HVAC Classic ─────────────────────────────────────────────────────────────
  {
    id: "hvac-classic",
    name: "HVAC — Classic",
    trade: "hvac",
    style: "classic",
    description: "Traditional dark navy header with serif typography. Professional and conservative — preferred by commercial clients.",
    accentColor: "#1e3a5f",
    secondaryColor: "#f0f4f8",
    inputFields: [
      ...CLIENT_FIELDS,
      SCOPE_FIELD,
      { id: "systemType", label: "System Type", type: "select", required: true,
        options: ["Central A/C + Furnace", "Heat Pump System", "Mini-Split / Ductless", "Boiler System", "Ductwork Only", "Air Handler Replacement"] },
      { id: "systemSize", label: "System Size", type: "text", placeholder: "3-ton / 36,000 BTU", required: false },
      { id: "seerRating", label: "SEER2 Rating", type: "text", placeholder: "18 SEER2", required: false },
      { id: "brandModel", label: "Brand & Model", type: "text", placeholder: "Carrier 24ACC636A003", required: false },
      { id: "materials", label: "Additional Materials", type: "textarea", placeholder: "Refrigerant lines, thermostat...", required: false },
      TIMELINE_FIELD,
      ...COST_FIELDS,
      { id: "warranty", label: "Warranty Terms", type: "text", placeholder: "10-year parts, 2-year labor", required: false },
    ],
    sections: [
      { id: "executive_summary", title: "Executive Summary", type: "ai_filled",
        inputFields: ["clientName", "clientAddress", "systemType", "jobScope"],
        aiPrompt: "Write a formal 2-3 sentence executive summary for a commercial or residential HVAC proposal. Emphasize reliability, code compliance, and professional installation." },
      { id: "scope_of_work", title: "Scope of Work", type: "ai_filled",
        inputFields: ["jobScope", "systemType", "systemSize", "seerRating", "brandModel"],
        aiPrompt: "Write a detailed scope of work in formal paragraph style (not bullet points). Use precise HVAC terminology. Describe each phase of work: removal of existing equipment, installation, commissioning, and testing." },
      { id: "materials_equipment", title: "Specified Equipment", type: "ai_filled",
        inputFields: ["brandModel", "seerRating", "materials"],
        aiPrompt: "List all specified equipment in a formal table-style format with columns: Item, Specification, Quantity. Include model numbers and ratings." },
      { id: "cost_visualization", title: "Cost Summary", type: "visualization", visualizationId: "cost_breakdown_pie" },
      { id: "timeline", title: "Project Schedule", type: "visualization", visualizationId: "timeline_gantt" },
      { id: "terms", title: "Terms & Conditions", type: "ai_filled",
        inputFields: ["totalCost", "warranty"],
        aiPrompt: "Write formal contractor terms in paragraph style. Cover payment schedule, warranty, permits, insurance, change orders, and dispute resolution." },
    ],
    visualizations: [
      { id: "cost_breakdown_pie", type: "cost_breakdown_pie", title: "Cost Summary",
        dataFields: ["laborCost", "materialsCost", "totalCost"], description: "Labor vs. materials breakdown" },
      { id: "timeline_gantt", type: "timeline_gantt", title: "Project Schedule",
        dataFields: ["timeline", "jobScope"], description: "Project phases timeline" },
    ],
  },

  // ── HVAC Minimal ─────────────────────────────────────────────────────────────
  {
    id: "hvac-minimal",
    name: "HVAC — Minimal",
    trade: "hvac",
    style: "minimal",
    description: "Clean white layout with subtle gray accents. Lets the content speak. Fast to read on mobile.",
    accentColor: "#374151",
    secondaryColor: "#f9fafb",
    inputFields: [
      ...CLIENT_FIELDS,
      SCOPE_FIELD,
      { id: "systemType", label: "System Type", type: "select", required: true,
        options: ["Central A/C + Furnace", "Heat Pump System", "Mini-Split / Ductless", "Boiler System", "Ductwork Only", "Air Handler Replacement"] },
      { id: "brandModel", label: "Brand & Model", type: "text", placeholder: "Carrier 24ACC636A003", required: false },
      TIMELINE_FIELD,
      ...COST_FIELDS,
    ],
    sections: [
      { id: "executive_summary", title: "Overview", type: "ai_filled",
        inputFields: ["clientName", "systemType", "jobScope"],
        aiPrompt: "Write a concise 2-sentence overview. Direct and clear — no fluff." },
      { id: "scope_of_work", title: "What We'll Do", type: "ai_filled",
        inputFields: ["jobScope", "systemType", "brandModel"],
        aiPrompt: "Write a clean, scannable list of work items. Short, action-oriented sentences. No jargon overload." },
      { id: "cost_visualization", title: "Investment", type: "visualization", visualizationId: "cost_breakdown_pie" },
      { id: "timeline", title: "Timeline", type: "visualization", visualizationId: "timeline_gantt" },
      { id: "terms", title: "Terms", type: "ai_filled",
        inputFields: ["totalCost"],
        aiPrompt: "Write brief, plain-English terms. 50% deposit, balance on completion, 1-year labor warranty. Keep it under 100 words." },
    ],
    visualizations: [
      { id: "cost_breakdown_pie", type: "cost_breakdown_pie", title: "Investment Breakdown",
        dataFields: ["laborCost", "materialsCost", "totalCost"], description: "Cost split" },
      { id: "timeline_gantt", type: "timeline_gantt", title: "Timeline",
        dataFields: ["timeline", "jobScope"], description: "Project schedule" },
    ],
  },

  // ── Roofing Modern ───────────────────────────────────────────────────────────
  {
    id: "roofing-modern",
    name: "Roofing — Modern",
    trade: "roofing",
    style: "modern",
    description: "Rich terracotta header with material comparison chart and savings visualization. Great for full replacements.",
    accentColor: "#b45309",
    secondaryColor: "#fef3c7",
    inputFields: [
      ...CLIENT_FIELDS,
      SCOPE_FIELD,
      { id: "roofType", label: "Roof Type", type: "select", required: true,
        options: ["Asphalt Shingles", "Metal Roofing", "TPO / Flat Roof", "Tile Roofing", "Cedar Shake", "EPDM"] },
      { id: "roofSize", label: "Roof Size (sq ft)", type: "number", placeholder: "2400", required: false },
      { id: "shingleBrand", label: "Shingle Brand & Grade", type: "text", placeholder: "GAF Timberline HDZ, 30-year", required: false },
      { id: "pitch", label: "Roof Pitch", type: "text", placeholder: "6/12", required: false },
      { id: "layers", label: "Existing Layers to Remove", type: "select", required: false, options: ["1 layer", "2 layers", "3 layers"] },
      { id: "materials", label: "Additional Materials", type: "textarea", placeholder: "Ice & water shield, drip edge, ridge cap...", required: false },
      TIMELINE_FIELD,
      ...COST_FIELDS,
      { id: "warranty", label: "Warranty", type: "text", placeholder: "50-year manufacturer, 10-year workmanship", required: false },
    ],
    sections: [
      { id: "executive_summary", title: "Executive Summary", type: "ai_filled",
        inputFields: ["clientName", "clientAddress", "roofType", "jobScope"],
        aiPrompt: "Write a 2-3 sentence executive summary for a roofing proposal. Mention the roof type, property, and key benefit (protection, curb appeal, energy savings)." },
      { id: "scope_of_work", title: "Scope of Work", type: "ai_filled",
        inputFields: ["jobScope", "roofType", "roofSize", "layers", "pitch"],
        aiPrompt: "Expand into a detailed numbered scope. Use roofing terminology: tear-off, underlayment, ice & water shield, drip edge, flashing, ridge cap, decking inspection. Mention permit and inspection steps." },
      { id: "materials_equipment", title: "Materials Specified", type: "ai_filled",
        inputFields: ["roofType", "shingleBrand", "materials", "warranty"],
        aiPrompt: "List all materials with specs: shingle type, brand, grade, wind rating, fire rating, warranty. Include underlayment, ice shield, and flashings." },
      { id: "cost_visualization", title: "Investment Breakdown", type: "visualization", visualizationId: "cost_breakdown_pie" },
      { id: "comparison", title: "Material Comparison", type: "visualization", visualizationId: "comparison_bar" },
      { id: "timeline", title: "Project Schedule", type: "visualization", visualizationId: "timeline_gantt" },
      { id: "why_us", title: "Why Choose Us", type: "ai_filled",
        inputFields: ["roofType"],
        aiPrompt: "3-4 sentences on contractor credentials: manufacturer certification, insurance, permit-pulling, cleanup process, and warranty backing." },
      { id: "terms", title: "Terms & Conditions", type: "ai_filled",
        inputFields: ["totalCost", "warranty"],
        aiPrompt: "Standard roofing terms: deposit, payment on completion, warranty, permit responsibility, weather delays, debris removal, and damage discovery policy." },
    ],
    visualizations: [
      { id: "cost_breakdown_pie", type: "cost_breakdown_pie", title: "Investment Breakdown",
        dataFields: ["laborCost", "materialsCost", "totalCost"], description: "Labor vs. materials" },
      { id: "comparison_bar", type: "comparison_bar", title: "Roofing Material Comparison",
        dataFields: ["roofType"], description: "Lifespan, cost, and maintenance comparison of common roofing materials" },
      { id: "timeline_gantt", type: "timeline_gantt", title: "Project Schedule",
        dataFields: ["timeline", "jobScope"], description: "Day-by-day project phases" },
    ],
  },

  // ── Solar Modern ─────────────────────────────────────────────────────────────
  {
    id: "solar-modern",
    name: "Solar — Modern",
    trade: "solar",
    style: "modern",
    description: "Vibrant green header with ROI line chart, savings bar chart, and payback period visualization. Designed to close deals.",
    accentColor: "#15803d",
    secondaryColor: "#dcfce7",
    inputFields: [
      ...CLIENT_FIELDS,
      SCOPE_FIELD,
      { id: "systemSize", label: "System Size (kW)", type: "number", placeholder: "8.4", required: true },
      { id: "panelCount", label: "Number of Panels", type: "number", placeholder: "21", required: false },
      { id: "panelBrand", label: "Panel Brand & Model", type: "text", placeholder: "REC Alpha Pure 400W", required: false },
      { id: "inverterType", label: "Inverter Type", type: "select", required: false,
        options: ["String Inverter", "Microinverters (Enphase)", "Power Optimizers (SolarEdge)", "Hybrid (battery-ready)"] },
      { id: "batteryStorage", label: "Battery Storage", type: "text", placeholder: "Tesla Powerwall 13.5 kWh (optional)", required: false },
      { id: "annualProduction", label: "Estimated Annual Production (kWh)", type: "number", placeholder: "11200", required: false },
      { id: "currentBill", label: "Current Monthly Electric Bill ($)", type: "currency", placeholder: "220", required: false },
      { id: "utilityRate", label: "Utility Rate ($/kWh)", type: "number", placeholder: "0.14", required: false },
      TIMELINE_FIELD,
      ...COST_FIELDS,
      { id: "incentives", label: "Available Incentives", type: "textarea",
        placeholder: "Federal ITC 30%, State rebate $1,500, Net metering", required: false },
    ],
    sections: [
      { id: "executive_summary", title: "Executive Summary", type: "ai_filled",
        inputFields: ["clientName", "clientAddress", "systemSize", "jobScope", "currentBill"],
        aiPrompt: "Write a compelling 3-sentence executive summary. Lead with the financial benefit (estimated savings, payback period), then mention the system size and clean energy impact. Make it exciting." },
      { id: "scope_of_work", title: "System Design & Installation", type: "ai_filled",
        inputFields: ["jobScope", "systemSize", "panelCount", "panelBrand", "inverterType", "batteryStorage"],
        aiPrompt: "Detail the full installation scope: site assessment, permit filing, roof mounting, panel installation, inverter wiring, utility interconnection, and commissioning. Use solar terminology: kW, kWh, string sizing, net metering, interconnection agreement." },
      { id: "materials_equipment", title: "Equipment Specifications", type: "ai_filled",
        inputFields: ["panelBrand", "panelCount", "inverterType", "batteryStorage", "systemSize"],
        aiPrompt: "List all equipment with full specs: panel model, wattage, efficiency %, temperature coefficient, warranty. Inverter model, efficiency, warranty. Battery model, capacity, round-trip efficiency." },
      { id: "roi_visualization", title: "Return on Investment", type: "visualization", visualizationId: "roi_line" },
      { id: "savings_visualization", title: "Annual Savings Projection", type: "visualization", visualizationId: "savings_bar" },
      { id: "cost_visualization", title: "Investment Breakdown", type: "visualization", visualizationId: "cost_breakdown_pie" },
      { id: "incentives_section", title: "Incentives & Financing", type: "ai_filled",
        inputFields: ["incentives", "totalCost"],
        aiPrompt: "Explain all available incentives clearly: federal ITC (30%), state rebates, utility rebates, net metering value, and SREC income if applicable. Calculate net cost after incentives. Mention financing options if relevant." },
      { id: "timeline", title: "Project Timeline", type: "visualization", visualizationId: "timeline_gantt" },
      { id: "terms", title: "Terms & Conditions", type: "ai_filled",
        inputFields: ["totalCost", "incentives"],
        aiPrompt: "Solar-specific terms: deposit, permit timeline, utility interconnection timeline, production guarantee, workmanship warranty (10 years), panel warranty (25 years), inverter warranty. Change order policy." },
    ],
    visualizations: [
      { id: "roi_line", type: "roi_line", title: "25-Year ROI Projection",
        dataFields: ["totalCost", "currentBill", "annualProduction", "utilityRate", "incentives"],
        description: "Cumulative savings vs. system cost over 25 years" },
      { id: "savings_bar", type: "savings_bar", title: "Annual Savings by Year",
        dataFields: ["currentBill", "annualProduction", "utilityRate"],
        description: "Year-by-year electricity bill savings" },
      { id: "cost_breakdown_pie", type: "cost_breakdown_pie", title: "Investment Breakdown",
        dataFields: ["laborCost", "materialsCost", "totalCost"], description: "Labor vs. equipment split" },
      { id: "timeline_gantt", type: "timeline_gantt", title: "Installation Timeline",
        dataFields: ["timeline", "jobScope"], description: "Project phases" },
    ],
  },

  // ── Electrical Modern ────────────────────────────────────────────────────────
  {
    id: "electrical-modern",
    name: "Electrical — Modern",
    trade: "electrical",
    style: "modern",
    description: "Deep indigo header with circuit scope checklist and cost breakdown. Clear and technical.",
    accentColor: "#4338ca",
    secondaryColor: "#e0e7ff",
    inputFields: [
      ...CLIENT_FIELDS,
      SCOPE_FIELD,
      { id: "panelSize", label: "Panel Size (Amps)", type: "select", required: false,
        options: ["100A", "150A", "200A", "400A", "Other"] },
      { id: "circuitCount", label: "Number of New Circuits", type: "number", placeholder: "4", required: false },
      { id: "materials", label: "Materials / Fixtures", type: "textarea",
        placeholder: "GFCI outlets, arc-fault breakers, LED fixtures...", required: false },
      TIMELINE_FIELD,
      ...COST_FIELDS,
      { id: "warranty", label: "Warranty", type: "text", placeholder: "1-year labor warranty", required: false },
    ],
    sections: [
      { id: "executive_summary", title: "Executive Summary", type: "ai_filled",
        inputFields: ["clientName", "clientAddress", "jobScope"],
        aiPrompt: "Write a 2-3 sentence executive summary for an electrical proposal. Emphasize safety, NEC code compliance, and permit-backed work." },
      { id: "scope_of_work", title: "Scope of Work", type: "ai_filled",
        inputFields: ["jobScope", "panelSize", "circuitCount", "materials"],
        aiPrompt: "Expand into a detailed numbered scope. Use electrical terminology: AFCI/GFCI protection, wire gauge (AWG), conduit type (EMT/PVC), load calculation, panel amperage, NEC code sections. Each item should be a complete sentence." },
      { id: "scope_checklist", title: "Work Item Checklist", type: "visualization", visualizationId: "scope_checklist" },
      { id: "cost_visualization", title: "Investment Breakdown", type: "visualization", visualizationId: "cost_breakdown_pie" },
      { id: "timeline", title: "Project Schedule", type: "visualization", visualizationId: "timeline_gantt" },
      { id: "terms", title: "Terms & Conditions", type: "ai_filled",
        inputFields: ["totalCost", "warranty"],
        aiPrompt: "Electrical contractor terms: deposit, permit responsibility, inspection scheduling, warranty, change order policy, and code compliance guarantee." },
    ],
    visualizations: [
      { id: "scope_checklist", type: "scope_checklist", title: "Work Item Checklist",
        dataFields: ["jobScope"], description: "Visual checklist of all work items" },
      { id: "cost_breakdown_pie", type: "cost_breakdown_pie", title: "Investment Breakdown",
        dataFields: ["laborCost", "materialsCost", "totalCost"], description: "Labor vs. materials" },
      { id: "timeline_gantt", type: "timeline_gantt", title: "Project Schedule",
        dataFields: ["timeline", "jobScope"], description: "Project phases" },
    ],
  },

  // ── Painting Modern ──────────────────────────────────────────────────────────
  {
    id: "painting-modern",
    name: "Painting — Modern",
    trade: "painting",
    style: "modern",
    description: "Warm amber header with surface area breakdown and scope checklist. Clean and visual.",
    accentColor: "#d97706",
    secondaryColor: "#fef9c3",
    inputFields: [
      ...CLIENT_FIELDS,
      SCOPE_FIELD,
      { id: "paintType", label: "Paint Type", type: "select", required: false,
        options: ["Interior — Walls & Ceilings", "Exterior — Siding & Trim", "Interior + Exterior", "Cabinets", "Deck / Fence", "Commercial"] },
      { id: "squareFootage", label: "Total Square Footage", type: "number", placeholder: "2200", required: false },
      { id: "paintBrand", label: "Paint Brand & Line", type: "text", placeholder: "Sherwin-Williams Duration, Satin", required: false },
      { id: "coats", label: "Number of Coats", type: "select", required: false, options: ["1 coat", "2 coats", "3 coats"] },
      { id: "surfacePrep", label: "Surface Prep Required", type: "textarea",
        placeholder: "Patch holes, sand rough areas, prime bare wood...", required: false },
      TIMELINE_FIELD,
      ...COST_FIELDS,
    ],
    sections: [
      { id: "executive_summary", title: "Executive Summary", type: "ai_filled",
        inputFields: ["clientName", "clientAddress", "paintType", "jobScope"],
        aiPrompt: "Write a 2-3 sentence executive summary for a painting proposal. Mention the scope (interior/exterior), the quality of materials, and the expected result." },
      { id: "scope_of_work", title: "Scope of Work", type: "ai_filled",
        inputFields: ["jobScope", "paintType", "squareFootage", "coats", "surfacePrep", "paintBrand"],
        aiPrompt: "Expand into a detailed scope. Use painting terminology: surface prep (sanding, patching, priming), paint type (latex/oil), sheen level, mil thickness, VOC content, number of coats. List rooms/areas separately." },
      { id: "scope_checklist", title: "Work Checklist", type: "visualization", visualizationId: "scope_checklist" },
      { id: "cost_visualization", title: "Investment Breakdown", type: "visualization", visualizationId: "cost_breakdown_pie" },
      { id: "timeline", title: "Project Schedule", type: "visualization", visualizationId: "timeline_gantt" },
      { id: "terms", title: "Terms & Conditions", type: "ai_filled",
        inputFields: ["totalCost"],
        aiPrompt: "Painting contractor terms: deposit, payment on completion, touch-up policy (30-day), furniture moving policy, color change policy, and warranty." },
    ],
    visualizations: [
      { id: "scope_checklist", type: "scope_checklist", title: "Work Checklist",
        dataFields: ["jobScope"], description: "Visual checklist of all areas" },
      { id: "cost_breakdown_pie", type: "cost_breakdown_pie", title: "Investment Breakdown",
        dataFields: ["laborCost", "materialsCost", "totalCost"], description: "Labor vs. materials" },
      { id: "timeline_gantt", type: "timeline_gantt", title: "Project Schedule",
        dataFields: ["timeline", "jobScope"], description: "Day-by-day schedule" },
    ],
  },

  // ── Plumbing Modern ──────────────────────────────────────────────────────────
  {
    id: "plumbing-modern",
    name: "Plumbing — Modern",
    trade: "plumbing",
    style: "modern",
    description: "Cool teal header with scope checklist and cost breakdown. Precise and professional.",
    accentColor: "#0f766e",
    secondaryColor: "#ccfbf1",
    inputFields: [
      ...CLIENT_FIELDS,
      SCOPE_FIELD,
      { id: "plumbingType", label: "Work Type", type: "select", required: false,
        options: ["Pipe Replacement / Repiping", "Fixture Installation", "Water Heater", "Drain / Sewer", "Bathroom Remodel Rough-In", "Kitchen Rough-In", "Leak Repair"] },
      { id: "pipeType", label: "Pipe Material", type: "select", required: false,
        options: ["PEX", "Copper", "CPVC", "PVC", "ABS", "Galvanized (removal)"] },
      { id: "materials", label: "Fixtures / Materials", type: "textarea",
        placeholder: "Kohler toilet, Moen faucet, 50-gal water heater...", required: false },
      TIMELINE_FIELD,
      ...COST_FIELDS,
      { id: "warranty", label: "Warranty", type: "text", placeholder: "1-year labor warranty", required: false },
    ],
    sections: [
      { id: "executive_summary", title: "Executive Summary", type: "ai_filled",
        inputFields: ["clientName", "clientAddress", "plumbingType", "jobScope"],
        aiPrompt: "Write a 2-3 sentence executive summary for a plumbing proposal. Emphasize code compliance, licensed work, and permit-backed installation." },
      { id: "scope_of_work", title: "Scope of Work", type: "ai_filled",
        inputFields: ["jobScope", "plumbingType", "pipeType", "materials"],
        aiPrompt: "Expand into a detailed numbered scope. Use plumbing terminology: pipe sizing, fixture units, GPM, PSI, drain slope (1/4\" per foot), venting, cleanouts, shut-offs, P-traps. Each item should be a complete sentence." },
      { id: "scope_checklist", title: "Work Checklist", type: "visualization", visualizationId: "scope_checklist" },
      { id: "cost_visualization", title: "Investment Breakdown", type: "visualization", visualizationId: "cost_breakdown_pie" },
      { id: "timeline", title: "Project Schedule", type: "visualization", visualizationId: "timeline_gantt" },
      { id: "terms", title: "Terms & Conditions", type: "ai_filled",
        inputFields: ["totalCost", "warranty"],
        aiPrompt: "Plumbing contractor terms: deposit, permit responsibility, inspection scheduling, warranty, change order policy, and code compliance." },
    ],
    visualizations: [
      { id: "scope_checklist", type: "scope_checklist", title: "Work Checklist",
        dataFields: ["jobScope"], description: "Visual checklist of all work items" },
      { id: "cost_breakdown_pie", type: "cost_breakdown_pie", title: "Investment Breakdown",
        dataFields: ["laborCost", "materialsCost", "totalCost"], description: "Labor vs. materials" },
      { id: "timeline_gantt", type: "timeline_gantt", title: "Project Schedule",
        dataFields: ["timeline", "jobScope"], description: "Project phases" },
    ],
  },

  // ── General Contracting Modern ───────────────────────────────────────────────
  {
    id: "general-modern",
    name: "General Contracting — Modern",
    trade: "general",
    style: "modern",
    description: "Versatile slate header with comparison chart and full cost breakdown. Works for any renovation project.",
    accentColor: "#475569",
    secondaryColor: "#f1f5f9",
    inputFields: [
      ...CLIENT_FIELDS,
      SCOPE_FIELD,
      { id: "projectType", label: "Project Type", type: "text", placeholder: "Kitchen remodel, basement finish, addition...", required: false },
      { id: "materials", label: "Key Materials", type: "textarea",
        placeholder: "Quartz countertops, LVP flooring, custom cabinets...", required: false },
      TIMELINE_FIELD,
      ...COST_FIELDS,
      { id: "warranty", label: "Warranty", type: "text", placeholder: "1-year workmanship warranty", required: false },
    ],
    sections: [
      { id: "executive_summary", title: "Executive Summary", type: "ai_filled",
        inputFields: ["clientName", "clientAddress", "projectType", "jobScope"],
        aiPrompt: "Write a 2-3 sentence executive summary for a general contracting proposal. Describe the project scope and the value delivered." },
      { id: "scope_of_work", title: "Scope of Work", type: "ai_filled",
        inputFields: ["jobScope", "projectType", "materials"],
        aiPrompt: "Expand into a detailed numbered scope of work. Be specific about materials, dimensions, and methods. Organize by phase (demo, rough-in, finish work)." },
      { id: "materials_equipment", title: "Materials & Specifications", type: "ai_filled",
        inputFields: ["materials"],
        aiPrompt: "List all key materials with specs: brand, model, grade, dimensions, finish. Format as a clean bulleted list." },
      { id: "cost_visualization", title: "Investment Breakdown", type: "visualization", visualizationId: "cost_breakdown_pie" },
      { id: "timeline", title: "Project Schedule", type: "visualization", visualizationId: "timeline_gantt" },
      { id: "terms", title: "Terms & Conditions", type: "ai_filled",
        inputFields: ["totalCost", "warranty"],
        aiPrompt: "Standard general contractor terms: deposit, draw schedule, warranty, change order policy, subcontractor disclosure, and lien waiver." },
    ],
    visualizations: [
      { id: "cost_breakdown_pie", type: "cost_breakdown_pie", title: "Investment Breakdown",
        dataFields: ["laborCost", "materialsCost", "totalCost"], description: "Labor vs. materials" },
      { id: "timeline_gantt", type: "timeline_gantt", title: "Project Schedule",
        dataFields: ["timeline", "jobScope"], description: "Project phases" },
    ],
  },
];

/** Get all templates for a given trade */
export function getTemplatesForTrade(trade: string): ProposalTemplateDef[] {
  return TEMPLATE_DEFS.filter(t => t.trade === trade);
}

/** Get a single template by id */
export function getTemplateById(id: string): ProposalTemplateDef | undefined {
  return TEMPLATE_DEFS.find(t => t.id === id);
}

/** All unique trades that have templates */
export const TEMPLATE_TRADES = Array.from(new Set(TEMPLATE_DEFS.map(t => t.trade)));

export const STYLE_LABELS: Record<StyleVariant, string> = {
  modern: "Modern",
  classic: "Classic",
  minimal: "Minimal",
};
