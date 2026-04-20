import type { NextFunction, Request, Response } from "express";

export const asyncHandler =
  (
    fn: (request: Request, response: Response, next: NextFunction) => Promise<void>,
  ) =>
  (request: Request, response: Response, next: NextFunction) => {
    void fn(request, response, next).catch(next);
  };

