import mongoose, { Schema } from "mongoose";

const authSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenId: { type: String, required: true, unique: true, index: true },
    deviceLabel: { type: String, required: true },
    userAgent: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
    lastActiveAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null }
  },
  { timestamps: true },
);

authSessionSchema.index({ userId: 1, revokedAt: 1, lastActiveAt: -1 });

export const AuthSessionModel = mongoose.model("AuthSession", authSessionSchema);
