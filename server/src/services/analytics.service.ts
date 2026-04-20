import type { DashboardPayload, InsightCard } from "@ai-interview/shared";

import { ActivityModel } from "../models/Activity.js";
import { PerformanceModel } from "../models/Performance.js";
import { SessionModel } from "../models/Session.js";
import { UserModel } from "../models/User.js";
import { formatLocalDate } from "../utils/date.js";
import { ApiError } from "../utils/api-error.js";
import { RecommendationService } from "./recommendation.service.js";

export class AnalyticsService {
  private recommendationService = new RecommendationService();

  private normalizePreferences(
    preferences: { preferredCategories?: string[]; targetCompanies?: string[] } | null | undefined,
  ) {
    return {
      preferredCategories: (preferences?.preferredCategories ?? ["technical"]) as DashboardPayload["profile"]["preferences"]["preferredCategories"],
      targetCompanies: preferences?.targetCompanies ?? []
    };
  }

  async getDashboard(userId: string): Promise<DashboardPayload> {
    const [user, sessions, activities, performance] = await Promise.all([
      UserModel.findById(userId).lean(),
      SessionModel.find({ userId }).sort({ startedAt: -1 }).limit(8).lean(),
      ActivityModel.find({ userId }).sort({ date: -1 }).limit(120).lean(),
      PerformanceModel.find({ userId }).lean()
    ]);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const stats = this.computeStats(sessions, performance);
    const readinessTrend = sessions
      .slice()
      .reverse()
      .map((session) => ({
        date: formatLocalDate(session.startedAt),
        score: session.averageScore
      }));

    const topicScores = performance.map((entry) => {
      const latest = entry.scoreHistory.at(-1);
      return {
        topic: entry.topic,
        proficiency: latest?.score ?? 0,
        lastPracticedAt: latest?.date
      };
    });

    const weakness = await this.recommendationService.detectWeakness(userId);
    const insights: InsightCard[] = [
      {
        title: "Weakness detection",
        description: weakness.insight,
        severity: "warning"
      },
      {
        title: "Consistency pulse",
        description:
          activities.length >= 5
            ? "You have sustained a healthy interview preparation rhythm this month."
            : "Build momentum with shorter daily interview reps to improve retention.",
        severity: activities.length >= 5 ? "success" : "info"
      },
      {
        title: "Adaptive coaching",
        description: `Your next session should emphasize ${weakness.weakestTopic} with slightly higher difficulty.`,
        severity: "info"
      }
    ];

    return {
      profile: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        targetRole: user.targetRole,
        readinessScore: user.readinessScore,
        candidateProfileCompleted: user.candidateProfileCompleted,
        candidateDetails: user.candidateDetails ?? undefined,
        preferences: this.normalizePreferences(user.preferences)
      },
      stats,
      readinessTrend,
      topicScores,
      heatmap: this.buildYearHeatmap(activities),
      recentSessions: sessions.map((session) => ({
        id: String(session._id),
        userId: String(session.userId),
        mode: session.mode,
        role: session.role,
        company: session.company ?? undefined,
        topics: session.topics,
        category: session.category,
        status: session.status,
        startedAt: session.startedAt.toISOString(),
        endedAt: session.endedAt?.toISOString(),
        averageScore: session.averageScore,
        adaptiveDifficulty: session.adaptiveDifficulty,
        summary: session.summary
          ? {
              mistakes: session.summary.mistakes,
              weakTopics: session.summary.weakTopics,
              strengths: session.summary.strengths,
              correctAnswers: session.summary.correctAnswers,
              dos: session.summary.dos,
              donts: session.summary.donts,
              overallFeedback: session.summary.overallFeedback
            }
          : undefined
      })),
      insights
    };
  }

  private buildYearHeatmap(
    activities: Array<{
      date: string;
      activeHours: number;
      sessionsCount: number;
      topicsStudied: string[];
      scores: number[];
      feedbackHighlights: string[];
    }>,
  ) {
    const activityMap = new Map(activities.map((activity) => [activity.date, activity]));
    const cells: DashboardPayload["heatmap"] = [];
    const today = new Date();

    for (let offset = 364; offset >= 0; offset -= 1) {
      const currentDate = new Date(today);
      currentDate.setHours(0, 0, 0, 0);
      currentDate.setDate(today.getDate() - offset);
      const date = formatLocalDate(currentDate);
      const activity = activityMap.get(date);

      cells.push({
        date,
        intensity: activity
          ? activity.sessionsCount >= 4
            ? 4
            : activity.sessionsCount >= 3
              ? 3
              : activity.sessionsCount >= 2
                ? 2
                : 1
          : 0,
        activeHours: activity?.activeHours ?? 0,
        sessionsCount: activity?.sessionsCount ?? 0,
        topicsStudied: activity?.topicsStudied ?? [],
        scores: activity?.scores ?? [],
        feedbackHighlights: activity?.feedbackHighlights ?? []
      });
    }

    return cells;
  }

  private computeStats(
    sessions: Array<{ averageScore: number; topics: string[] }>,
    performance: Array<{ topic: string; scoreHistory: Array<{ score: number }> }>,
  ) {
    const totalSessions = sessions.length;
    const averageScore =
      totalSessions === 0
        ? 0
        : Number((sessions.reduce((sum, session) => sum + session.averageScore, 0) / totalSessions).toFixed(1));

    const ranking = performance
      .map((entry) => {
        const average =
          entry.scoreHistory.reduce((sum, item) => sum + item.score, 0) / Math.max(entry.scoreHistory.length, 1);
        return { topic: entry.topic, average };
      })
      .sort((left, right) => right.average - left.average);

    return {
      totalSessions,
      averageScore,
      strongestTopic: ranking[0]?.topic ?? "N/A",
      weakestTopic: ranking.at(-1)?.topic ?? "N/A"
    };
  }
}
