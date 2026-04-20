import { Router } from "express";

import { dashboardController } from "../controllers/analytics.controller.js";
import { authenticate } from "../middleware/auth.js";

export const analyticsRouter = Router();

analyticsRouter.get("/dashboard", authenticate, dashboardController);

