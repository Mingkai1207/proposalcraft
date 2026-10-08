import { Node, mergeAttributes } from "@tiptap/react";
import { goToNextCell, tableEditing } from "@tiptap/pm/tables";

// StarterKit does not include tables. Keep the estimate rows as editable cells.
const Table = Node.create({
  name: "table",
  group: "block",
  content: "tableRow+",
  isolating: true,
  parseHTML: () => [{ tag: "table" }],
  renderHTML: ({ HTMLAttributes }) => ["table", HTMLAttributes, ["tbody", 0]],
  extendNodeSchema(extension) {
    return extension.name === this.name ? { tableRole: "table" } : {};
  },
  addProseMirrorPlugins: () => [tableEditing()],
  addKeyboardShortcuts() {
    return {
      Tab: () => goToNextCell(1)(this.editor.state, this.editor.view.dispatch),
      "Shift-Tab": () =>
        goToNextCell(-1)(this.editor.state, this.editor.view.dispatch),
    };
  },
});

const TableRow = Node.create({
  name: "tableRow",
  content: "(tableCell | tableHeader)+",
  parseHTML: () => [{ tag: "tr" }],
  renderHTML: ({ HTMLAttributes }) => ["tr", HTMLAttributes, 0],
  extendNodeSchema(extension) {
    return extension.name === this.name ? { tableRole: "row" } : {};
  },
});

function tableCell(name: "tableCell" | "tableHeader", tag: "td" | "th") {
  return Node.create({
    name,
    content: "block+",
    isolating: true,
    addAttributes: () => ({
      colspan: {
        default: 1,
        parseHTML: element => Number(element.getAttribute("colspan")) || 1,
      },
      rowspan: {
        default: 1,
        parseHTML: element => Number(element.getAttribute("rowspan")) || 1,
      },
      colwidth: { default: null, rendered: false },
      textAlign: {
        default: null,
        parseHTML: element =>
          element.style.textAlign || element.getAttribute("align"),
        renderHTML: attributes =>
          attributes.textAlign
            ? { style: `text-align: ${attributes.textAlign}` }
            : {},
      },
    }),
    parseHTML: () => [{ tag }],
    renderHTML: ({ HTMLAttributes }) => [
      tag,
      mergeAttributes(HTMLAttributes),
      0,
    ],
    extendNodeSchema(extension) {
      return extension.name === this.name
        ? { tableRole: tag === "th" ? "header_cell" : "cell" }
        : {};
    },
  });
}

export const proposalTableExtensions = [
  Table,
  TableRow,
  tableCell("tableCell", "td"),
  tableCell("tableHeader", "th"),
];
