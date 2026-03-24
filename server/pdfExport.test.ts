import { describe, expect, it, vi, beforeEach } from "vitest";
import { parseProposalContent } from "./utils/proposalContentParser";

// Test the content parser which is the critical piece for PDF generation
describe("proposalContentParser", () => {
  it("extracts executive summary from markdown content", () => {
    const content = `## Executive Summary

We are pleased to present this proposal for your HVAC system replacement.

## Scope of Work

- Remove old system
- Install new system
`;
    const result = parseProposalContent(content);
    // Parser extracts sections - executive summary should be populated
    expect(result.executiveSummary).toBeTruthy();
    expect(result.executiveSummary).not.toContain("##");
    // Scope should be extracted separately
    expect(result.scopeOfWork.length).toBeGreaterThan(0);
  });

  it("removes markdown headers from parsed content", () => {
    const content = `#### 1. Executive Summary

This is a test summary.

#### 2. Scope of Work

- Item one
- Item two
- Item three

#### 3. Materials & Equipment

- Material A
- Material B
`;
    const result = parseProposalContent(content);
    // No markdown headers should remain
    expect(result.executiveSummary).not.toContain("####");
    expect(result.executiveSummary).not.toContain("#");
    expect(result.scopeOfWork.join(" ")).not.toContain("####");
    expect(result.materials.join(" ")).not.toContain("####");
  });

  it("removes bold/italic markdown from content", () => {
    const content = `## Executive Summary

**We are pleased** to present this *professional* proposal.

## Scope of Work

- **Remove** old system
- __Install__ new system
`;
    const result = parseProposalContent(content);
    // All markdown formatting should be stripped
    expect(result.executiveSummary).not.toContain("**");
    expect(result.executiveSummary).not.toContain("##");
    // Scope items should not contain markdown
    result.scopeOfWork.forEach(item => {
      expect(item).not.toContain("**");
      expect(item).not.toContain("__");
    });
  });

  it("extracts scope of work items", () => {
    const content = `## Scope of Work

- Remove existing HVAC system
- Install new Carrier unit
- Test and calibrate system
- Final inspection
`;
    const result = parseProposalContent(content);
    expect(result.scopeOfWork.length).toBeGreaterThan(0);
  });

  it("extracts materials section", () => {
    const content = `## Materials & Equipment

- Carrier AC Unit - $3,200
- Gas Furnace - $1,800
- Smart Thermostat - $250

## Timeline

- Day 1: Preparation
- Day 2: Installation
`;
    const result = parseProposalContent(content);
    expect(result.materials.length).toBeGreaterThan(0);
    expect(result.timeline.length).toBeGreaterThan(0);
  });

  it("provides defaults when content is empty", () => {
    const result = parseProposalContent("");
    expect(result.executiveSummary).toBeTruthy();
    expect(result.scopeOfWork.length).toBeGreaterThan(0);
    expect(result.materials.length).toBeGreaterThan(0);
    expect(result.timeline.length).toBeGreaterThan(0);
    expect(result.termsAndConditions).toBeTruthy();
  });

  it("provides defaults when content has no recognizable sections", () => {
    const result = parseProposalContent("Just some random text without any section headers.");
    expect(result.executiveSummary).toBeTruthy();
    expect(result.scopeOfWork.length).toBeGreaterThan(0);
  });

  it("extracts terms and conditions", () => {
    const content = `## Terms & Conditions

50% deposit required upon acceptance. Balance due upon completion. 
This proposal is valid for 30 days.
`;
    const result = parseProposalContent(content);
    expect(result.termsAndConditions).toContain("deposit");
  });

  it("extracts why choose us section", () => {
    const content = `## Why Choose Us

With over 18 years of experience and NATE-certified technicians, we have completed over 3,000 installations.
`;
    const result = parseProposalContent(content);
    expect(result.whyChooseUs).toContain("experience");
  });

  it("handles complex LLM output with numbered headers", () => {
    const content = `#### 1. Executive Summary

We are pleased to present this comprehensive proposal for the complete replacement of your HVAC system.

#### 2. Scope of Work

1. Remove existing HVAC system and dispose of old equipment
2. Install new Carrier Infinity 24ANB1 5-Ton AC unit
3. Install new gas furnace with variable speed blower
4. Replace all supply and return ductwork as needed

#### 3. Materials & Equipment

- **Carrier Infinity 24ANB1** 5-Ton AC Unit - $3,200
- **Carrier 59MN7** Gas Furnace - $1,800
- **Honeywell T10 Pro** Smart Thermostat - $250

#### 4. Project Timeline

- Day 1: Remove old system, prepare installation site
- Day 2: Complete installation, testing, and inspection

#### 5. Investment Summary

**Labor:** $2,500
**Materials:** $6,000
**Total:** $8,500

#### 6. Why Choose Us

With over 18 years of experience, Arctic Breeze HVAC has a 4.9-star rating.

#### 7. Terms & Acceptance

50% deposit required. Balance due upon completion. Valid for 30 days.
`;
    const result = parseProposalContent(content);
    
    // Should extract clean content without markdown
    expect(result.executiveSummary).not.toContain("####");
    expect(result.executiveSummary).not.toContain("**");
    expect(result.executiveSummary).toBeTruthy();
    
    expect(result.scopeOfWork.length).toBeGreaterThan(0);
    expect(result.materials.length).toBeGreaterThan(0);
    expect(result.timeline.length).toBeGreaterThan(0);
    expect(result.whyChooseUs).toBeTruthy();
    expect(result.termsAndConditions).toBeTruthy();
    
    // Verify no markdown artifacts in any section
    result.scopeOfWork.forEach(item => {
      expect(item).not.toContain("####");
      expect(item).not.toContain("**");
    });
    result.materials.forEach(item => {
      expect(item).not.toContain("####");
      expect(item).not.toContain("**");
    });
  });
});
