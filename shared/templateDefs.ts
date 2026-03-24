/**
 * ProposAI Template Definitions — Visual Styles Only
 *
 * Templates define LAYOUT and VISUAL STYLE, not trade type.
 * The trade type is captured in the proposal form and used by the AI
 * to generate appropriate terminology. All templates share the same
 * standard proposal sections; only the visual presentation differs.
 */

// ─── Visual Style Definitions ─────────────────────────────────────────────────

export interface TemplateStyle {
  id: string;
  name: string;
  tagline: string;
  description: string;
  primaryColor: string;     // CSS hex — header/accent
  accentColor: string;      // CSS hex — highlights, links
  bgColor: string;          // CSS hex — page background
  textColor: string;        // CSS hex — body text
  headerTextColor: string;  // CSS hex — text on primary background
  fontFamily: string;       // CSS font-family value
  headingFont: string;      // CSS font-family for headings
  previewGradient: string;  // CSS gradient for picker card
  badge: string;            // Short label shown on card
  badgeColor: string;       // Badge background color
}

export const TEMPLATE_STYLES: TemplateStyle[] = [
  {
    id: "modern-wave",
    name: "Modern Wave",
    tagline: "Clean, contemporary, professional",
    description:
      "A sleek teal-and-white layout with a curved wave header band and subtle section dividers. Ideal for modern service businesses that want to look polished and approachable.",
    primaryColor: "#0d9488",
    accentColor: "#0f766e",
    bgColor: "#ffffff",
    textColor: "#1e293b",
    headerTextColor: "#ffffff",
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    headingFont: "'Inter', 'Helvetica Neue', sans-serif",
    previewGradient: "linear-gradient(135deg, #0d9488 0%, #14b8a6 60%, #99f6e4 100%)",
    badge: "Most Popular",
    badgeColor: "#0d9488",
  },
  {
    id: "classic-letterhead",
    name: "Classic Letterhead",
    tagline: "Formal, trustworthy, traditional",
    description:
      "A deep navy-and-gold letterhead style with serif headings and a formal section structure. Best for established contractors who want to project authority and experience.",
    primaryColor: "#1e3a5f",
    accentColor: "#b8860b",
    bgColor: "#fffdf7",
    textColor: "#1a1a2e",
    headerTextColor: "#ffffff",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    headingFont: "'Georgia', 'Times New Roman', serif",
    previewGradient: "linear-gradient(135deg, #1e3a5f 0%, #2d5282 60%, #b8860b 100%)",
    badge: "Classic",
    badgeColor: "#1e3a5f",
  },
  {
    id: "bold-dark",
    name: "Bold Dark",
    tagline: "Striking, confident, memorable",
    description:
      "A dark slate header block with vivid orange accent highlights and strong typography. Makes an immediate visual impact — perfect for competitive bids where you want to stand out.",
    primaryColor: "#0f172a",
    accentColor: "#f97316",
    bgColor: "#ffffff",
    textColor: "#0f172a",
    headerTextColor: "#ffffff",
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    headingFont: "'Inter', 'Helvetica Neue', sans-serif",
    previewGradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #f97316 100%)",
    badge: "Stand Out",
    badgeColor: "#f97316",
  },
  {
    id: "minimal-clean",
    name: "Minimal Clean",
    tagline: "Simple, elegant, distraction-free",
    description:
      "No heavy backgrounds — just generous whitespace, thin rule lines, and a muted slate palette. Lets the content speak for itself. Great for high-end residential clients.",
    primaryColor: "#475569",
    accentColor: "#3b82f6",
    bgColor: "#f8fafc",
    textColor: "#1e293b",
    headerTextColor: "#1e293b",
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    headingFont: "'Inter', 'Helvetica Neue', sans-serif",
    previewGradient: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #3b82f6 100%)",
    badge: "Elegant",
    badgeColor: "#3b82f6",
  },
  {
    id: "executive-sidebar",
    name: "Executive Sidebar",
    tagline: "Structured, detailed, authoritative",
    description:
      "A deep green left sidebar contains the contractor info and key metrics, while the right column holds the full proposal body. Conveys thoroughness and professionalism.",
    primaryColor: "#14532d",
    accentColor: "#16a34a",
    bgColor: "#ffffff",
    textColor: "#1e293b",
    headerTextColor: "#ffffff",
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    headingFont: "'Inter', 'Helvetica Neue', sans-serif",
    previewGradient: "linear-gradient(135deg, #14532d 0%, #166534 60%, #86efac 100%)",
    badge: "Executive",
    badgeColor: "#14532d",
  },
];

export function getTemplateStyle(id: string): TemplateStyle {
  return TEMPLATE_STYLES.find((t) => t.id === id) ?? TEMPLATE_STYLES[0];
}

// ─── Trade Types ──────────────────────────────────────────────────────────────

export const TRADE_TYPES = [
  "HVAC",
  "Plumbing",
  "Electrical",
  "Roofing",
  "Painting",
  "Flooring",
  "Landscaping",
  "Carpentry",
  "Concrete",
  "Masonry",
  "Insulation",
  "Drywall",
  "Windows & Doors",
  "Solar",
  "General Contracting",
] as const;

export type TradeType = (typeof TRADE_TYPES)[number];

// ─── Payment Terms ────────────────────────────────────────────────────────────

export const PAYMENT_TERMS_OPTIONS = [
  "50% upfront, 50% on completion",
  "33% upfront, 33% at midpoint, 34% on completion",
  "100% on completion",
  "Net-30 after completion",
  "Weekly progress billing",
] as const;

// ─── Proposal Input Fields (same for all templates) ───────────────────────────

export type FieldType = "text" | "textarea" | "number" | "currency" | "date" | "select";

export interface ProposalInputField {
  id: string;
  label: string;
  type: FieldType;
  placeholder: string;
  required: boolean;
  options?: string[];
  hint?: string;
}

export const PROPOSAL_INPUT_FIELDS: ProposalInputField[] = [
  {
    id: "client_name",
    label: "Client Name",
    type: "text",
    placeholder: "John Smith",
    required: true,
  },
  {
    id: "client_address",
    label: "Client / Property Address",
    type: "text",
    placeholder: "123 Main St, Anytown, CA 90210",
    required: true,
  },
  {
    id: "client_email",
    label: "Client Email (optional)",
    type: "text",
    placeholder: "client@email.com",
    required: false,
  },
  {
    id: "project_title",
    label: "Project Title",
    type: "text",
    placeholder: "e.g. Kitchen Renovation, HVAC System Replacement",
    required: true,
  },
  {
    id: "trade_type",
    label: "Trade / Service Type",
    type: "select",
    placeholder: "Select trade",
    required: true,
    options: [...TRADE_TYPES],
  },
  {
    id: "job_description",
    label: "Job Description",
    type: "textarea",
    placeholder:
      "Describe the work to be done. Include key details like size, existing conditions, specific requirements, materials preferences...",
    required: true,
    hint: "The more detail you provide, the better the AI can fill in the proposal. Bullet points are fine.",
  },
  {
    id: "total_cost",
    label: "Total Project Cost ($)",
    type: "currency",
    placeholder: "8500",
    required: true,
  },
  {
    id: "labor_cost",
    label: "Labor Cost ($)",
    type: "currency",
    placeholder: "3500",
    required: false,
    hint: "Optional — used to generate the cost breakdown chart",
  },
  {
    id: "materials_cost",
    label: "Materials Cost ($)",
    type: "currency",
    placeholder: "5000",
    required: false,
  },
  {
    id: "estimated_days",
    label: "Estimated Duration (days)",
    type: "number",
    placeholder: "5",
    required: true,
  },
  {
    id: "start_date",
    label: "Proposed Start Date",
    type: "date",
    placeholder: "",
    required: false,
  },
  {
    id: "payment_terms",
    label: "Payment Terms",
    type: "select",
    placeholder: "Select payment terms",
    required: true,
    options: [...PAYMENT_TERMS_OPTIONS],
  },
  {
    id: "special_notes",
    label: "Special Notes / Additional Requirements",
    type: "textarea",
    placeholder:
      "Permit requirements, access restrictions, client preferences, warranty terms...",
    required: false,
  },
];

// ─── Standard Proposal Sections (same for all templates) ─────────────────────

export interface ProposalSection {
  id: string;
  title: string;
  aiPromptHint: string;
}

export const PROPOSAL_SECTIONS: ProposalSection[] = [
  {
    id: "executive_summary",
    title: "Executive Summary",
    aiPromptHint:
      "A concise 2-3 paragraph overview of the project, the proposed solution, and the value delivered to the client. Mention the client name, property, and trade type.",
  },
  {
    id: "scope_of_work",
    title: "Scope of Work",
    aiPromptHint:
      "Detailed numbered list of all work to be performed. Use trade-specific terminology. Each item should be a complete sentence describing exactly what will be done.",
  },
  {
    id: "materials_equipment",
    title: "Materials & Equipment",
    aiPromptHint:
      "Bulleted list of all materials, products, and equipment to be used, with brand names, model numbers, and specifications where relevant.",
  },
  {
    id: "timeline",
    title: "Project Timeline",
    aiPromptHint:
      "Estimated start date, phase durations, key milestones, and completion date. Format as a clear schedule with phases and days.",
  },
  {
    id: "investment",
    title: "Investment Summary",
    aiPromptHint:
      "Itemized cost breakdown: labor, materials, permits, and total. Include a payment schedule matching the agreed payment terms.",
  },
  {
    id: "terms",
    title: "Terms & Conditions",
    aiPromptHint:
      "Payment terms, warranty, change order policy, liability, permit responsibility, and client responsibilities. Professional but clear language.",
  },
];

// ─── Visualization Types ──────────────────────────────────────────────────────

export type VisualizationType =
  | "cost_breakdown_pie"
  | "timeline_gantt"
  | "savings_bar"
  | "comparison_bar"
  | "payment_schedule_bar";

export interface ProposalVisualization {
  id: string;
  type: VisualizationType;
  title: string;
  description: string;
  /** Input field IDs that feed data into this chart */
  dataFields: string[];
}

export const PROPOSAL_VISUALIZATIONS: ProposalVisualization[] = [
  {
    id: "cost_breakdown_pie",
    type: "cost_breakdown_pie",
    title: "Investment Breakdown",
    description: "Pie chart showing labor vs. materials vs. other costs",
    dataFields: ["labor_cost", "materials_cost", "total_cost"],
  },
  {
    id: "timeline_gantt",
    type: "timeline_gantt",
    title: "Project Schedule",
    description: "Horizontal bar chart showing project phases and durations",
    dataFields: ["estimated_days", "start_date"],
  },
  {
    id: "payment_schedule_bar",
    type: "payment_schedule_bar",
    title: "Payment Schedule",
    description: "Bar chart showing payment milestones",
    dataFields: ["total_cost", "payment_terms"],
  },
];
