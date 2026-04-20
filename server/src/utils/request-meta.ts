import type { Request } from "express";

export const getClientIp = (request: Request) => {
  const forwarded = request.headers["x-forwarded-for"];

  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]!.trim();
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0]!.trim();
  }

  return request.socket.remoteAddress ?? "";
};

export const getDeviceLabel = (userAgent: string) => {
  const normalized = userAgent.toLowerCase();

  if (normalized.includes("edg")) {
    return "Microsoft Edge";
  }

  if (normalized.includes("chrome")) {
    return "Google Chrome";
  }

  if (normalized.includes("firefox")) {
    return "Mozilla Firefox";
  }

  if (normalized.includes("safari") && !normalized.includes("chrome")) {
    return "Safari";
  }

  return "Unknown device";
};
