import { marked } from "marked";
import {
  defaultMarkdownSerializer,
  MarkdownSerializer,
} from "@tiptap/pm/markdown";
import type { Node } from "@tiptap/pm/model";

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
