import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { ApiError } from "../utils/api-error.js";

export const errorHandler = (
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction,
) => {
  if (error instanceof ApiError) {
    return response.status(error.statusCode).json({ message: error.message });
  }

  if (error instanceof ZodError) {
    return response.status(400).json({
      message: "Invalid request payload",
      issues: error.flatten()
    });
  }

  return response.status(500).json({
    message: "Unexpected server error",
    details: process.env.NODE_ENV === "development" ? error.message : undefined
  });
};
