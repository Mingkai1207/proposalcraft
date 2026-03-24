/**
 * Parse LLM-generated proposal content and extract structured sections
 */
export interface ParsedProposalContent {
  executiveSummary: string;
  scopeOfWork: string[];
  materials: string[];
  timeline: string[];
  whyChooseUs: string;
  termsAndConditions: string;
}

export function parseProposalContent(content: string): ParsedProposalContent {
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  
  const result: ParsedProposalContent = {
    executiveSummary: "",
    scopeOfWork: [],
    materials: [],
    timeline: [],
    whyChooseUs: "",
    termsAndConditions: "",
  };

  let currentSection = "";
  let currentItems: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect section headers
    if (trimmed.toLowerCase().includes("executive summary") || trimmed.toLowerCase().includes("summary")) {
      if (currentSection && currentItems.length > 0) {
        assignSectionItems(result, currentSection, currentItems);
      }
      currentSection = "summary";
      currentItems = [];
    } else if (trimmed.toLowerCase().includes("scope of work") || trimmed.toLowerCase().includes("scope")) {
      if (currentSection && currentItems.length > 0) {
        assignSectionItems(result, currentSection, currentItems);
      }
      currentSection = "scope";
      currentItems = [];
    } else if (trimmed.toLowerCase().includes("materials") || trimmed.toLowerCase().includes("equipment")) {
      if (currentSection && currentItems.length > 0) {
        assignSectionItems(result, currentSection, currentItems);
      }
      currentSection = "materials";
      currentItems = [];
    } else if (trimmed.toLowerCase().includes("timeline") || trimmed.toLowerCase().includes("schedule")) {
      if (currentSection && currentItems.length > 0) {
        assignSectionItems(result, currentSection, currentItems);
      }
      currentSection = "timeline";
      currentItems = [];
    } else if (trimmed.toLowerCase().includes("why choose") || trimmed.toLowerCase().includes("why us")) {
      if (currentSection && currentItems.length > 0) {
        assignSectionItems(result, currentSection, currentItems);
      }
      currentSection = "whyChoose";
      currentItems = [];
    } else if (trimmed.toLowerCase().includes("terms") || trimmed.toLowerCase().includes("conditions")) {
      if (currentSection && currentItems.length > 0) {
        assignSectionItems(result, currentSection, currentItems);
      }
      currentSection = "terms";
      currentItems = [];
    } else if (currentSection && trimmed.length > 0) {
      // Add to current section
      currentItems.push(trimmed);
    }
  }

  // Assign last section
  if (currentSection && currentItems.length > 0) {
    assignSectionItems(result, currentSection, currentItems);
  }

  // Ensure we have defaults
  if (result.scopeOfWork.length === 0) {
    result.scopeOfWork = [
      "Complete project assessment",
      "Professional installation",
      "Quality assurance",
      "Customer satisfaction guaranteed",
    ];
  }

  if (result.materials.length === 0) {
    result.materials = [
      "Premium materials",
      "Professional equipment",
      "Safety compliance",
    ];
  }

  if (result.timeline.length === 0) {
    result.timeline = [
      "Day 1: Site preparation",
      "Day 2: Installation",
      "Day 3: Final inspection",
    ];
  }

  if (!result.executiveSummary) {
    result.executiveSummary = "Professional proposal for your project.";
  }

  if (!result.whyChooseUs) {
    result.whyChooseUs = "We provide professional, reliable service backed by years of experience and customer satisfaction.";
  }

  if (!result.termsAndConditions) {
    result.termsAndConditions = "50% deposit required to schedule. Balance due upon completion. 1-year warranty on all work.";
  }

  return result;
}

function assignSectionItems(result: ParsedProposalContent, section: string, items: string[]): void {
  const text = items.join(" ");

  switch (section) {
    case "summary":
      result.executiveSummary = text.substring(0, 500);
      break;
    case "scope":
      result.scopeOfWork = extractBulletPoints(items);
      break;
    case "materials":
      result.materials = extractBulletPoints(items);
      break;
    case "timeline":
      result.timeline = extractBulletPoints(items);
      break;
    case "whyChoose":
      result.whyChooseUs = text.substring(0, 300);
      break;
    case "terms":
      result.termsAndConditions = text.substring(0, 300);
      break;
  }
}

function extractBulletPoints(items: string[]): string[] {
  const bullets: string[] = [];

  for (const item of items) {
    // Remove common bullet point markers
    let cleaned = item
      .replace(/^[\*\-\•\+\d+\.]+\s*/, "")
      .replace(/^[\*\*]+/, "")
      .trim();

    if (cleaned.length > 0 && cleaned.length < 200) {
      bullets.push(cleaned);
    }
  }

  return bullets.length > 0 ? bullets : items.slice(0, 5);
}
