/**
 * Google Docs Export
 *
 * Generates a .docx file and returns a URL that opens it directly in Google Docs.
 * Google Docs can import .docx files via the URL:
 *   https://docs.google.com/document/d/create?usp=pp_url&title=...
 *
 * The practical approach:
 * 1. Generate the .docx buffer (reuse wordExporter)
 * 2. Upload to S3 (public URL)
 * 3. Return a Google Docs import URL that opens the file
 *
 * Note: Google Docs can open a .docx from a public URL via:
 *   https://docs.google.com/viewer?url=<encoded-url>&embedded=false
 * Or import it via the Google Drive API (requires OAuth).
 *
 * We use the viewer approach for zero-auth access.
 */

import { exportToWord, type WordExportInput } from "./wordExporter";
import { storagePut } from "../storage";

export interface GoogleDocsExportResult {
  /** Direct download URL for the .docx file */
  docxUrl: string;
  /** Google Docs viewer URL (opens the file in Google Docs viewer) */
  googleDocsViewerUrl: string;
  /** Instruction for the user */
  instruction: string;
}

export async function exportToGoogleDocs(input: WordExportInput, proposalId: number): Promise<GoogleDocsExportResult> {
  // Generate the .docx buffer
  const docxBuffer = await exportToWord(input);

  // Upload to S3
  const fileName = `proposal-${proposalId}-${Date.now()}.docx`;
  const { url: docxUrl } = await storagePut(
    fileName,
    docxBuffer,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );

  // Google Docs viewer URL — opens the file in Google Docs viewer
  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(docxUrl)}&embedded=false`;

  return {
    docxUrl,
    googleDocsViewerUrl,
    instruction: "Click 'Open with Google Docs' in the viewer toolbar to create an editable copy in your Google Drive.",
  };
}
