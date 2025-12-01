import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import { nanoid } from "nanoid";

// Get __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  // Use vite.config.ts directly - Vite will load it
  const viteConfigPath = path.resolve(workspaceRoot, "vite.config.ts");
  
  // Verify config file exists
  if (!fs.existsSync(viteConfigPath)) {
    log(`⚠️  vite.config.ts not found at ${viteConfigPath}, using defaults`, "VITE");
  }

  const vite = await createViteServer({
    configFile: viteConfigPath,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
      },
    },
    server: serverOptions,
    appType: "custom",
    // Forçar recarregar módulos em desenvolvimento
    clearScreen: false,
    // Desabilitar cache em desenvolvimento
    optimizeDeps: {
      force: true,
    },
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Don't serve Vite HTML for healthchecks or API routes
    // These routes are handled by Express route handlers defined earlier
    if (
      url === "/health" ||
      url.startsWith("/api") ||
      url.startsWith("/_health") ||
      url.startsWith("/_db-check")
    ) {
      return next(); // Let other routes handle these
    }

    try {
      const clientTemplate = path.resolve(
        workspaceRoot,
        "client",
        "index.html",
      );

      // Verify file exists
      if (!fs.existsSync(clientTemplate)) {
        throw new Error(`index.html not found at: ${clientTemplate}`);
      }

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      if (process.env.NODE_ENV !== "production") {
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
      }
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

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
