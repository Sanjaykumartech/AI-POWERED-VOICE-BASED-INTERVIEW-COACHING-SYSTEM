import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String },
    passwordChangedAt: { type: Date, default: Date.now },
    emailChangedAt: { type: Date, default: Date.now },
    targetRole: { type: String, required: true },
    candidateProfileCompleted: { type: Boolean, default: false },
    candidateDetails: {
      educationQualification: { type: String, default: "" },
      institution: { type: String, default: "" },
      fieldOfStudy: { type: String, default: "" },
      stream: { type: String, default: "" },
      department: { type: String, default: "" },
      skills: { type: [String], default: [] },
      workExperience: { type: String, default: "" },
      internshipRole: { type: String, default: "" },
      experienceDuration: { type: String, default: "" },
      preparingFor: { type: String, default: "" }
    },
    readinessScore: { type: Number, default: 35 },
    preferences: {
      preferredCategories: { type: [String], default: ["technical"] },
      targetCompanies: { type: [String], default: [] }
    },
    memorySpace: {
      interviewHistoryIds: { type: [Schema.Types.ObjectId], ref: "Session", default: [] },
      aiInsights: { type: [String], default: [] }
    }
  },
  { timestamps: true },
);

export const UserModel = mongoose.model("User", userSchema);
