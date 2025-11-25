import express from "express";
import { createServer } from "http";
import { spawnSync } from "child_process";
import { registerRoutes } from "./routes.js";
import { serveStatic, log } from "./vite.js";
import { getSession } from "./session.js";
import { seedAdmin } from "./seedAdmin.js";
import { ensureAdminRootExists } from "./adminRootProtection.js";
import { ensureWebhookEventsTable } from "./ensureWebhookEventsTable.js";
import { storage } from "./storage.js";

const app = express();

// Webhook endpoint - no auth
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

// Health endpoints
app.get("/_health", (req, res) => res.status(200).json({ ok: true }));
app.get("/health", (req, res) => res.status(200).json({ ok: true }));

// Server startup - Port 5000 (maps to external port 80 via Autoscale)
const port = parseInt(process.env.PORT || '5000');
const httpServer = createServer(app);

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`ready`);
  console.log(`✅ Server listening on http://0.0.0.0:${port}`);
  initializeAsync();
});

// Async initialization in background
async function initializeAsync() {
  try {
    await registerRoutes(app);
    serveStatic(app);
    
    await Promise.allSettled([
      seedAdmin(),
      ensureAdminRootExists(),
      ensureWebhookEventsTable(),
    ]);
    
    log("✅ Initialization complete", "SERVER");
    
    setTimeout(() => {
      try {
        spawnSync("pkill", ["-f", "vite.*5173"], { stdio: "ignore" });
      } catch (e) {}
    }, 1000);
  } catch (error) {
    console.error("Init error:", error);
  }
}

export default httpServer;
