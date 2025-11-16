import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  console.log('[Auth] 🔍 Checking authentication...');
  console.log('[Auth] 🔍 Session ID:', req.sessionID);
  console.log('[Auth] 🔍 Session data:', JSON.stringify(req.session));
  console.log('[Auth] 🔍 Cookies:', req.headers.cookie);
  console.log('[Auth] 🔍 User ID from session:', req.session?.userId);
  
  if (req.session && req.session.userId) {
    console.log('[Auth] ✅ Authenticated as user:', req.session.userId);
    return next();
  }
  
  console.log('[Auth] ❌ No userId in session - Unauthorized');
  return res.status(401).json({ message: "Unauthorized" });
}

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}
