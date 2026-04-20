import { PerformanceModel } from "../models/Performance.js";

export class PerformanceService {
  async recordTopicScore(userId: string, topic: string, score: number) {
    const today = new Date().toISOString().slice(0, 10);

    await PerformanceModel.findOneAndUpdate(
      { userId, topic },
      {
        $push: {
          scoreHistory: {
            date: today,
            score
          }
        }
      },
      { upsert: true, new: true },
    );
  }
}

