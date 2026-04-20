import multer from "multer";
import { z } from "zod";

import { InterviewService } from "../services/interview.service.js";
import { ResumeExtractionService } from "../services/resume-extraction.service.js";
import { TranscriptionService } from "../services/transcription.service.js";
import { asyncHandler } from "../utils/async-handler.js";

const createSessionSchema = z.object({
  role: z.string().min(2),
  topics: z.array(z.string().min(2)).min(1),
  category: z.enum(["technical", "management", "general"]),
  mode: z.enum(["mock", "company"]),
  company: z.string().optional(),
  resumeText: z.string().max(5000).optional()
});

const answerSchema = z.object({
  question: z.string().min(5),
  answer: z.string().min(2),
  topic: z.string().min(2)
});

const sessionStatusSchema = z.object({
  status: z.enum(["paused", "active"])
});

const interviewService = new InterviewService();
const resumeExtractionService = new ResumeExtractionService();
const transcriptionService = new TranscriptionService();
export const resumeUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
export const audioUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

export const createSessionController = asyncHandler(async (request, response) => {
  const input = createSessionSchema.parse(request.body);
  const session = await interviewService.createSession({
    ...input,
    userId: request.user!.userId
  });

  response.status(201).json(session);
});

export const answerQuestionController = asyncHandler(async (request, response) => {
  const input = answerSchema.parse(request.body);
  const result = await interviewService.answerQuestion({
    ...input,
    sessionId: String(request.params.sessionId),
    userId: request.user!.userId
  });

  response.json(result);
});

export const completeSessionController = asyncHandler(async (request, response) => {
  const result = await interviewService.completeSession({
    sessionId: String(request.params.sessionId),
    userId: request.user!.userId
  });

  response.json(result);
});

export const sessionDetailsController = asyncHandler(async (request, response) => {
  const result = await interviewService.getSessionDetails({
    sessionId: String(request.params.sessionId),
    userId: request.user!.userId
  });

  response.json(result);
});

export const listSessionsController = asyncHandler(async (request, response) => {
  const result = await interviewService.listSessions({
    userId: request.user!.userId
  });

  response.json({ sessions: result });
});

export const updateSessionStatusController = asyncHandler(async (request, response) => {
  const input = sessionStatusSchema.parse(request.body);
  const result = await interviewService.updateSessionStatus({
    sessionId: String(request.params.sessionId),
    userId: request.user!.userId,
    status: input.status
  });

  response.json(result);
});

export const extractResumeTextController = asyncHandler(async (request, response) => {
  if (!request.file) {
    response.status(400).json({ message: "Resume file is required" });
    return;
  }

  const result = await resumeExtractionService.extract(request.file);
  response.json(result);
});

export const transcribeAudioController = asyncHandler(async (request, response) => {
  if (!request.file) {
    response.status(400).json({ message: "Audio file is required" });
    return;
  }

  const result = await transcriptionService.transcribeAudio(request.file);
  response.json(result);
});
