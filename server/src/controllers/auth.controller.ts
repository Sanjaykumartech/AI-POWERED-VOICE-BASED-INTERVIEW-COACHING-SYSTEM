import { z } from "zod";

import { env } from "../config/env.js";
import { AuthService } from "../services/auth.service.js";
import { getClientIp, getDeviceLabel } from "../utils/request-meta.js";
import { asyncHandler } from "../utils/async-handler.js";

const candidateDetailsSchema = z.object({
  educationQualification: z.string().min(2),
  institution: z.string().optional(),
  fieldOfStudy: z.string().min(2),
  stream: z.string().optional(),
  department: z.string().optional(),
  skills: z.array(z.string().min(1)).min(1),
  workExperience: z.string().optional(),
  internshipRole: z.string().optional(),
  experienceDuration: z.string().optional(),
  preparingFor: z.string().min(2)
});

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  targetRole: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  targetRole: z.string().min(2).optional(),
  preferredCategories: z.array(z.string()).optional(),
  targetCompanies: z.array(z.string()).optional(),
  candidateDetails: candidateDetailsSchema.optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8)
});

const changeEmailSchema = z.object({
  currentPassword: z.string().min(8),
  newEmail: z.string().email()
});

const authService = new AuthService();

const getRequestMetadata = (request: Parameters<typeof signupController>[0]) => {
  const userAgent = request.headers["user-agent"] ?? "Unknown user agent";
  return {
    userAgent,
    deviceLabel: getDeviceLabel(userAgent),
    ipAddress: getClientIp(request)
  };
};

export const signupController = asyncHandler(async (request, response) => {
  const input = signupSchema.parse(request.body);
  const result = await authService.signup(input, getRequestMetadata(request));

  response.status(201).json({
    token: result.token,
    user: result.user
  });
});

export const loginController = asyncHandler(async (request, response) => {
  const input = loginSchema.parse(request.body);
  const result = await authService.login(input, getRequestMetadata(request));

  response.json({
    token: result.token,
    user: result.user
  });
});

export const meController = asyncHandler(async (request, response) => {
  const user = await authService.me(request.user!.userId);
  response.json({ user });
});

export const updateProfileController = asyncHandler(async (request, response) => {
  const input = updateProfileSchema.parse(request.body);
  const user = await authService.updateProfile(request.user!.userId, input);
  response.json({ user });
});

export const sessionsController = asyncHandler(async (request, response) => {
  const sessions = await authService.listSessions(request.user!.userId, request.user!.sessionId);
  response.json({ sessions });
});

export const revokeSessionController = asyncHandler(async (request, response) => {
  const result = await authService.revokeSession(
    request.user!.userId,
    request.user!.sessionId,
    String(request.params.sessionId),
  );
  response.json(result);
});

export const logoutController = asyncHandler(async (request, response) => {
  const result = await authService.logoutCurrentSession(request.user!.userId, request.user!.sessionId);
  response.json(result);
});

export const changePasswordController = asyncHandler(async (request, response) => {
  const input = changePasswordSchema.parse(request.body);
  const result = await authService.changePassword(request.user!.userId, input);
  response.json(result);
});

export const changeEmailController = asyncHandler(async (request, response) => {
  const input = changeEmailSchema.parse(request.body);
  const user = await authService.changeEmail(request.user!.userId, input);
  response.json({ user });
});

export const googleAuthStartController = asyncHandler(async (_request, response) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CALLBACK_URL) {
    response.status(500).json({ message: "Google OAuth is not configured" });
    return;
  }

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account"
  });

  response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

export const googleAuthCallbackController = asyncHandler(async (request, response) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
    response.status(500).json({ message: "Google OAuth is not configured" });
    return;
  }

  const code = String(request.query.code ?? "");
  if (!code) {
    response.redirect(`${env.FRONTEND_URL ?? env.APP_URL}/login?oauthError=missing_code`);
    return;
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      grant_type: "authorization_code"
    })
  });

  const tokenPayload = (await tokenResponse.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!tokenResponse.ok) {
    console.error("[Google OAuth] token exchange failed", tokenPayload);
    response.redirect(`${env.FRONTEND_URL ?? env.APP_URL}/login?oauthError=token_exchange_failed`);
    return;
  }

  if (!tokenPayload.access_token) {
    response.redirect(`${env.FRONTEND_URL ?? env.APP_URL}/login?oauthError=no_access_token`);
    return;
  }

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`
    }
  });

  if (!profileResponse.ok) {
    console.error("[Google OAuth] profile fetch failed", await profileResponse.text());
    response.redirect(`${env.FRONTEND_URL ?? env.APP_URL}/login?oauthError=profile_fetch_failed`);
    return;
  }

  const profile = (await profileResponse.json()) as {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
  };

  if (!profile.id || !profile.email || !profile.name) {
    console.error("[Google OAuth] incomplete profile", profile);
    response.redirect(`${env.FRONTEND_URL ?? env.APP_URL}/login?oauthError=incomplete_profile`);
    return;
  }

  const result = await authService.loginWithGoogle(
    {
      googleId: profile.id,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture
    },
    getRequestMetadata(request),
  );

  const user = encodeURIComponent(JSON.stringify(result.user));
  response.redirect(
    `${env.FRONTEND_URL ?? env.APP_URL}/oauth/callback?token=${encodeURIComponent(result.token)}&user=${user}`,
  );
});
