import { describe, expect, it } from "vitest";
import { getSchema } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { proposalTableExtensions } from "../client/src/components/proposalTable";
import {
  isHtmlProposalContent,
  proposalToEditorHtml,
  serializeProposalEditorContent,
} from "../client/src/lib/proposalEditorContent";

// Regression: ISSUE-004 - legacy Markdown collapsed into a paragraph in the editor,
// and saving produced HTML fragments that detail/export interpreted as Markdown.
// Found by /qa on 2026-10-08
// Report: .gstack/qa-reports/qa-report-proposai-org-2026-10-08.md
// Pure formatting tests, no database, browser, network, or filesystem calls.

const schema = getSchema([StarterKit, ...proposalTableExtensions]);
const text = (value: string) => ({ type: "text", text: value });
const paragraph = (value: string) => ({
  type: "paragraph",
  content: [text(value)],
});
const cell = (value: string, header = false) => ({
  type: header ? "tableHeader" : "tableCell",
  content: [paragraph(value)],
});

const markdown = `# HVAC system replacement

## Cost estimate
| Item | Amount |
| --- | --- |
| Equipment and materials | $5,200 |
| **Total** | **$8,500** |

## Terms
50% deposit. Balance due on completion.`;

describe("proposal editor content formatting", () => {
  it("opens generated Markdown as headings, an estimate table, and bold text", () => {
    const html = proposalToEditorHtml(markdown);
    expect(html).toContain("<h1>HVAC system replacement</h1>");
    expect(html).toContain("<h2>Cost estimate</h2>");
    expect(html).toContain("<table>");
    expect(html).toContain("<td>$5,200</td>");
    expect(html).toContain("<strong>Total</strong>");
    expect(html).toContain("<strong>$8,500</strong>");
    expect(html).not.toContain("# HVAC");
  });

  it("saves an edited estimate as Markdown that renders identically after reload", () => {
    const edited = schema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [text("HVAC system replacement")],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [text("Cost estimate")],
        },
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [cell("Item", true), cell("Amount", true)],
            },
            {
              type: "tableRow",
              content: [cell("Equipment and materials"), cell("$5,400")],
            },
            {
              type: "tableRow",
              content: [
                {
                  type: "tableCell",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        { ...text("Total"), marks: [{ type: "bold" }] },
                      ],
                    },
                  ],
                },
                {
                  type: "tableCell",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        { ...text("$8,700"), marks: [{ type: "bold" }] },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        { type: "heading", attrs: { level: 2 }, content: [text("Terms")] },
        paragraph("50% deposit. Balance due on completion."),
      ],
    });

    const saved = serializeProposalEditorContent(
      markdown,
      edited,
      "unused HTML for a Markdown proposal"
    );
    expect(saved).toMatch(/^# HVAC system replacement/);
    expect(isHtmlProposalContent(saved)).toBe(false);
    expect(saved).toContain("| Equipment and materials | $5,400 |");
    expect(saved).toContain("| **Total** | **$8,700** |");
    expect(saved).toContain("## Terms");

    const reloaded = proposalToEditorHtml(saved);
    expect(reloaded).toContain("<h2>Cost estimate</h2>");
    expect(reloaded).toContain("<table>");
    expect(reloaded).toContain("<strong>$8,700</strong>");
    expect(reloaded).toContain("50% deposit. Balance due on completion.");
    expect(reloaded).not.toContain("$5,200");
  });

  it("retains literal pipes and line breaks inside an estimate cell", () => {
    const edited = schema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            { type: "tableRow", content: [cell("Work", true)] },
            {
              type: "tableRow",
              content: [
                {
                  type: "tableCell",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        text("Install | permit"),
                        { type: "hardBreak" },
                        text("Second phase"),
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    const saved = serializeProposalEditorContent(markdown, edited, "");
    expect(saved).toContain("Install \\| permit<br>Second phase");
    const reloaded = proposalToEditorHtml(saved);
    expect(reloaded).toContain("<td>Install | permit<br>Second phase</td>");
  });

  it("keeps a full HTML proposal's doctype, head styles, and body attributes after editing", () => {
    const original =
      '<!DOCTYPE html><html lang="en"><head><title>Estimate</title><style>th { color: #244c3a; }</style></head><body class="proposal"><h1>Old title</h1></body></html>';
    const editedHtml =
      "<h1>Updated title</h1><table><tbody><tr><td><p>$8,700</p></td></tr></tbody></table>";
    const saved = serializeProposalEditorContent(
      original,
      schema.nodeFromJSON({ type: "doc", content: [paragraph("unused")] }),
      editedHtml
    );
    expect(saved).toBe(original.replace("<h1>Old title</h1>", editedHtml));
    expect(saved).toMatch(/^<!DOCTYPE html>/);
    expect(saved).toContain('<body class="proposal">');
    expect(saved).toContain("<style>th { color: #244c3a; }</style>");
    expect(proposalToEditorHtml(saved)).toBe(editedHtml);
  });

  it("restores the document marker for an HTML fragment saved by older editors", () => {
    const editedHtml = "<h2>Estimate</h2><p><strong>$8,700</strong></p>";
    const saved = serializeProposalEditorContent(
      "<h2>Estimate</h2><p>$8,500</p>",
      schema.nodeFromJSON({ type: "doc", content: [paragraph("unused")] }),
      editedHtml
    );
    expect(saved).toMatch(/^<!DOCTYPE html>/);
    expect(isHtmlProposalContent(saved)).toBe(true);
    expect(proposalToEditorHtml(saved)).toBe(editedHtml);
  });

  it("handles an empty proposal without inserting markup or changing storage format", () => {
    expect(proposalToEditorHtml("")).toBe("");
    const empty = schema.nodeFromJSON({
      type: "doc",
      content: [{ type: "paragraph" }],
    });
    expect(serializeProposalEditorContent("", empty, "<p></p>")).toBe("");
  });
});
