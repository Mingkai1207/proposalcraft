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
 * Runs updmap-sys once per process lifetime to avoid repeated overhead.
 */
async function ensureFontMaps(): Promise<void> {
  if (fontMapsInitialized) return;
  try {
    // Enable lmodern Type1 fonts so pdflatex can embed them as scalable vectors
    await execAsync("updmap-sys --enable Map lm.map 2>/dev/null || updmap --enable Map lm.map 2>/dev/null || true");
    console.log("[LaTeX] Font maps initialized (lmodern enabled)");
  } catch {
    // Non-fatal — pdflatex may still work if maps were already configured
    console.warn("[LaTeX] Font map initialization skipped (non-fatal)");
  }
  fontMapsInitialized = true;
}

/**
 * Compile a LaTeX source string to a PDF buffer using pdflatex.
 * Runs pdflatex twice to resolve cross-references.
 * Cleans up the temp directory after compilation.
 */
export async function latexToPdf(latexSource: string): Promise<Buffer> {
  // Ensure font maps are ready before first compilation
  await ensureFontMaps();

  // Create a unique temp directory for this compilation
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "proposalcraft-"));
  const texFile = path.join(tmpDir, "proposal.tex");
  const pdfFile = path.join(tmpDir, "proposal.pdf");

  try {
    // Write the LaTeX source
    await fs.writeFile(texFile, latexSource, "utf-8");

    const pdflatexArgs = [
      "-interaction=nonstopmode",
      "-halt-on-error",
      "-output-directory", tmpDir,
      texFile,
    ];

    // pdflatex needs access to the system font maps
    const latexEnv = {
      ...process.env,
      PATH: process.env.PATH || "/usr/bin:/bin",
      // Point to the system-wide updmap-generated font map
      TEXMFVAR: "/var/lib/texmf",
      TEXMFSYSVAR: "/var/lib/texmf",
    };

    // Run pdflatex twice to resolve references (TOC, labels, etc.)
    for (let pass = 1; pass <= 2; pass++) {
      try {
        await execFileAsync("pdflatex", pdflatexArgs, {
          timeout: 180_000, // 3 minutes per pass
          env: latexEnv,
        });
      } catch (err: unknown) {
        // pdflatex exits non-zero on warnings too; only fail if no PDF produced
        const logFile = path.join(tmpDir, "proposal.log");
        let logContent = "";
        try {
          logContent = await fs.readFile(logFile, "utf-8");
        } catch {}

        // Check if PDF was still produced despite the error
        try {
          await fs.access(pdfFile);
          // PDF exists — non-fatal error (e.g. overfull hbox warnings), continue
          console.warn(`[LaTeX] Pass ${pass} had warnings:`, (err as Error).message?.slice(0, 200));
          continue;
        } catch {
          // No PDF produced — extract the actual error from the log
          const errorLines = logContent
            .split("\n")
            .filter(l => l.startsWith("!") || l.includes("Fatal") || l.includes("not found"))
            .slice(0, 10)
            .join("\n");
          throw new Error(`pdflatex compilation failed (pass ${pass}):\n${errorLines || (err as Error).message}`);
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
    .replace(/>/g, "\\textgreater{}")
    .replace(/"/g, "\\textquotedbl{}")
    .replace(/'/g, "\\textquotesingle{}");
}
