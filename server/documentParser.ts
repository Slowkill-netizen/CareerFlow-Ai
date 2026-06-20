import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import mammoth from "mammoth";

export class DocumentParser {
  /**
   * Extract raw text from PDF buffer
   */
  static async parsePdf(buffer: Buffer): Promise<string> {
    try {
      // pdfParse returns an object containing 'text'
      const data = await pdfParse(buffer);
      if (!data || typeof data.text !== "string") {
        throw new Error("Failed to extract valid text structure from PDF.");
      }
      const trimmedText = data.text.trim();
      if (!trimmedText) {
        throw new Error("PDF document appears to be empty or contains only unscannable imagery.");
      }
      return trimmedText;
    } catch (err: any) {
      console.error("PDF parsing subsystem failure:", err);
      throw new Error(`PDF parsing error: ${err.message || "Unable to decode file contents"}`);
    }
  }

  /**
   * Extract raw text from DOCX buffer
   */
  static async parseDocx(buffer: Buffer): Promise<string> {
    try {
      // mammoth extractRawText returns { value: string, messages: any[] }
      const result = await mammoth.extractRawText({ buffer });
      if (!result || typeof result.value !== "string") {
        throw new Error("Failed to extract valid text structure from DOCX.");
      }
      const trimmedText = result.value.trim();
      if (!trimmedText) {
        throw new Error("Word document appears to be empty.");
      }
      return trimmedText;
    } catch (err: any) {
      console.error("DOCX parsing subsystem failure:", err);
      throw new Error(`DOCX parsing error: ${err.message || "Unable to decode file contents"}`);
    }
  }

  /**
   * Parses file buffer based on MIME type or filename extension
   */
  static async parseFile(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    
    if (mimeType === "application/pdf" || ext === "pdf") {
      return this.parsePdf(buffer);
    } else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === "docx"
    ) {
      return this.parseDocx(buffer);
    } else {
      throw new Error("Unsupported format. CareerFlow AI accepts standard PDF (.pdf) and Word (.docx) files.");
    }
  }
}
