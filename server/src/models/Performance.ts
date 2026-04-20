import mongoose, { Schema } from "mongoose";

const scorePointSchema = new Schema(
  {
    date: { type: String, required: true },
    score: { type: Number, required: true }
  },
  { _id: false },
);

const performanceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topic: { type: String, required: true },
    scoreHistory: { type: [scorePointSchema], default: [] }
  },
  { timestamps: true },
);

performanceSchema.index({ userId: 1, topic: 1 }, { unique: true });

export const PerformanceModel = mongoose.model("Performance", performanceSchema);

