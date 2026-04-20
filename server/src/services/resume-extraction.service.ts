import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import { createWorker } from "tesseract.js";

import { ApiError } from "../utils/api-error.js";

const supportedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp"
]);

export class ResumeExtractionService {
  async extract(file: Express.Multer.File) {
    if (!supportedMimeTypes.has(file.mimetype)) {
      throw new ApiError(400, "Unsupported file type. Upload PDF, DOCX, TXT, PNG, JPG, or WEBP.");
    }

    let extractedText = "";

    if (file.mimetype === "application/pdf") {
      const parsed = await pdfParse(file.buffer);
      extractedText = parsed.text;
    } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const parsed = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = parsed.value;
    } else if (file.mimetype === "text/plain") {
      extractedText = file.buffer.toString("utf-8");
    } else {
      const worker = await createWorker("eng");
      const result = await worker.recognize(file.buffer);
      extractedText = result.data.text;
      await worker.terminate();
    }

    const cleaned = extractedText.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

    if (!cleaned) {
      throw new ApiError(422, "No readable text could be extracted from the uploaded file.");
    }

    return {
      text: cleaned,
      filename: file.originalname
    };
  }
}

