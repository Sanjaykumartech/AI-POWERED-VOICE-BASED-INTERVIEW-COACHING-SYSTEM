import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { AuthSessionModel } from "../models/AuthSession.js";
import { env } from "../config/env.js";
import type { AuthenticatedRequestUser } from "../types/express.js";
import { ApiError } from "../utils/api-error.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedRequestUser;
  }
}

export const authenticate = async (request: Request, _response: Response, next: NextFunction) => {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication required"));
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthenticatedRequestUser;
    const session = await AuthSessionModel.findOne({
      tokenId: payload.sessionId,
      userId: payload.userId,
      revokedAt: null
    });

    if (!session) {
      return next(new ApiError(401, "Session expired or revoked"));
    }

    const now = new Date();
    const idleTimeoutMs = env.SESSION_IDLE_TIMEOUT_MINUTES * 60 * 1000;
    const inactiveForMs = now.getTime() - session.lastActiveAt.getTime();

    if (inactiveForMs > idleTimeoutMs) {
      session.revokedAt = now;
      await session.save();
      return next(new ApiError(401, `Session expired after ${env.SESSION_IDLE_TIMEOUT_MINUTES} minutes of inactivity`));
    }

    session.lastActiveAt = now;
    await session.save();
    request.user = payload;
    return next();
  } catch {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};
