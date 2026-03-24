import * as pdfModule from "pdf-parse";
import mammoth from "mammoth";

// Get the correct PDF parser function
const pdfParse = (pdfModule as any).default || (pdfModule as any).PDFParse || pdfModule;

/**
 * Parse file content based on MIME type and extract text
 */
export async function parseFileContent(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  try {
    // Handle PDF files
    if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
      try {
        // pdf-parse expects a buffer and returns a promise with text property
        const pdfData = await pdfParse(fileBuffer);
        return pdfData.text || "";
      } catch (err) {
        console.error("PDF parsing failed, falling back to binary:", err);
        return new TextDecoder().decode(fileBuffer);
      }
    }

    // Handle DOCX files
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword" ||
      fileName.endsWith(".docx") ||
      fileName.endsWith(".doc")
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        return result.value || "";
      } catch (err) {
        console.error("DOCX parsing failed, falling back to binary:", err);
        return new TextDecoder().decode(fileBuffer);
      }
    }

    // Handle text files
    if (
      mimeType === "text/plain" ||
      mimeType === "text/markdown" ||
      fileName.endsWith(".txt") ||
      fileName.endsWith(".md")
    ) {
      return new TextDecoder().decode(fileBuffer);
    }

    // Default: try to decode as text
    return new TextDecoder().decode(fileBuffer);
  } catch (err) {
    console.error("File parsing error:", err);
    // Return empty string on error - better than crashing
    return "";
  }
}

/**
 * Decode base64 file content to Buffer
 */
export function decodeBase64File(base64Content: string): Buffer {
  // Handle data URL format (data:type;base64,content)
  const base64String = base64Content.includes(",")
    ? base64Content.split(",")[1]
    : base64Content;

  return Buffer.from(base64String, "base64");
}
