import express, { type Express } from "express";
import { createServer } from "http";
import { execSync, spawnSync } from "child_process";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { getSession } from "./session.js";
import { seedAdmin } from "./seedAdmin.js";
import { ensureAdminRootExists } from "./adminRootProtection.js";
import { ensureWebhookEventsTable } from "./ensureWebhookEventsTable.js";
import { storage } from "./storage.js";
import { processWebhook } from "./webhooks/webhookProcessor.js";

const app = express();

// WEBHOOK RECEIVER — no auth
app.post("/api/webhooks/subscriptions", express.json({ type: "*/*" }), async (req, res) => {
  try {
    await storage.createWebhookEvent({
      event: req.body?.event ?? "unknown",
      type: req.body?.event ?? "unknown",
      payload: req.body,
      status: "pending",
      processed: false,
    });

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: true });
  }
});

app.set("trust proxy", 1);
app.use(getSession());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add immediate health check endpoint (before any async operations)
app.get("/_health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

// CRITICAL FOR REPLIT: Create server and listen IMMEDIATELY
const port = 3000;
const httpServer = createServer(app);

// Open port IMMEDIATELY - this is SYNCHRONOUS
httpServer.listen(port, "0.0.0.0", () => {
  // Log in multiple formats for Replit port detection
  console.log("ready");
  console.log(`Listening on port ${port}`);
  console.log(`Server ready at http://0.0.0.0:${port}`);
  
  log(`✅ Server listening on port ${port}`, "SERVER");
  
  // NOW run all async initialization in background (non-blocking)
  initializeServer();
});

// Async initialization function (runs AFTER port is open)
async function initializeServer() {
  try {
    // Register all routes (this adds routes to the app)
    await registerRoutes(app);
    
    // Serve static files
    serveStatic(app);
    
    // Run database initialization in parallel
    await Promise.allSettled([
      seedAdmin(),
      ensureAdminRootExists(),
      ensureWebhookEventsTable(),
    ]);
    
    log("✅ All initialization complete", "SERVER");
    
    // Kill standalone Vite server if running
    setTimeout(() => {
      try {
        spawnSync("pkill", ["-f", "vite.*5173"], { stdio: "ignore" });
      } catch (e) {
        // Ignore errors
      }
    }, 1000);
  } catch (error) {
    log(`❌ Initialization error: ${error}`, "SERVER");
  }
}

export default httpServer;
