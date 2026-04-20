import { PerformanceModel } from "../models/Performance.js";

export class RecommendationService {
  async detectWeakness(userId: string) {
    const topics = await PerformanceModel.find({ userId }).lean();

    if (!topics.length) {
      return {
        weakestTopic: "communication",
        insight: "Build confidence with foundational interview communication and structured responses."
      };
    }

    const ranked = topics
      .map((entry) => {
        const scores = entry.scoreHistory.map((point) => point.score);
        const average = scores.reduce((sum, value) => sum + value, 0) / Math.max(scores.length, 1);
        return { topic: entry.topic, average };
      })
      .sort((left, right) => left.average - right.average);

    const weakest = ranked[0];

    return {
      weakestTopic: weakest.topic,
      insight: `${weakest.topic} is currently your weakest area. Prioritize targeted practice and deeper examples.`
    };
  }
}
