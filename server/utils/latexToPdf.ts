import { execFile, exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

// Track whether font maps have been initialized in this process
let fontMapsInitialized = false;

/**
 * Ensure pdflatex font maps (especially lmodern) are registered.
 * Runs updmap once per process lifetime to avoid repeated overhead.
 */
async function ensureFontMaps(): Promise<void> {
  if (fontMapsInitialized) return;
  try {
    await execAsync("updmap-sys --enable Map lm.map 2>/dev/null || updmap --enable Map lm.map 2>/dev/null || true");
    console.log("[LaTeX] Font maps initialized (lmodern enabled)");
  } catch {
    console.warn("[LaTeX] Font map initialization skipped (non-fatal)");
  }
  fontMapsInitialized = true;
}

/**
 * Sanitize Claude-generated LaTeX to remove/replace known problematic commands
 * that are not available in the installed TeX Live distribution.
 */
export function sanitizeLatex(latex: string): string {
  let result = latex;

  // Remove \hypersetup calls that use unsupported options
  result = result.replace(/\\hypersetup\{[^}]*\}/g, "");

  // Replace \faIcon{...} and \faEnvelope etc. (Font Awesome — not installed)
  result = result.replace(/\\fa[A-Z][A-Za-z]*(\{[^}]*\})?/g, "");

  // Replace \phone, \email, \address (custom commands from some templates)
  result = result.replace(/\\phone(\{[^}]*\})?/g, "");
  result = result.replace(/\\email(\{[^}]*\})?/g, "");
  result = result.replace(/\\address(\{[^}]*\})?/g, "");

  // Remove \usepackage{fontawesome} and \usepackage{fontawesome5}
  result = result.replace(/\\usepackage(\[.*?\])?\{fontawesome5?\}/g, "");

  // Remove \usepackage{awesomebox} — not installed
  result = result.replace(/\\usepackage(\[.*?\])?\{awesomebox\}/g, "");

  // Remove \usepackage{tcolorbox} options that require libraries not loaded
  // Keep tcolorbox but remove library loading that might fail
  result = result.replace(/\\tcbuselibrary\{[^}]*\}/g, "");

  // Remove \usepackage{minted} — requires Python Pygments
  result = result.replace(/\\usepackage(\[.*?\])?\{minted\}/g, "");

  // Remove \usepackage{lua-visual-debug} — LuaTeX only
  result = result.replace(/\\usepackage(\[.*?\])?\{lua-visual-debug\}/g, "");

  // Replace \textquotedbl with standard double quote
  result = result.replace(/\\textquotedbl\{\}/g, '"');
  result = result.replace(/\\textquotedbl/g, '"');

  // Replace \textquotesingle with standard single quote
  result = result.replace(/\\textquotesingle\{\}/g, "'");
  result = result.replace(/\\textquotesingle/g, "'");

  // Remove \setmainfont, \setsansfont, \setmonofont (fontspec — XeLaTeX only)
  result = result.replace(/\\setmainfont(\[.*?\])?\{[^}]*\}/g, "");
  result = result.replace(/\\setsansfont(\[.*?\])?\{[^}]*\}/g, "");
  result = result.replace(/\\setmonofont(\[.*?\])?\{[^}]*\}/g, "");
  result = result.replace(/\\usepackage(\[.*?\])?\{fontspec\}/g, "");

  // Remove \usepackage{unicode-math} — XeLaTeX/LuaLaTeX only
  result = result.replace(/\\usepackage(\[.*?\])?\{unicode-math\}/g, "");

  // Fix common pgfplots issues: ensure compat is set
  if (result.includes("\\usepackage{pgfplots}") && !result.includes("pgfplotsset{compat")) {
    result = result.replace(
      "\\usepackage{pgfplots}",
      "\\usepackage{pgfplots}\n\\pgfplotsset{compat=1.18}"
    );
  }

  // Ensure microtype uses expansion=false to prevent font expansion errors
  result = result.replace(
    /\\usepackage(\[.*?\])?\{microtype\}/g,
    "\\usepackage[expansion=false,protrusion=true]{microtype}"
  );

  // Ensure lmodern is loaded before microtype
  if (result.includes("\\usepackage{microtype}") || result.includes("\\usepackage[")) {
    if (!result.includes("\\usepackage{lmodern}")) {
      result = result.replace(
        /\\usepackage(\[.*?\])?\{microtype\}/,
        "\\usepackage{lmodern}\n\\usepackage[expansion=false,protrusion=true]{microtype}"
      );
    }
  }

  return result;
}

/**
 * Extract the most useful error context from a pdflatex log file.
 */
function extractLatexErrors(logContent: string): string {
  const lines = logContent.split("\n");
  const errorLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("!")) {
      // Capture the error line plus next 5 lines for context
      errorLines.push(...lines.slice(i, Math.min(i + 6, lines.length)));
      errorLines.push("---");
    }
  }
  // Also capture any "Fatal error" lines
  const fatalLines = lines.filter(l => l.includes("Fatal error") || l.includes("not found"));
  return [...errorLines, ...fatalLines].slice(0, 30).join("\n");
}

/**
 * Compile a LaTeX source string to a PDF buffer using pdflatex.
 * Runs pdflatex twice to resolve cross-references.
 * Cleans up the temp directory after compilation.
 */
export async function latexToPdf(latexSource: string): Promise<Buffer> {
  // Ensure font maps are ready before first compilation
  await ensureFontMaps();

  // Sanitize the LaTeX to remove known problematic commands
  const sanitized = sanitizeLatex(latexSource);

  // Create a unique temp directory for this compilation
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "proposai-"));
  const texFile = path.join(tmpDir, "proposal.tex");
  const pdfFile = path.join(tmpDir, "proposal.pdf");

  try {
    // Write the sanitized LaTeX source
    await fs.writeFile(texFile, sanitized, "utf-8");

    const pdflatexArgs = [
      "-interaction=nonstopmode",
      "-halt-on-error",
      "-output-directory", tmpDir,
      texFile,
    ];

    // Use default environment — pdflatex uses ~/.texlive2021/texmf-var (writable) by default
    const latexEnv = {
      ...process.env,
      PATH: process.env.PATH || "/usr/bin:/bin",
      HOME: process.env.HOME || "/home/ubuntu",
    };

    // Run pdflatex twice to resolve references (TOC, labels, etc.)
    for (let pass = 1; pass <= 2; pass++) {
      try {
        await execFileAsync("pdflatex", pdflatexArgs, {
          timeout: 180_000, // 3 minutes per pass
          env: latexEnv,
        });
      } catch (err: unknown) {
        const logFile = path.join(tmpDir, "proposal.log");
        let logContent = "";
        try {
          logContent = await fs.readFile(logFile, "utf-8");
        } catch {}

        // Check if PDF was still produced despite the error
        try {
          await fs.access(pdfFile);
          // PDF exists — non-fatal error (warnings), continue
          console.warn(`[LaTeX] Pass ${pass} had warnings:`, (err as Error).message?.slice(0, 200));
          continue;
        } catch {
          // No PDF produced — extract detailed error from log
          const errorDetail = extractLatexErrors(logContent);
          console.error(`[LaTeX] Compilation failed (pass ${pass}):\n${errorDetail}`);
          throw new Error(`pdflatex compilation failed (pass ${pass}):\n${errorDetail || (err as Error).message}`);
        }
      }
    }

    // Read and return the PDF buffer
    const pdfBuffer = await fs.readFile(pdfFile);
    return pdfBuffer;
  } finally {
    // Clean up temp directory
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

/**
 * Escape special LaTeX characters in a plain text string.
 * Use this when interpolating user-provided strings into LaTeX source.
 */
export function latexEscape(str: string): string {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/</g, "\\textless{}")
    .replace(/>/g, "\\textgreater{}");
}
