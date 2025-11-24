import express, { type Request, Response, NextFunction } from "express";
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

(async () => {
  await seedAdmin();
  await ensureAdminRootExists();
  await ensureWebhookEventsTable();

  const server = await registerRoutes(app);

  // Use process.env.NODE_ENV directly for reliable environment detection
  // Default to production if NODE_ENV is not set (production should always have it set)
  const isDevelopment = process.env.NODE_ENV === "development";
  
  if (isDevelopment) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Development mode: always use port 3000 (that's what .replit workflow expects)
  // Production: use PORT env var or default 3000
  const port = isDevelopment ? 3000 : parseInt(process.env.PORT || "3000", 10);

  // If developing, kill any standalone Vite on 5173 (from concurrently npm:dev:vite)
  // setupVite already integrates Vite middleware, so standalone Vite is redundant
  if (isDevelopment) {
    try {
      spawnSync("pkill", ["-f", "vite.*5173"], { stdio: "ignore" });
      log("Killed redundant Vite standalone server (Vite is integrated in Express)", "SERVER");
    } catch (e) {
      // Ignore errors
    }
  }

  server.listen(port, "0.0.0.0", () => {
    log(`✅ Server started successfully on port ${port}`, "SERVER");
    log(`Environment: ${isDevelopment ? "development" : "production"}`, "SERVER");
    log(`Vite: ${isDevelopment ? "integrated in Express (frontend+backend on same port)" : "static files only"}`, "SERVER");
    log(`Public endpoint: http://localhost:${port}/api/user-status`, "SERVER");
  });
})();
