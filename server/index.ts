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

// Add immediate health check endpoint
app.get("/_health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

// Create the HTTP server
const port = 3000;
const httpServer = createServer(app);

// Listen immediately on port 3000 - SYNCHRONOUS operation
httpServer.listen(port, "0.0.0.0", () => {
  // Signal Replit that port is ready - CRITICAL!
  process.stderr.write(`\n✅ Listening on http://0.0.0.0:${port}\n`);
  console.log(`✅ Ready on http://0.0.0.0:${port}`);
  console.error(`✅ Ready on http://0.0.0.0:${port}`);
  
  // Initialize async
  initializeServer();
});

// Async initialization
async function initializeServer() {
  try {
    await registerRoutes(app);
    serveStatic(app);
    
    await Promise.allSettled([
      seedAdmin(),
      ensureAdminRootExists(),
      ensureWebhookEventsTable(),
    ]);
    
    log("✅ Initialization complete", "SERVER");
    
    // Kill Vite standalone
    setTimeout(() => {
      try {
        spawnSync("pkill", ["-f", "vite.*5173"], { stdio: "ignore" });
      } catch (e) {}
    }, 1000);
  } catch (error) {
    log(`Error: ${error}`, "SERVER");
  }
}

export default httpServer;
