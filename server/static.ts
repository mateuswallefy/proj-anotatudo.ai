import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");

/**
 * Logging utility (production-safe, no Vite dependency)
 */
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Serve static files from dist/public in production
 * This function has NO dependency on Vite - it only serves pre-built static files
 */
export function serveStatic(app: Express) {
  // Try multiple possible paths for dist/public
  const possiblePaths = [
    path.resolve(workspaceRoot, "dist", "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(__dirname, "..", "dist", "public"),
  ];

  let distPath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      distPath = possiblePath;
      break;
    }
  }

  if (!distPath) {
    throw new Error(
      `Could not find the build directory. Tried: ${possiblePaths.join(", ")}. Make sure to build the client first.`,
    );
  }

  log(`Serving static files from: ${distPath}`, "STATIC");

  // Serve static files
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  // BUT: exclude healthcheck and API routes (these are handled by Express routes)
  app.use("*", (req, res, next) => {
    // Don't serve static files for healthchecks or API routes
    // These routes are handled by Express route handlers defined earlier
    if (
      req.originalUrl === "/health" ||
      req.originalUrl.startsWith("/api") ||
      req.originalUrl.startsWith("/_health") ||
      req.originalUrl.startsWith("/_db-check")
    ) {
      return next(); // Let other routes handle these
    }
    
    // For all other routes (including "/" and "/admin/*"), serve index.html (SPA fallback)
    // This allows the React app to handle client-side routing
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

