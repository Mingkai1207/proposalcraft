import { describe, expect, it } from "vitest";
import { getSchema } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { proposalTableExtensions } from "../client/src/components/proposalTable";
import {
  isHtmlProposalContent,
  proposalToEditorHtml,
  serializeProposalEditorContent,
} from "../client/src/lib/proposalEditorContent";

// Regression: ISSUE-004 - block formatting applied/pasted inside estimate cells
// became literal Markdown on save/reload because GFM cells only contain inline text.
// Found by /qa on 2026-10-08
// Report: .gstack/qa-reports/qa-report-proposai-org-2026-10-08.md
// Pure schema/serialization tests. Browser QA verifies Streamdown's live preview;
// importing its CSS/ESM pipeline for SSR is unsupported in this Vitest Node setup.

const schema = getSchema([StarterKit, ...proposalTableExtensions]);
const text = (value: string) => ({ type: "text", text: value });
const paragraph = (value: string) => ({
  type: "paragraph",
  content: [text(value)],
});
const cell = (content: object[], attrs = {}) => ({
  type: "tableCell",
  attrs,
  content,
});
const tableDocument = (cells: object[]) =>
  schema.nodeFromJSON({
    type: "doc",
    content: [
      {
        type: "table",
        content: [
          {
            type: "tableRow",
            content: [{ type: "tableHeader", content: [paragraph("Scope")] }],
          },
          ...cells.map(value => ({ type: "tableRow", content: [value] })),
        ],
      },
    ],
  });

describe("proposal table block-format roundtrips", () => {
  it("preserves toolbar/pasted lists, headings, and multiline code inside cells on reload", () => {
    const document = tableDocument([
      cell([
        {
          type: "bulletList",
          content: [
            { type: "listItem", content: [paragraph("Remove old equipment")] },
            { type: "listItem", content: [paragraph("Install new equipment")] },
          ],
        },
      ]),
      cell([
        {
          type: "heading",
          attrs: { level: 2 },
          content: [text("Installation phase")],
        },
      ]),
      cell([
        {
          type: "codeBlock",
          content: [text("Line one\n  Line two")],
        },
      ]),
    ]);
    const saved = serializeProposalEditorContent(
      "| Scope |\n| --- |\n| Install equipment |",
      document,
      ""
    );
    expect(isHtmlProposalContent(saved)).toBe(false);
    expect(saved).toContain("<ul><li><p>Remove old equipment</p></li>");
    expect(saved).toContain("<h2>Installation phase</h2>");
    expect(saved).toContain(
      '<pre><code\n class="language-text">Line one&#10;  Line two</code></pre>'
    );
    const reloaded = proposalToEditorHtml(saved);
    expect(reloaded).toContain("<ul><li><p>Remove old equipment</p></li>");
    expect(reloaded).toContain("<h2>Installation phase</h2>");
    expect(reloaded).not.toContain("## Installation phase");
    expect(reloaded).toContain(
      'class="language-text">Line one&#10;  Line two</code>'
    );
  });

  it("retains multiple paragraphs and merged-cell spans rather than silently flattening pasted content", () => {
    const document = tableDocument([
      cell([paragraph("First paragraph"), paragraph("Second paragraph")], {
        colspan: 2,
        rowspan: 2,
      }),
    ]);
    const saved = serializeProposalEditorContent(
      "## Estimate\n\n| Work |\n| --- |\n| Installation |",
      document,
      ""
    );
    expect(saved).toContain(
      '<td colspan="2" rowspan="2"><p>First paragraph</p><p>Second paragraph</p></td>'
    );
    expect(proposalToEditorHtml(saved)).toContain(
      '<td colspan="2" rowspan="2">'
    );
    expect(proposalToEditorHtml(saved)).toContain(
      "<p>First paragraph</p><p>Second paragraph</p>"
    );
  });

  it("escapes pasted HTML-looking text and uses TipTap link validation when generating embedded table markup", () => {
    const document = tableDocument([
      cell([
        {
          type: "heading",
          attrs: { level: 2 },
          content: [text('<script>alert("x")</script>')],
        },
        {
          type: "paragraph",
          content: [
            {
              ...text("Unsafe link"),
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ]),
    ]);
    const saved = serializeProposalEditorContent(
      "| Scope |\n| --- |\n| Work |",
      document,
      ""
    );
    expect(saved).toContain(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
    );
    expect(saved).not.toContain("<script>");
    expect(saved).not.toContain("javascript:");
    const reloaded = proposalToEditorHtml(saved);
    expect(reloaded).not.toContain("<script>");
    expect(reloaded).not.toContain("javascript:");
    expect(reloaded).toContain("&lt;script&gt;");
  });

  it("keeps a first formatted table and following headings on the Markdown path", () => {
    const table = tableDocument([
      cell([
        { type: "heading", attrs: { level: 2 }, content: [text("Phase one")] },
      ]),
    ]).firstChild!;
    const document = schema.nodes.doc.create(null, [
      table,
      schema.nodes.heading.create({ level: 2 }, schema.text("Terms")),
      schema.nodes.paragraph.create(
        null,
        schema.text("Payment due on completion.")
      ),
    ]);
    const saved = serializeProposalEditorContent(
      "| Work |\n| --- |\n| Installation |",
      document,
      ""
    );
    expect(isHtmlProposalContent(saved)).toBe(false);
    expect(saved).toContain("## Terms");
    const reloaded = proposalToEditorHtml(saved);
    expect(reloaded).toContain("<h2>Phase one</h2>");
    expect(reloaded).toContain("<h2>Terms</h2>");
    expect(reloaded).toContain("Payment due on completion.");
  });

  it("preserves an enclosing blockquote for each physical line of embedded table HTML", () => {
    const table = tableDocument([
      cell([{ type: "codeBlock", content: [text("Line one\nLine two")] }]),
    ]).firstChild!;
    const document = schema.nodes.doc.create(
      null,
      schema.nodes.blockquote.create(null, table)
    );
    const saved = serializeProposalEditorContent(
      "> | Work |\n> | --- |\n> | Installation |",
      document,
      ""
    );
    expect(
      saved
        .trim()
        .split("\n")
        .every(line => line.startsWith("> "))
    ).toBe(true);
    const reloaded = proposalToEditorHtml(saved);
    expect(reloaded).toContain("<blockquote>");
    expect(reloaded).toContain("<table>");
    expect(reloaded).toContain(
      'class="language-text">Line one&#10;Line two</code>'
    );
    expect(reloaded).toContain("</blockquote>");
  });
});
