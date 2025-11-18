import session from "express-session";
import connectPg from "connect-pg-simple";

export function getSession() {
  const sessionTtl = 30 * 24 * 60 * 60 * 1000; // 30 days
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  // In production, only use secure cookies if we're actually on HTTPS
  // Replit may not always use HTTPS, so we check the environment
  const isSecure = process.env.NODE_ENV === 'production' && 
                   (process.env.FORCE_SECURE_COOKIES === 'true' || 
                    process.env.REPL_SLUG !== undefined);
  
  console.log('[SESSION] Configuring session middleware');
  console.log('[SESSION] NODE_ENV:', process.env.NODE_ENV);
  console.log('[SESSION] Secure cookies:', isSecure);
  console.log('[SESSION] Session store:', sessionStore ? 'PostgreSQL' : 'none');
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isSecure, // Only secure in production with HTTPS
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}
