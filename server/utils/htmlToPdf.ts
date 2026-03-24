import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

const execFileAsync = promisify(execFile);

// Use the absolute path to Python 3.11 to avoid picking up the Manus sandbox
// runtime's Python 3.13 venv which may be prepended to PATH at server startup.
// PYTHONNOUSERSITE prevents user site-packages from injecting incompatible modules.
const PYTHON_BIN = "/usr/bin/python3.11";

// Minimal clean environment for the Python subprocess — avoids inheriting
// VIRTUAL_ENV, PYTHONPATH, or PATH entries that point to the 3.13 venv.
function buildCleanEnv(): NodeJS.ProcessEnv {
  return {
    PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    HOME: process.env.HOME || "/home/ubuntu",
    LANG: process.env.LANG || "C.UTF-8",
    PYTHONIOENCODING: "utf-8",
    PYTHONNOUSERSITE: "1",      // Skip ~/.local/lib/pythonX.Y/site-packages
    PYTHONDONTWRITEBYTECODE: "1",
  };
}

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

    // Run WeasyPrint via Python 3.11 with a clean environment
    const pythonScript = `
import sys
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

font_config = FontConfiguration()
html = HTML(filename=${JSON.stringify(htmlFile)})
html.write_pdf(${JSON.stringify(pdfFile)}, font_config=font_config)
print("OK", file=sys.stderr)
`;

    await execFileAsync(PYTHON_BIN, ["-c", pythonScript], {
      timeout: 120_000, // 2 minutes
      env: buildCleanEnv(),
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
