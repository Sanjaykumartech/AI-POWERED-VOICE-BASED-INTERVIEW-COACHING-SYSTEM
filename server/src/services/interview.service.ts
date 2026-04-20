import { InteractionModel } from "../models/Interaction.js";
import { SessionModel } from "../models/Session.js";
import { UserModel } from "../models/User.js";
import { ApiError } from "../utils/api-error.js";
import { ActivityService } from "./activity.service.js";
import { AiService } from "./ai.service.js";
import { PerformanceService } from "./performance.service.js";
import { RecommendationService } from "./recommendation.service.js";

export class InterviewService {
  private aiService = new AiService();

  private recommendationService = new RecommendationService();

  private activityService = new ActivityService();

  private performanceService = new PerformanceService();

  async createSession(input: {
    userId: string;
    role: string;
    topics: string[];
    category: "technical" | "management" | "general";
    mode: "mock" | "company";
    company?: string;
    resumeText?: string;
  }) {
    const weakness = await this.recommendationService.detectWeakness(input.userId);
    const session = await SessionModel.create({
      ...input,
      adaptiveDifficulty: weakness.weakestTopic === input.topics[0] ? 2 : 3,
      status: "active"
    });

    await UserModel.findByIdAndUpdate(input.userId, {
      $push: { "memorySpace.interviewHistoryIds": session._id }
    });
    await this.activityService.recordSessionStart({
      userId: input.userId,
      topics: input.topics
    });

    const openingQuestion = await this.aiService.generateQuestion({
      role: input.role,
      topics: input.topics,
      category: input.category,
      company: input.company,
      difficulty: session.adaptiveDifficulty,
      weaknessHint: weakness.weakestTopic,
      resumeText: input.resumeText,
      sessionHistory: []
    });

    session.pendingQuestion = openingQuestion.question;
    session.pendingTopic = openingQuestion.topic;
    session.pendingWhyThisMatters = openingQuestion.whyThisMatters;
    await session.save();

    return {
      sessionId: session.id,
      openingQuestion,
      personalizedInsight:
        input.mode === "company" && input.company
          ? `You are currently weakest in ${weakness.weakestTopic}, which matters for ${input.company}-style interviews.`
          : `Your next practice should reinforce ${weakness.weakestTopic} to lift your readiness score faster.`
    };
  }

  async answerQuestion(input: {
    sessionId: string;
    userId: string;
    question: string;
    answer: string;
    topic: string;
  }) {
    const session = await SessionModel.findById(input.sessionId);

    if (!session || String(session.userId) !== input.userId) {
      throw new ApiError(404, "Session not found");
    }

    const evaluation = await this.aiService.evaluateAnswer({
      question: input.question,
      answer: input.answer,
      topic: input.topic,
      role: session.role,
      company: session.company ?? undefined
    });

    await InteractionModel.create({
      sessionId: session.id,
      userId: input.userId,
      topic: input.topic,
      question: input.question,
      answer: input.answer,
      score: evaluation.score,
      correctness: evaluation.correctness,
      missingPoints: evaluation.missingPoints,
      conceptClarity: evaluation.conceptClarity,
      suggestedImprovements: evaluation.suggestedImprovements,
      feedback: evaluation.feedback
    });

    await this.performanceService.recordTopicScore(input.userId, input.topic, evaluation.score);
    await this.activityService.recordInteraction({
      userId: input.userId,
      topic: input.topic,
      score: evaluation.score,
      feedback: evaluation.feedback
    });

    const interactions = await InteractionModel.find({ sessionId: session.id }).sort({ createdAt: 1 });
    const averageScore = interactions.reduce((sum, item) => sum + item.score, 0) / Math.max(interactions.length, 1);
    session.averageScore = Number(averageScore.toFixed(1));
    await session.save();

    const weakness = await this.recommendationService.detectWeakness(input.userId);
    const nextDifficulty = evaluation.score >= 8
      ? Math.min(5, session.adaptiveDifficulty + 1)
      : evaluation.score <= 4
        ? Math.max(1, session.adaptiveDifficulty - 1)
        : session.adaptiveDifficulty;

    session.adaptiveDifficulty = nextDifficulty;
    await session.save();

    const nextQuestion = await this.aiService.generateQuestion({
      role: session.role,
      topics: session.topics,
      category: session.category,
      company: session.company ?? undefined,
      difficulty: nextDifficulty,
      weaknessHint: weakness.weakestTopic,
      resumeText: session.resumeText ?? undefined,
      sessionHistory: interactions.map((item) => ({
        question: item.question,
        answer: item.answer,
        topic: item.topic,
        score: item.score,
        feedback: item.feedback
      }))
    });

    session.pendingQuestion = nextQuestion.question;
    session.pendingTopic = nextQuestion.topic;
    session.pendingWhyThisMatters = nextQuestion.whyThisMatters;
    await session.save();

    return {
      evaluation,
      nextQuestion
    };
  }

  async completeSession(input: { sessionId: string; userId: string }) {
    const session = await SessionModel.findById(input.sessionId);

    if (!session || String(session.userId) !== input.userId) {
      throw new ApiError(404, "Session not found");
    }

    const interactions = await InteractionModel.find({ sessionId: session.id }).lean();

    const summary = await this.aiService.summarizeSession({
      role: session.role,
      topics: session.topics,
      transcript: interactions.map((item) => ({
        question: item.question,
        answer: item.answer,
        score: item.score,
        feedback: item.feedback
      }))
    });

    session.status = "completed";
    session.endedAt = new Date();
    session.pendingQuestion = undefined;
    session.pendingTopic = undefined;
    session.pendingWhyThisMatters = undefined;
    session.summary = summary;
    await session.save();

    const averageScore =
      interactions.reduce((sum, item) => sum + item.score, 0) / Math.max(interactions.length, 1);

    await UserModel.findByIdAndUpdate(input.userId, {
      readinessScore: Math.min(100, Math.round(averageScore * 10))
    });

    return {
      sessionId: session.id,
      summary
    };
  }

  async getSessionDetails(input: { sessionId: string; userId: string }) {
    const session = await SessionModel.findById(input.sessionId).lean();

    if (!session || String(session.userId) !== input.userId) {
      throw new ApiError(404, "Session not found");
    }

    const interactions = await InteractionModel.find({ sessionId: session._id }).sort({ createdAt: 1 }).lean();

    return {
      session,
      interactions
    };
  }

  async listSessions(input: { userId: string }) {
    const sessions = await SessionModel.find({ userId: input.userId }).sort({ updatedAt: -1 }).lean();
    const sessionIds = sessions.map((session) => session._id);
    const interactions = await InteractionModel.find({ sessionId: { $in: sessionIds } })
      .sort({ createdAt: -1 })
      .lean();

    const latestInteractionBySession = new Map<string, (typeof interactions)[number]>();
    for (const interaction of interactions) {
      const key = String(interaction.sessionId);
      if (!latestInteractionBySession.has(key)) {
        latestInteractionBySession.set(key, interaction);
      }
    }

    return sessions.map((session) => {
      const latestInteraction = latestInteractionBySession.get(String(session._id));

      return {
        id: String(session._id),
        role: session.role,
        mode: session.mode,
        company: session.company ?? undefined,
        topics: session.topics,
        category: session.category,
        status: session.status,
        startedAt: session.startedAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        endedAt: session.endedAt?.toISOString(),
        averageScore: session.averageScore,
        interactionCount: interactions.filter((item) => String(item.sessionId) === String(session._id)).length,
        preview:
          session.pendingQuestion ??
          latestInteraction?.question ??
          `${session.role} interview session`,
        resumable: session.status !== "completed"
      };
    });
  }

  async updateSessionStatus(input: {
    sessionId: string;
    userId: string;
    status: "paused" | "active";
  }) {
    const session = await SessionModel.findById(input.sessionId);

    if (!session || String(session.userId) !== input.userId) {
      throw new ApiError(404, "Session not found");
    }

    session.status = input.status;
    await session.save();

    return {
      sessionId: session.id,
      status: session.status
    };
  }
}
