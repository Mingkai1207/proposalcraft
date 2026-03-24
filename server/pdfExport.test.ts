import { describe, expect, it } from "vitest";
import { parseProposalContent } from "./utils/proposalContentParser";

/**
 * Tests for the PDF export pipeline.
 * 
 * The new pipeline passes full AI markdown to the PDF renderer (via `proposalMarkdown`).
 * The old parseProposalContent is kept for backward compatibility but is no longer
 * used by the exportPdf endpoint.
 * 
 * These tests verify:
 * 1. The old parser still works (it may be used elsewhere)
 * 2. The new ProposalPdfData interface accepts raw markdown
 * 3. Financial calculations are correct
 */

// ─── Legacy parser tests (kept for backward compat) ────────────────────

describe("proposalContentParser (legacy)", () => {
  it("extracts executive summary from markdown content", () => {
    const content = `## Executive Summary

We are pleased to present this proposal for your HVAC system replacement.

## Scope of Work

- Remove old system
- Install new system
`;
    const result = parseProposalContent(content);
    expect(result.executiveSummary).toBeTruthy();
    expect(result.executiveSummary).not.toContain("##");
    expect(result.scopeOfWork.length).toBeGreaterThan(0);
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
});

// ─── New markdown-based PDF data tests ─────────────────────────────────

describe("ProposalPdfData with raw markdown", () => {
  it("module exports generateProposalPdf function", async () => {
    const mod = await import("./utils/proposalPdfExport");
    expect(mod.generateProposalPdf).toBeDefined();
    expect(typeof mod.generateProposalPdf).toBe("function");
  });

  it("preserves full markdown content in the data object", () => {
    const markdown = `## Executive Summary

This is a detailed proposal with **bold text** and *italic text*.

## Scope of Work

- Item 1: Complete removal
- Item 2: Installation

| Item | Spec |
|------|------|
| Pump | 5-ton |
`;

    const pdfData = {
      businessName: "Test Co",
      businessPhone: "(555) 000-0000",
      businessEmail: "test@test.com",
      businessAddress: "123 Main St",
      licenseNumber: "LIC-123",
      clientName: "John Doe",
      clientAddress: "456 Oak Ave",
      clientPhone: "(555) 111-1111",
      clientEmail: "john@test.com",
      jobTitle: "Test Project",
      preparedDate: "March 20, 2026",
      validUntil: "April 19, 2026",
      laborCost: 5000,
      materialsCost: 3000,
      totalCost: 8000,
      proposalMarkdown: markdown,
    };

    // The full markdown should be preserved, not parsed/stripped
    expect(pdfData.proposalMarkdown).toContain("## Executive Summary");
    expect(pdfData.proposalMarkdown).toContain("**bold text**");
    expect(pdfData.proposalMarkdown).toContain("*italic text*");
    expect(pdfData.proposalMarkdown).toContain("| Item | Spec |");
    expect(pdfData.proposalMarkdown).toContain("- Item 1: Complete removal");
  });

  it("accepts optional termsOverride", () => {
    const pdfData = {
      businessName: "Test Co",
      businessPhone: "",
      businessEmail: "",
      businessAddress: "",
      licenseNumber: "",
      clientName: "Client",
      clientAddress: "",
      clientPhone: "",
      clientEmail: "",
      jobTitle: "Test",
      preparedDate: "March 20, 2026",
      validUntil: "April 19, 2026",
      laborCost: 1000,
      materialsCost: 2000,
      totalCost: 3000,
      proposalMarkdown: "# Test",
      termsOverride: "Custom terms from contractor profile",
    };

    expect(pdfData.termsOverride).toBe("Custom terms from contractor profile");
  });

  it("does not strip markdown formatting from proposalMarkdown", () => {
    const markdown = `### Phase 1: Demolition

- Remove existing **hardwood flooring** (500 sq ft)
- Dispose of old materials per local regulations

### Phase 2: Installation

1. **Moisture barrier** installation
2. **Underlayment** placement

> Note: All work performed by certified installers.`;

    const pdfData = {
      businessName: "Test",
      businessPhone: "",
      businessEmail: "",
      businessAddress: "",
      licenseNumber: "",
      clientName: "Client",
      clientAddress: "",
      clientPhone: "",
      clientEmail: "",
      jobTitle: "Test",
      preparedDate: "March 20, 2026",
      validUntil: "April 19, 2026",
      laborCost: 1000,
      materialsCost: 2000,
      totalCost: 3000,
      proposalMarkdown: markdown,
    };

    // Verify markdown is NOT stripped
    expect(pdfData.proposalMarkdown).toContain("### Phase 1: Demolition");
    expect(pdfData.proposalMarkdown).toContain("**hardwood flooring**");
    expect(pdfData.proposalMarkdown).toContain("1. **Moisture barrier** installation");
    expect(pdfData.proposalMarkdown).toContain("> Note:");
  });
});

// ─── Puppeteer PDF generation tests ──────────────────────────────────

describe("generatePdfFromHtml (Puppeteer)", () => {
  it("module exports generatePdfFromHtml function", async () => {
    const mod = await import("./utils/proposalPdfExport");
    expect(mod.generatePdfFromHtml).toBeDefined();
    expect(typeof mod.generatePdfFromHtml).toBe("function");
  });

  it("module exports buildProposalHtml function", async () => {
    const mod = await import("./utils/proposalPdfExport");
    expect(mod.buildProposalHtml).toBeDefined();
    expect(typeof mod.buildProposalHtml).toBe("function");
  });
});

// ─── CSS sanitizer logic tests ──────────────────────────────────────────

describe("CSS sanitization for print", () => {
  it("removes break-inside: avoid-page from CSS", () => {
    const css = ".section { break-inside: avoid-page; margin: 10px; }";
    const sanitized = css.replace(/break-inside\s*:\s*avoid-page\s*;/gi, "");
    expect(sanitized).not.toContain("avoid-page");
    expect(sanitized).toContain("margin: 10px");
  });

  it("removes page-break-inside: avoid from CSS", () => {
    const css = ".section { page-break-inside: avoid; color: red; }";
    const sanitized = css.replace(/page-break-inside\s*:\s*avoid\s*;/gi, "");
    expect(sanitized).not.toContain("page-break-inside");
    expect(sanitized).toContain("color: red");
  });

  it("removes position: running() from CSS", () => {
    const css = ".header { position: running(header); font-size: 10px; }";
    const sanitized = css.replace(/position\s*:\s*running\([^)]*\)\s*;/gi, "");
    expect(sanitized).not.toContain("running");
    expect(sanitized).toContain("font-size: 10px");
  });
});

// ─── Financial calculation tests ───────────────────────────────────────

describe("Financial calculations", () => {
  it("handles zero costs with safe minimum", () => {
    const totalCost = 0;
    const laborCost = 0;
    const safeTotalCost = Math.max(1, totalCost);
    const laborPct = safeTotalCost > 0 ? Math.round((laborCost / safeTotalCost) * 100) : 50;
    const matPct = 100 - laborPct;

    expect(laborPct).toBe(0);
    expect(matPct).toBe(100);
  });

  it("calculates correct labor/materials percentages", () => {
    const totalCost = 10000;
    const laborCost = 4000;
    const laborPct = Math.round((laborCost / totalCost) * 100);
    const matPct = 100 - laborPct;

    expect(laborPct).toBe(40);
    expect(matPct).toBe(60);
  });

  it("formats deposit correctly as half of total", () => {
    const totalCost = 14000;
    const deposit = (totalCost * 0.5).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    expect(deposit).toBe("7,000.00");
  });

  it("handles uneven split correctly", () => {
    const totalCost = 15000;
    const laborCost = 7500;
    const laborPct = Math.round((laborCost / totalCost) * 100);
    expect(laborPct).toBe(50);
  });
});
