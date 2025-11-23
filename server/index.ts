import express, { type Request, Response, NextFunction } from "express";
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

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const isDev = process.env.NODE_ENV === "development" || app.get("env") === "development";
  const port = isDev ? 5000 : parseInt(process.env.PORT || "5000", 10);

  server.listen(port, "0.0.0.0", () => {
    log(`✅ Server started successfully on port ${port}`, "SERVER");
    log(`Environment: ${isDev ? "development" : "production"}`, "SERVER");
    log(`Public endpoint: http://localhost:${port}/api/user-status`, "SERVER");
  });
})();
