import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { analyticsRouter } from "./routes/analytics.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { interviewRouter } from "./routes/interview.routes.js";

export const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/interviews", interviewRouter);

app.use(errorHandler);
