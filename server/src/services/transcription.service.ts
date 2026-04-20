import { toFile } from "openai/uploads";

import { env } from "../config/env.js";
import { openaiClient } from "../lib/openai.js";
import { ApiError } from "../utils/api-error.js";

export class TranscriptionService {
  async transcribeAudio(file: Express.Multer.File) {
    if (!openaiClient) {
      throw new ApiError(400, "OpenAI API key is required for audio transcription.");
    }

    const upload = await toFile(file.buffer, file.originalname || "voice.webm", {
      type: file.mimetype
    });

    const response = await openaiClient.audio.transcriptions.create({
      file: upload,
      model: env.OPENAI_TRANSCRIPTION_MODEL
    });

    return {
      text: response.text?.trim() ?? ""
    };
  }
}

