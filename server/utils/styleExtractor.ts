/**
 * styleExtractor.ts
 * Extracts visual style metadata from HTML proposals so they can be used as templates.
 * When a user saves a proposal as a template or uploads one, this extracts the
 * visual characteristics so Claude can replicate the style for new proposals.
 */

export interface StyleMetadata {
  /** Detected color palette */
  colors: {
    primary: string;      // Main banner/header color
    accent: string;       // Secondary accent color
    highlight: string;    // Callout/emphasis color
    background: string;   // Section background tint
  };
  /** Header styling approach */
  headerStyle: "banner" | "underline" | "boxed" | "minimal";
  /** Table styling approach */
  tableStyle: "colored-header" | "minimal" | "bordered" | "striped";
  /** Chart types found in the proposal */
  chartTypes: string[];
  /** Overall layout pattern */
  layoutPattern: "cover-banner" | "sidebar" | "classic" | "minimal";
  /** Font preferences */
  fonts: {
    heading: string;
    body: string;
  };
  /** Tone detected from content */
  detectedTone: "professional" | "friendly" | "technical" | "executive";
  /** Original section structure (section names in order) */
  sectionOrder: string[];
}

/**
 * Extract style metadata from an HTML proposal document.
 * Analyzes the HTML/CSS to determine colors, layout, typography, and structure.
 */
export function extractStyleFromHtml(html: string): StyleMetadata {
  const metadata: StyleMetadata = {
    colors: { primary: "#1B3A5C", accent: "#3498db", highlight: "#e74c3c", background: "#f9f9f9" },
    headerStyle: "banner",
    tableStyle: "colored-header",
    chartTypes: [],
    layoutPattern: "cover-banner",
    fonts: { heading: "Georgia, serif", body: "'Segoe UI', system-ui, Arial, sans-serif" },
    detectedTone: "professional",
    sectionOrder: [],
  };

  // Extract colors from inline styles
  const foundColors: string[] = [];
  for (const m of Array.from(html.matchAll(/background(?:-color)?:\s*(#[0-9a-fA-F]{3,8})/g))) {
    foundColors.push(m[1].toLowerCase());
  }
  // The first prominent dark color is likely the primary
  for (const c of foundColors) {
    if (isDarkColor(c)) {
      metadata.colors.primary = c;
      break;
    }
  }
  // Find accent colors (medium-brightness, non-gray)
  for (const c of foundColors) {
    if (!isDarkColor(c) && !isLightColor(c) && !isGrayish(c) && c !== metadata.colors.primary) {
      metadata.colors.accent = c;
      break;
    }
  }

  // Detect header style
  if (html.includes("border-left") && html.match(/border-left:\s*[3-6]px\s*solid/)) {
    metadata.headerStyle = "underline";
  } else if (html.match(/h[1-3][^{]*\{[^}]*background/i)) {
    metadata.headerStyle = "boxed";
  } else if (html.match(/class="[^"]*banner|banner[^"]*"/i) || html.match(/padding:\s*[3-9]\d+px.*background/)) {
    metadata.headerStyle = "banner";
  }

  // Detect table style
  if (html.match(/th[^{]*\{[^}]*background.*#[0-9a-f]/i)) {
    metadata.tableStyle = "colored-header";
  } else if (html.match(/border-collapse.*border:\s*1px/i)) {
    metadata.tableStyle = "bordered";
  } else if (html.match(/nth-child|:nth-of-type/i)) {
    metadata.tableStyle = "striped";
  }

  // Detect chart types
  if (html.includes("<svg")) {
    if (html.match(/<rect[^>]*rx=/i)) metadata.chartTypes.push("horizontal-bar");
    if (html.match(/gantt|timeline/i)) metadata.chartTypes.push("gantt");
    if (html.match(/stacked/i)) metadata.chartTypes.push("stacked-bar");
    if (metadata.chartTypes.length === 0) metadata.chartTypes.push("horizontal-bar");
  }

  // Detect layout pattern
  if (html.match(/class="[^"]*sidebar/i) || html.match(/display:\s*flex.*width:\s*(200|250|280)px/)) {
    metadata.layoutPattern = "sidebar";
  } else if (html.match(/class="[^"]*cover|banner.*width:\s*100%/i)) {
    metadata.layoutPattern = "cover-banner";
  }

  // Detect fonts
  const fontMatch = html.match(/font-family:\s*'([^']+)'/);
  if (fontMatch) {
    metadata.fonts.body = fontMatch[0].replace(/font-family:\s*/, "").replace(/;.*/, "");
  }
  const headingFontMatch = html.match(/h[1-3][^{]*\{[^}]*font-family:\s*'([^']+)'/);
  if (headingFontMatch) {
    metadata.fonts.heading = headingFontMatch[0].replace(/.*font-family:\s*/, "").replace(/;.*/, "");
  }

  // Extract section order from h2 headings
  for (const m of Array.from(html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi))) {
    const text = m[1].replace(/<[^>]+>/g, "").trim();
    if (text && text.length < 60) {
      metadata.sectionOrder.push(text);
    }
  }

  // Also try markdown headings if it's markdown content
  if (metadata.sectionOrder.length === 0) {
    for (const m of Array.from(html.matchAll(/^## (.+)$/gm))) {
      metadata.sectionOrder.push(m[1].trim());
    }
  }

  return metadata;
}

/**
 * Extract plain text content from HTML, stripping all tags and styles.
 * Used to get the structural text content of a template.
 */
export function extractTextFromHtml(html: string): string {
  return html
    // Remove style blocks
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    // Remove script blocks
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    // Remove SVG blocks (charts)
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "[Chart]")
    // Convert headings to markdown-style
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n")
    // Convert paragraphs and divs to newlines
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    // Convert list items
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    // Convert table cells
    .replace(/<td[^>]*>/gi, " | ")
    .replace(/<\/tr>/gi, "\n")
    // Remove all remaining tags
    .replace(/<[^>]+>/g, "")
    // Clean up whitespace
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Color helpers ──

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace("#", "");
  if (cleaned.length === 3) {
    return {
      r: parseInt(cleaned[0] + cleaned[0], 16),
      g: parseInt(cleaned[1] + cleaned[1], 16),
      b: parseInt(cleaned[2] + cleaned[2], 16),
    };
  }
  if (cleaned.length >= 6) {
    return {
      r: parseInt(cleaned.substring(0, 2), 16),
      g: parseInt(cleaned.substring(2, 4), 16),
      b: parseInt(cleaned.substring(4, 6), 16),
    };
  }
  return null;
}

function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
}

function isDarkColor(hex: string): boolean {
  return getLuminance(hex) < 0.3;
}

function isLightColor(hex: string): boolean {
  return getLuminance(hex) > 0.85;
}

function isGrayish(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const range = Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b);
  return range < 30;
}
