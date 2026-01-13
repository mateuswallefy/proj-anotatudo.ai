import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  // CRÍTICO: Validar parâmetros antes de usar bcrypt
  if (!password || typeof password !== 'string' || password.length === 0) {
    throw new Error("Password inválido ou vazio");
  }
  
  if (!hash || typeof hash !== 'string' || hash.length === 0) {
    throw new Error("Hash inválido ou vazio");
  }
  
  // Validar formato do hash (bcrypt hash começa com $2a$, $2b$ ou $2y$)
  if (!hash.startsWith('$2')) {
    throw new Error("Hash não está no formato bcrypt válido");
  }
  
  try {
    return await bcrypt.compare(password, hash);
  } catch (error: any) {
    console.error("[comparePassword] Erro ao comparar senha:", error.message);
    throw new Error(`Erro ao verificar senha: ${error.message}`);
  }
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const isDev = process.env.NODE_ENV === 'development';
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:31',message:'isAuthenticated middleware entry',data:{hasSession:!!req.session,hasUserId:!!(req.session?.userId),userId:req.session?.userId||null,sessionId:req.sessionID||null,path:req.path,method:req.method,hasCookies:!!req.headers.cookie},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  
  console.log('[AUTH] Middleware isAuthenticated called');
  console.log('[AUTH] Session exists:', !!req.session);
  console.log('[AUTH] Session userId:', req.session?.userId || 'undefined');
  console.log('[AUTH] Session ID:', req.sessionID || 'undefined');
  console.log('[AUTH] Request path:', req.path);
  console.log('[AUTH] Request method:', req.method);
  console.log('[AUTH] Request cookies:', req.headers.cookie || 'none');
  
  try {
    if (req.session && req.session.userId) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:45',message:'User authenticated - calling next',data:{userId:req.session.userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      console.log('[AUTH] ✅ User authenticated, userId:', req.session.userId);
      return next();
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:54',message:'User not authenticated - returning 401',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    console.log('[AUTH] ❌ User not authenticated - returning 401');
    return res.status(401).json({ message: "Unauthorized" });
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:60',message:'Error in isAuthenticated middleware',data:{errorMessage:error?.message,errorName:error?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    console.error('[AUTH] ❌ Error in isAuthenticated middleware:', error);
    return res.status(500).json({ message: "Internal server error", error: isDev ? error.message : undefined });
  }
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
