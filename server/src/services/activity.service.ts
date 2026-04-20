import { ActivityModel } from "../models/Activity.js";
import { formatLocalDate } from "../utils/date.js";

export class ActivityService {
  async recordSessionStart(input: { userId: string; topics: string[] }) {
    const today = formatLocalDate(new Date());

    await ActivityModel.findOneAndUpdate(
      { userId: input.userId, date: today },
      {
        $inc: {
          activeHours: 0.25,
          sessionsCount: 1
        },
        $addToSet: {
          topicsStudied: { $each: input.topics }
        }
      },
      { upsert: true, new: true },
    );
  }

  async recordInteraction(input: { userId: string; topic: string; score: number; feedback: string }) {
    const today = formatLocalDate(new Date());

    await ActivityModel.findOneAndUpdate(
      { userId: input.userId, date: today },
      {
        $inc: {
          activeHours: 0.25
        },
        $addToSet: {
          topicsStudied: input.topic,
          feedbackHighlights: input.feedback
        },
        $push: {
          scores: input.score
        }
      },
      { upsert: true, new: true },
    );
  }
}
