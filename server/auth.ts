import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  console.log('[AUTH] Middleware isAuthenticated called');
  console.log('[AUTH] Session exists:', !!req.session);
  console.log('[AUTH] Session userId:', req.session?.userId || 'undefined');
  console.log('[AUTH] Session ID:', req.sessionID || 'undefined');
  console.log('[AUTH] Request path:', req.path);
  console.log('[AUTH] Request method:', req.method);
  
  if (req.session && req.session.userId) {
    console.log('[AUTH] ✅ User authenticated, userId:', req.session.userId);
    return next();
  }
  
  console.log('[AUTH] ❌ User not authenticated - returning 401');
  return res.status(401).json({ message: "Unauthorized" });
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // First check if authenticated
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Get user from database to check role
  const { storage } = await import("./storage.js");
  const user = await storage.getUser(req.session.userId);
  
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  return next();
}

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}
