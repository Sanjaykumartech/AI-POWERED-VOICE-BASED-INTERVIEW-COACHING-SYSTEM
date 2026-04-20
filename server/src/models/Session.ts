import mongoose, { Schema } from "mongoose";

const summarySchema = new Schema(
  {
    mistakes: { type: [String], default: [] },
    weakTopics: { type: [String], default: [] },
    strengths: { type: [String], default: [] },
    correctAnswers: { type: [String], default: [] },
    dos: { type: [String], default: [] },
    donts: { type: [String], default: [] },
    overallFeedback: { type: String, default: "" }
  },
  { _id: false },
);

const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mode: { type: String, enum: ["mock", "company"], required: true },
    role: { type: String, required: true },
    company: { type: String },
    resumeText: { type: String },
    topics: { type: [String], required: true },
    category: { type: String, enum: ["technical", "management", "general"], required: true },
    status: { type: String, enum: ["active", "completed", "paused"], default: "active" },
    averageScore: { type: Number, default: 0 },
    adaptiveDifficulty: { type: Number, default: 1 },
    pendingQuestion: { type: String },
    pendingTopic: { type: String },
    pendingWhyThisMatters: { type: String },
    summary: { type: summarySchema },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date }
  },
  { timestamps: true },
);

export const SessionModel = mongoose.model("Session", sessionSchema);
