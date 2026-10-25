import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { setupWebSocket } from "./lib/websocket.js";

const app = express();
const port = process.env.PORT || 3000;
const corsOrigin = process.env.CORS_ORIGIN || "*";

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("NzoAI Realtime Server running");
});

app.get("/ws/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "server", timestamp: new Date().toISOString() });
});

app.post("/api/escalations/notify", (req, res) => {
  const { chatId, reason, summary } = req.body || {};
  console.log(`[server] Received escalation notification for chat ${chatId}: ${reason}`);
  res.json({ received: true, chatId, summary });
});

const server = createServer(app);
setupWebSocket(server);

server.listen(port, () => {
  console.log(`[server] NzoAI WebSocket server listening on port ${port} (ws://localhost:${port}/ws)`);
});
