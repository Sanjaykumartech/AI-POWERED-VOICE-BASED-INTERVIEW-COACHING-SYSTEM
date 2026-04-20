import mongoose, { Schema } from "mongoose";

const activitySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true, index: true },
    activeHours: { type: Number, default: 0 },
    sessionsCount: { type: Number, default: 0 },
    topicsStudied: { type: [String], default: [] },
    scores: { type: [Number], default: [] },
    feedbackHighlights: { type: [String], default: [] }
  },
  { timestamps: true },
);

activitySchema.index({ userId: 1, date: 1 }, { unique: true });

export const ActivityModel = mongoose.model("Activity", activitySchema);

