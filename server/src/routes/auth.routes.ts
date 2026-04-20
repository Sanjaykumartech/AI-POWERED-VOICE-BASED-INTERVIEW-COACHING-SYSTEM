import { Router } from "express";

import {
  changeEmailController,
  changePasswordController,
  googleAuthCallbackController,
  googleAuthStartController,
  loginController,
  logoutController,
  meController,
  revokeSessionController,
  sessionsController,
  signupController,
  updateProfileController
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/signup", signupController);
authRouter.post("/login", loginController);
authRouter.get("/google", googleAuthStartController);
authRouter.get("/google/callback", googleAuthCallbackController);
authRouter.get("/me", authenticate, meController);
authRouter.patch("/profile", authenticate, updateProfileController);
authRouter.get("/sessions", authenticate, sessionsController);
authRouter.delete("/sessions/:sessionId", authenticate, revokeSessionController);
authRouter.post("/logout", authenticate, logoutController);
authRouter.post("/change-password", authenticate, changePasswordController);
authRouter.post("/change-email", authenticate, changeEmailController);
