/**
 * HTML to DOCX Converter
 *
 * Uses LibreOffice headlessly to convert an HTML string to a .docx file.
 * LibreOffice doesn't support direct HTML→DOCX, so we do a two-step conversion:
 *   1. HTML → ODT (LibreOffice native format)
 *   2. ODT → DOCX (MS Word 2007 XML)
 *
 * This produces a Word document that faithfully renders the same HTML template
 * used for PDF generation, ensuring visual consistency between formats.
 */

import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink, mkdtemp } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

/**
 * Convert an HTML string to a .docx Buffer using LibreOffice (HTML → ODT → DOCX).
 */
export async function htmlToDocx(html: string): Promise<Buffer> {
  const tmpDir = await mkdtemp(join(tmpdir(), "proposalcraft-docx-"));
  const htmlPath = join(tmpDir, "proposal.html");
  const odtPath = join(tmpDir, "proposal.odt");
  const docxPath = join(tmpDir, "proposal.docx");

  try {
    // Write the HTML file with proper encoding declaration
    const fullHtml = html.includes("<!DOCTYPE") ? html : `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${html}</body></html>`;
    await writeFile(htmlPath, fullHtml, "utf-8");

    // Step 1: HTML → ODT
    await execAsync(
      `libreoffice --headless --convert-to odt --outdir "${tmpDir}" "${htmlPath}"`,
      { timeout: 60000 }
    );

    // Step 2: ODT → DOCX
    await execAsync(
      `libreoffice --headless --convert-to docx --outdir "${tmpDir}" "${odtPath}"`,
      { timeout: 60000 }
    );

    // Read the output .docx file
    const docxBuffer = await readFile(docxPath);
    return docxBuffer;
  } finally {
    // Clean up temp files
    await Promise.all([
      unlink(htmlPath).catch(() => {}),
      unlink(odtPath).catch(() => {}),
      unlink(docxPath).catch(() => {}),
    ]);
  }
}
