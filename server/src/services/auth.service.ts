import bcrypt from "bcryptjs";
import crypto from "crypto";

import { signAccessToken } from "../lib/jwt.js";
import { AuthSessionModel } from "../models/AuthSession.js";
import { UserModel } from "../models/User.js";
import { ApiError } from "../utils/api-error.js";

interface CandidateDetailsInput {
  educationQualification: string;
  institution?: string;
  fieldOfStudy: string;
  stream?: string;
  department?: string;
  skills: string[];
  workExperience?: string;
  internshipRole?: string;
  experienceDuration?: string;
  preparingFor: string;
}

export class AuthService {
  private sanitizeUser(user: {
    id?: string;
    _id?: unknown;
    name: string;
    email: string;
    targetRole: string;
    readinessScore: number;
    preferences?: {
      preferredCategories?: string[];
      targetCompanies?: string[];
    } | null | undefined;
    candidateProfileCompleted?: boolean;
    candidateDetails?: CandidateDetailsInput | null;
    requiresCandidateOnboarding?: boolean;
  }) {
    return {
      id: user.id ?? String(user._id),
      name: user.name,
      email: user.email,
      targetRole: user.targetRole,
      readinessScore: user.readinessScore,
      avatarUrl: "avatarUrl" in user ? user.avatarUrl : undefined,
      candidateProfileCompleted: user.candidateProfileCompleted ?? true,
      requiresCandidateOnboarding: user.requiresCandidateOnboarding ?? false,
      candidateDetails: user.candidateDetails ?? undefined,
      preferences: {
        preferredCategories: user.preferences?.preferredCategories ?? ["technical"],
        targetCompanies: user.preferences?.targetCompanies ?? []
      },
      createdAt: "createdAt" in user && user.createdAt instanceof Date ? user.createdAt.toISOString() : undefined,
      passwordChangedAt:
        "passwordChangedAt" in user && user.passwordChangedAt instanceof Date
          ? user.passwordChangedAt.toISOString()
          : undefined,
      emailChangedAt:
        "emailChangedAt" in user && user.emailChangedAt instanceof Date
          ? user.emailChangedAt.toISOString()
          : undefined
    };
  }

  private async createSession(user: { id: string; email: string }, metadata: { userAgent: string; ipAddress: string }) {
    const tokenId = crypto.randomUUID();
    await AuthSessionModel.create({
      userId: user.id,
      tokenId,
      deviceLabel: metadata.userAgent,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
      lastActiveAt: new Date()
    });

    const token = signAccessToken({ userId: user.id, email: user.email, sessionId: tokenId });
    return { token, sessionId: tokenId };
  }

  async loginWithGoogle(
    input: { googleId: string; email: string; name: string; avatarUrl?: string },
    metadata: { deviceLabel: string; userAgent: string; ipAddress: string },
  ) {
    const normalizedEmail = input.email.toLowerCase();
    let createdNewUser = false;
    let user = await UserModel.findOne({
      $or: [{ googleId: input.googleId }, { email: normalizedEmail }]
    });

    if (!user) {
      createdNewUser = true;
      const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);
      user = await UserModel.create({
        name: input.name,
        email: normalizedEmail,
        passwordHash,
        authProvider: "google",
        googleId: input.googleId,
        avatarUrl: input.avatarUrl,
        targetRole: "Software Engineer",
        candidateProfileCompleted: false,
        memorySpace: {
          interviewHistoryIds: [],
          aiInsights: ["Welcome to your interview coaching memory space."]
        }
      });
    } else {
      user.name = input.name || user.name;
      user.googleId = input.googleId;
      user.avatarUrl = input.avatarUrl ?? user.avatarUrl;
      if (user.authProvider !== "google") {
        user.authProvider = "google";
      }
      await user.save();
    }

    const session = await this.createSession(
      { id: user.id, email: user.email },
      { userAgent: `${metadata.deviceLabel} | ${metadata.userAgent}`, ipAddress: metadata.ipAddress },
    );

    return {
      token: session.token,
      user: {
        ...this.sanitizeUser(user),
        requiresCandidateOnboarding: createdNewUser
      },
      sessionId: session.sessionId
    };
  }

  async signup(
    input: {
      name: string;
      email: string;
      password: string;
      targetRole: string;
    },
    metadata: { deviceLabel: string; userAgent: string; ipAddress: string },
  ) {
    const existingUser = await UserModel.findOne({ email: input.email.toLowerCase() });

    if (existingUser) {
      throw new ApiError(409, "An account already exists for this email");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await UserModel.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      targetRole: input.targetRole,
      candidateProfileCompleted: false,
      memorySpace: {
        interviewHistoryIds: [],
        aiInsights: ["Welcome to your interview coaching memory space."]
      }
    });

    const session = await this.createSession(
      { id: user.id, email: user.email },
      { userAgent: `${metadata.deviceLabel} | ${metadata.userAgent}`, ipAddress: metadata.ipAddress },
    );

    return {
      token: session.token,
      user: {
        ...this.sanitizeUser(user),
        requiresCandidateOnboarding: true
      },
      sessionId: session.sessionId
    };
  }

  async login(
    input: { email: string; password: string },
    metadata: { deviceLabel: string; userAgent: string; ipAddress: string },
  ) {
    const user = await UserModel.findOne({ email: input.email.toLowerCase() });

    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    const session = await this.createSession(
      { id: user.id, email: user.email },
      { userAgent: `${metadata.deviceLabel} | ${metadata.userAgent}`, ipAddress: metadata.ipAddress },
    );

    return { token: session.token, user: this.sanitizeUser(user), sessionId: session.sessionId };
  }

  async me(userId: string) {
    const user = await UserModel.findById(userId).select("-passwordHash");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }

  async updateProfile(
    userId: string,
    input: {
      name?: string;
      targetRole?: string;
      preferredCategories?: string[];
      targetCompanies?: string[];
      candidateDetails?: CandidateDetailsInput;
    },
  ) {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      {
        ...(input.name ? { name: input.name } : {}),
        ...(input.targetRole ? { targetRole: input.targetRole } : {}),
        ...(input.candidateDetails
          ? {
              candidateDetails: input.candidateDetails,
              candidateProfileCompleted: true
            }
          : {}),
        preferences: {
          preferredCategories: input.preferredCategories ?? ["technical"],
          targetCompanies: input.targetCompanies ?? []
        }
      },
      { new: true },
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return this.sanitizeUser(user);
  }

  async listSessions(userId: string, currentSessionId: string) {
    const sessions = await AuthSessionModel.find({ userId, revokedAt: null }).sort({ lastActiveAt: -1 }).lean();

    return sessions.map((session) => ({
      id: String(session._id),
      tokenId: session.tokenId,
      deviceLabel: session.deviceLabel,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      lastActiveAt: session.lastActiveAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
      current: session.tokenId === currentSessionId
    }));
  }

  async revokeSession(userId: string, currentSessionId: string, sessionId: string) {
    const session = await AuthSessionModel.findOne({
      _id: sessionId,
      userId,
      revokedAt: null
    });

    if (!session) {
      throw new ApiError(404, "Session not found");
    }

    if (session.tokenId === currentSessionId) {
      throw new ApiError(400, "Use logout to end the current session");
    }

    session.revokedAt = new Date();
    await session.save();

    return { success: true };
  }

  async logoutCurrentSession(userId: string, currentSessionId: string) {
    await AuthSessionModel.findOneAndUpdate(
      { userId, tokenId: currentSessionId, revokedAt: null },
      { revokedAt: new Date() },
    );

    return { success: true };
  }

  async changePassword(userId: string, input: { currentPassword: string; newPassword: string }) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);

    if (!isValid) {
      throw new ApiError(401, "Current password is incorrect");
    }

    user.passwordHash = await bcrypt.hash(input.newPassword, 10);
    user.passwordChangedAt = new Date();
    await user.save();

    return { success: true };
  }

  async changeEmail(userId: string, input: { currentPassword: string; newEmail: string }) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const existingUser = await UserModel.findOne({ email: input.newEmail.toLowerCase(), _id: { $ne: userId } });
    if (existingUser) {
      throw new ApiError(409, "An account already exists for this email");
    }

    const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);

    if (!isValid) {
      throw new ApiError(401, "Current password is incorrect");
    }

    user.email = input.newEmail.toLowerCase();
    user.emailChangedAt = new Date();
    await user.save();

    return this.sanitizeUser(user);
  }
}
