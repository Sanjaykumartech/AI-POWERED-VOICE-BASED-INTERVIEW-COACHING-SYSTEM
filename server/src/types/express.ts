import type { JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequestUser extends JwtPayload {
  userId: string;
  email: string;
  sessionId: string;
}
