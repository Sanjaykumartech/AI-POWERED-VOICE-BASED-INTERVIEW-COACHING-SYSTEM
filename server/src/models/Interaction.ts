import mongoose, { Schema } from "mongoose";

const interactionSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topic: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    score: { type: Number, required: true },
    correctness: { type: String, required: true },
    missingPoints: { type: [String], default: [] },
    conceptClarity: { type: String, required: true },
    suggestedImprovements: { type: [String], default: [] },
    feedback: { type: String, required: true }
  },
  { timestamps: true },
);

export const InteractionModel = mongoose.model("Interaction", interactionSchema);

