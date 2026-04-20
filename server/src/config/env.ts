import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: "../.env" });
dotenv.config();

const envSchema = z.object({
  API_PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default("7d"),
  SESSION_IDLE_TIMEOUT_MINUTES: z.coerce.number().positive().default(30),
  APP_URL: z.string().url().default("http://localhost:3000"),
  FRONTEND_URL: z.string().url().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-nano"),
  OPENAI_TRANSCRIPTION_MODEL: z.string().default("whisper-1"),
  OPENAI_BASE_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().default("http://localhost:3000,http://localhost:3001")
});

export const env = envSchema.parse(process.env);
