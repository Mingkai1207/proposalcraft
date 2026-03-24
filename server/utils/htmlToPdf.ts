import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

const execFileAsync = promisify(execFile);

/**
 * Convert an HTML string to a PDF buffer using WeasyPrint.
 * WeasyPrint handles @page CSS rules, print media queries, break-inside,
 * and produces clean, predictable PDFs from HTML/CSS.
 */
export async function htmlToPdf(htmlContent: string): Promise<Buffer> {
  // Create a unique temp directory for this conversion
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "proposalcraft-html-"));
  const htmlFile = path.join(tmpDir, "proposal.html");
  const pdfFile = path.join(tmpDir, "proposal.pdf");

  try {
    // Write the HTML source
    await fs.writeFile(htmlFile, htmlContent, "utf-8");

    // Run WeasyPrint via Python
    const pythonScript = `
import sys
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

font_config = FontConfiguration()
html = HTML(filename=${JSON.stringify(htmlFile)})
html.write_pdf(${JSON.stringify(pdfFile)}, font_config=font_config)
print("OK", file=sys.stderr)
`;

    await execFileAsync("python3", ["-c", pythonScript], {
      timeout: 120_000, // 2 minutes
      env: {
        ...process.env,
        PATH: process.env.PATH || "/usr/bin:/bin",
        HOME: process.env.HOME || "/home/ubuntu",
      },
    });

    // Read and return the PDF buffer
    const pdfBuffer = await fs.readFile(pdfFile);
    return pdfBuffer;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[WeasyPrint] Conversion failed:", message);
    throw new Error(`WeasyPrint PDF conversion failed: ${message.slice(0, 500)}`);
  } finally {
    // Clean up temp directory
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}
