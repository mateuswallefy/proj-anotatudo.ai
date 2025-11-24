import express, { type Express } from "express";
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

// CRITICAL: Quick startup minimal endpoints
app.get("/_health", (req, res) => {
  res.status(200).json({ ok: true });
});

// Register routes asynchronously WITHOUT blocking port listen
const port = 3000;

// Set up server first, THEN listen
registerRoutes(app).then((server) => {
  serveStatic(app);
  
  // NOW listen - this should be very fast
  server.listen(port, "0.0.0.0", () => {
    console.log(`ready`);
    console.log(`Listening on port ${port}`);
  });
  
  // Run bg tasks
  Promise.allSettled([
    seedAdmin(),
    ensureAdminRootExists(),
    ensureWebhookEventsTable(),
  ]);
  
  // Kill Vite
  setTimeout(() => {
    try {
      spawnSync("pkill", ["-f", "vite.*5173"], { stdio: "ignore" });
    } catch (e) {}
  }, 500);
}).catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});

export default app;
