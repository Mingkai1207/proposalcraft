/**
 * Parse LLM-generated proposal content and extract structured sections
 * CRITICAL: Clean markdown FIRST, then parse
 */

export interface ParsedProposalContent {
  executiveSummary: string;
  scopeOfWork: string[];
  materials: string[];
  timeline: string[];
  whyChooseUs: string;
  termsAndConditions: string;
}

/**
 * Aggressively clean markdown and formatting artifacts
 */
function cleanMarkdown(text: string): string {
  if (!text) return '';
  
  return text
    // Remove markdown headers (# ## ### #### etc)
    .replace(/^#+\s+/gm, '')
    // Remove bold/italic markers
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`(.+?)`/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove markdown list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove markdown link syntax
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    // Remove markdown image syntax
    .replace(/!\[(.+?)\]\(.+?\)/g, '$1')
    // Remove horizontal rules
    .replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '')
    // Remove blockquote markers
    .replace(/^>\s+/gm, '')
    // Clean up multiple spaces
    .replace(/\s{2,}/g, ' ')
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim
    .trim();
}

/**
 * Extract clean bullet points from text
 */
function extractBulletPoints(text: string): string[] {
  const lines = text.split('\n');
  const points: string[] = [];
  
  for (const line of lines) {
    let cleaned = line
      .replace(/^[\s]*[-*+•]\s+/g, '') // Remove bullet markers
      .replace(/^[\s]*\d+\.\s+/g, '') // Remove numbered list markers
      .replace(/^\s*\*\s+/g, '') // Remove asterisk bullets
      .trim();
    
    // Remove markdown from the line
    cleaned = cleanMarkdown(cleaned);
    
    // Only add non-empty lines that are reasonable length
    if (cleaned.length > 5 && cleaned.length < 300) {
      points.push(cleaned);
    }
  }
  
  return points.length > 0 ? points : [];
}

export function parseProposalContent(content: string): ParsedProposalContent {
  // CRITICAL: Clean the entire content first
  const cleanedContent = cleanMarkdown(content);
  const lines = cleanedContent.split('\n').filter(line => line.trim().length > 0);
  
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
    const lowerTrimmed = trimmed.toLowerCase();
    
    // Detect section headers (case-insensitive)
    if (lowerTrimmed.includes("executive summary") || lowerTrimmed.includes("summary")) {
      if (currentSection && currentItems.length > 0) {
        assignSectionItems(result, currentSection, currentItems);
      }
      currentSection = "summary";
      currentItems = [];
    } else if (lowerTrimmed.includes("scope of work") || lowerTrimmed.includes("scope")) {
      if (currentSection && currentItems.length > 0) {
        assignSectionItems(result, currentSection, currentItems);
      }
      currentSection = "scope";
      currentItems = [];
    } else if (lowerTrimmed.includes("materials") || lowerTrimmed.includes("equipment")) {
      if (currentSection && currentItems.length > 0) {
        assignSectionItems(result, currentSection, currentItems);
      }
      currentSection = "materials";
      currentItems = [];
    } else if (lowerTrimmed.includes("timeline") || lowerTrimmed.includes("schedule")) {
      if (currentSection && currentItems.length > 0) {
        assignSectionItems(result, currentSection, currentItems);
      }
      currentSection = "timeline";
      currentItems = [];
    } else if (lowerTrimmed.includes("why choose") || lowerTrimmed.includes("why us")) {
      if (currentSection && currentItems.length > 0) {
        assignSectionItems(result, currentSection, currentItems);
      }
      currentSection = "whyChoose";
      currentItems = [];
    } else if (lowerTrimmed.includes("terms") || lowerTrimmed.includes("conditions")) {
      if (currentSection && currentItems.length > 0) {
        assignSectionItems(result, currentSection, currentItems);
      }
      currentSection = "terms";
      currentItems = [];
    } else if (currentSection && trimmed.length > 0) {
      // Add to current section - already cleaned
      currentItems.push(trimmed);
    }
  }

  // Assign last section
  if (currentSection && currentItems.length > 0) {
    assignSectionItems(result, currentSection, currentItems);
  }

  // Ensure we have defaults if parsing failed
  if (!result.executiveSummary || result.executiveSummary.length < 10) {
    result.executiveSummary = "Professional proposal for your project.";
  }

  if (result.scopeOfWork.length === 0) {
    result.scopeOfWork = [
      "Complete project assessment",
      "Professional installation",
      "Quality assurance",
    ];
  }

  if (result.materials.length === 0) {
    result.materials = [
      "Premium materials",
      "Professional equipment",
    ];
  }

  if (result.timeline.length === 0) {
    result.timeline = [
      "Day 1: Site preparation",
      "Day 2: Installation",
      "Day 3: Final inspection",
    ];
  }

  if (!result.whyChooseUs || result.whyChooseUs.length < 10) {
    result.whyChooseUs = "Professional service backed by experience.";
  }

  if (!result.termsAndConditions || result.termsAndConditions.length < 10) {
    result.termsAndConditions = "50% deposit required. Balance on completion. 1-year warranty.";
  }

  return result;
}

function assignSectionItems(result: ParsedProposalContent, section: string, items: string[]): void {
  const text = items.join(" ");

  switch (section) {
    case "summary":
      result.executiveSummary = cleanMarkdown(text).substring(0, 500);
      break;
    case "scope":
      result.scopeOfWork = extractBulletPoints(text);
      break;
    case "materials":
      result.materials = extractBulletPoints(text);
      break;
    case "timeline":
      result.timeline = extractBulletPoints(text);
      break;
    case "whyChoose":
      result.whyChooseUs = cleanMarkdown(text).substring(0, 300);
      break;
    case "terms":
      result.termsAndConditions = cleanMarkdown(text).substring(0, 300);
      break;
  }
}
