import { marked } from "marked";
import {
  defaultMarkdownSerializer,
  MarkdownSerializer,
} from "@tiptap/pm/markdown";
import type { DOMOutputSpec, Node } from "@tiptap/pm/model";

export function isHtmlProposalContent(content: string): boolean {
  return /^\s*(?:<!doctype\b|<html\b|<body\b|<(?:p|div|h[1-6]|table)\b)/i.test(
    content
  );
}

/** TipTap consumes HTML; generated legacy proposals are stored as Markdown. */
export function proposalToEditorHtml(content: string): string {
  if (isHtmlProposalContent(content)) {
    return content.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i)?.[1] ?? content;
  }
  return marked.parse(content, {
    async: false,
    gfm: true,
    breaks: true,
  }) as string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "&#10;");
}

// Serialize only the installed editor schema, rather than embedding user HTML.
// Unlike a GFM cell, this can represent lists, headings, code, and merged cells.
function renderEditorSpec(spec: DOMOutputSpec | 0, content: string): string {
  if (spec === 0) return content;
  if (typeof spec === "string") return escapeHtml(spec);
  if (!Array.isArray(spec))
    throw new Error("Unsupported editor HTML specification");
  const [tag, ...parts] = spec;
  const hasAttributes =
    parts[0] && typeof parts[0] === "object" && !Array.isArray(parts[0]);
  const attributes = hasAttributes ? parts.shift() : {};
  const htmlAttributes = Object.entries(attributes)
    .filter(([, value]) => value != null)
    .map(([name, value]) => ` ${name}="${escapeHtml(String(value))}"`)
    .join("");
  const open = `<${tag}${htmlAttributes}>`;
  return /^(?:br|hr|img)$/i.test(tag)
    ? open
    : `${open}${parts.map(part => renderEditorSpec(part, content)).join("")}</${tag}>`;
}

function renderEditorNode(node: Node): string {
  let content = "";
  node.forEach(child => {
    content += renderEditorNode(child);
  });
  const renderNode =
    node.type.name === "codeBlock" && !node.attrs.language
      ? node.type.create(
          { ...node.attrs, language: "text" },
          node.content,
          node.marks
        )
      : node;
  let html = node.isText
    ? escapeHtml(node.text || "")
    : renderEditorSpec(renderNode.type.spec.toDOM!(renderNode), content);
  if (node.type.name === "codeBlock") {
    // Streamdown distinguishes code blocks by their source line positions.
    // A newline inside the opening tag creates those positions without adding
    // whitespace to the code text or accumulating blank lines after reloads.
    html = html.replace(/<code(?=[\s>])/, "<code\n");
  }
  for (const mark of [...node.marks].reverse()) {
    html = renderEditorSpec(mark.type.spec.toDOM!(mark, node.isInline), html);
  }
  return html;
}

const markdownSerializer = new MarkdownSerializer(
  {
    ...defaultMarkdownSerializer.nodes,
    bulletList: defaultMarkdownSerializer.nodes.bullet_list,
    orderedList(state, node) {
      const start = node.attrs.start || 1;
      state.renderList(node, "   ", index => `${start + index}. `);
    },
    listItem: defaultMarkdownSerializer.nodes.list_item,
    codeBlock: defaultMarkdownSerializer.nodes.code_block,
    hardBreak: defaultMarkdownSerializer.nodes.hard_break,
    horizontalRule: defaultMarkdownSerializer.nodes.horizontal_rule,
    table(state, node) {
      let requiresHtml = false;
      node.forEach(row =>
        row.forEach(cell => {
          if (
            cell.childCount !== 1 ||
            cell.firstChild?.type.name !== "paragraph" ||
            cell.attrs.colspan !== 1 ||
            cell.attrs.rowspan !== 1
          )
            requiresHtml = true;
        })
      );
      if (requiresHtml) {
        // A comment keeps a document beginning with this embedded table on the
        // legacy Markdown path, instead of misclassifying it as an old HTML fragment.
        state.write("<!-- Editable proposal table -->\n");
        for (const line of renderEditorNode(node).split("\n"))
          state.write(`${line}\n`);
        state.closeBlock(node);
        return;
      }
      const rows: string[][] = [];
      node.forEach(row => {
        const cells: string[] = [];
        row.forEach(cell =>
          cells.push(
            markdownSerializer
              .serialize(cell)
              .trim()
              .replace(/\|/g, "\\|")
              .replace(/\\\n/g, "<br>")
              .replace(/\n+/g, "<br>")
          )
        );
        rows.push(cells);
      });
      if (!rows.length) return;
      state.write(`| ${rows[0].join(" | ")} |\n`);
      const separators: string[] = [];
      node.firstChild!.forEach(cell => {
        separators.push(
          cell.attrs.textAlign === "center"
            ? ":---:"
            : cell.attrs.textAlign === "right"
              ? "---:"
              : cell.attrs.textAlign === "left"
                ? ":---"
                : "---"
        );
      });
      state.write(`| ${separators.join(" | ")} |\n`);
      for (const row of rows.slice(1)) state.write(`| ${row.join(" | ")} |\n`);
      state.closeBlock(node);
    },
  },
  {
    ...defaultMarkdownSerializer.marks,
    bold: defaultMarkdownSerializer.marks.strong,
    italic: defaultMarkdownSerializer.marks.em,
    strike: {
      open: "~~",
      close: "~~",
      mixable: true,
      expelEnclosingWhitespace: true,
    },
    underline: { open: "<u>", close: "</u>", mixable: true },
  },
  { hardBreakNodeName: "hardBreak" }
);

/** Preserve the storage format so existing detail and export paths still work. */
export function serializeProposalEditorContent(
  original: string,
  document: Node,
  html: string
): string {
  if (!isHtmlProposalContent(original))
    return markdownSerializer.serialize(document);

  if (/<body\b[^>]*>[\s\S]*?<\/body\s*>/i.test(original)) {
    return original.replace(
      /(<body\b[^>]*>)[\s\S]*?(<\/body\s*>)/i,
      (_match, open, close) => `${open}${html}${close}`
    );
  }
  // Earlier editor versions saved HTML fragments. Restore the document marker
  // used by proposal preview and export, rather than treating the tags as Markdown.
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
}
