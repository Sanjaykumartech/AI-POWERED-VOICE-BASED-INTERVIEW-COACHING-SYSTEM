import { Router } from "express";

import {
  audioUpload,
  answerQuestionController,
  completeSessionController,
  createSessionController,
  extractResumeTextController,
  listSessionsController,
  resumeUpload,
  sessionDetailsController,
  transcribeAudioController,
  updateSessionStatusController
} from "../controllers/interview.controller.js";
import { authenticate } from "../middleware/auth.js";

export const interviewRouter = Router();

interviewRouter.use(authenticate);
interviewRouter.post("/resume/extract", resumeUpload.single("resume"), extractResumeTextController);
interviewRouter.post("/transcribe", audioUpload.single("audio"), transcribeAudioController);
interviewRouter.get("/sessions", listSessionsController);
interviewRouter.post("/sessions", createSessionController);
interviewRouter.post("/sessions/:sessionId/answer", answerQuestionController);
interviewRouter.post("/sessions/:sessionId/complete", completeSessionController);
interviewRouter.get("/sessions/:sessionId", sessionDetailsController);
interviewRouter.patch("/sessions/:sessionId/status", updateSessionStatusController);
