import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { db } from "./db.js";
import { chat, message } from "../db/schema.js";

interface ClientMeta {
  chatId?: string;
  role?: "user" | "agent";
  isAlive: boolean;
}

const clientMetadata = new WeakMap<WebSocket, ClientMeta>();
const rooms = new Map<string, Set<WebSocket>>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      const meta = clientMetadata.get(ws);
      if (!meta || !meta.isAlive) {
        return ws.terminate();
      }
      meta.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(heartbeat);
  });

  wss.on("connection", (ws: WebSocket) => {
    clientMetadata.set(ws, { isAlive: true });

    ws.on("pong", () => {
      const meta = clientMetadata.get(ws);
      if (meta) meta.isAlive = true;
    });

    ws.on("message", async (data: Buffer | string) => {
      try {
        const payload = JSON.parse(data.toString());
        await handleMessage(ws, payload);
      } catch (err: any) {
        sendError(ws, err.message || "Invalid payload");
      }
    });

    ws.on("close", async () => {
      await handleDisconnect(ws);
    });

    ws.on("error", (err) => {
      console.error("[WebSocket error]:", err);
    });
  });

  return wss;
}

function sendJson(ws: WebSocket, data: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function sendError(ws: WebSocket, error: string) {
  sendJson(ws, { type: "error", error });
}

function broadcastToRoom(chatId: string, data: any, excludeWs?: WebSocket) {
  const room = rooms.get(chatId);
  if (!room) return;
  for (const client of room) {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }
}

async function handleMessage(ws: WebSocket, payload: any) {
  const meta = clientMetadata.get(ws) || { isAlive: true };

  switch (payload.type) {
    case "join": {
      const { chatId, role } = payload;
      if (!chatId || (role !== "user" && role !== "agent")) {
        return sendError(ws, "Invalid join parameters");
      }

      // Check DB chat status
      const existingChat = await db.query.chat.findFirst({
        where: eq(chat.id, chatId),
      });

      if (!existingChat) {
        return sendError(ws, "Chat not found");
      }

      if (existingChat.status !== "escalated") {
        return sendError(ws, "Chat is not escalated");
      }

      // Join room
      if (!rooms.has(chatId)) {
        rooms.set(chatId, new Set());
      }
      rooms.get(chatId)!.add(ws);
      meta.chatId = chatId;
      meta.role = role;
      clientMetadata.set(ws, meta);

      sendJson(ws, { type: "joined", chatId, role });

      if (role === "agent") {
        broadcastToRoom(chatId, { type: "agent_joined", chatId }, ws);
      }
      break;
    }

    case "leave": {
      const { chatId } = payload;
      await handleLeave(ws, chatId);
      break;
    }

    case "typing": {
      const { chatId, role, isTyping } = payload;
      if (!chatId || !meta.chatId || meta.chatId !== chatId) return;
      broadcastToRoom(chatId, { type: "typing", chatId, role, isTyping }, ws);
      break;
    }

    case "message": {
      const { chatId, text, role } = payload;
      if (!chatId || !text || !meta.chatId || meta.chatId !== chatId) {
        return sendError(ws, "Not joined to this chat");
      }

      // Verify chat is still escalated
      const activeChat = await db.query.chat.findFirst({
        where: eq(chat.id, chatId),
      });

      if (!activeChat || activeChat.status !== "escalated") {
        return sendError(ws, "Chat is not escalated");
      }

      const msgRole = role === "agent" ? "human" : "user";
      const newMsgId = uuidv4();
      const parts = [{ type: "text", text }];
      const now = new Date();

      await db.insert(message).values({
        id: newMsgId,
        chatId,
        role: msgRole,
        parts,
        createdAt: now,
      });

      // Broadcast to room including sender
      const outboundMessage = {
        type: "message",
        chatId,
        message: {
          id: newMsgId,
          chatId,
          role: msgRole,
          parts,
          createdAt: now.toISOString(),
        },
      };

      broadcastToRoom(chatId, outboundMessage);
      break;
    }

    default:
      sendError(ws, `Unknown message type: ${payload.type}`);
  }
}

async function handleLeave(ws: WebSocket, chatId?: string) {
  const meta = clientMetadata.get(ws);
  const targetChatId = chatId || meta?.chatId;
  if (!targetChatId) return;

  const room = rooms.get(targetChatId);
  if (room) {
    room.delete(ws);
    if (room.size === 0) {
      rooms.delete(targetChatId);
    }
  }

  sendJson(ws, { type: "left", chatId: targetChatId });

  if (meta?.role === "agent") {
    // Check if another agent is still in the room
    let remainingAgents = 0;
    if (room) {
      for (const client of room) {
        if (clientMetadata.get(client)?.role === "agent") {
          remainingAgents++;
        }
      }
    }

    if (remainingAgents === 0) {
      await db
        .update(chat)
        .set({ status: "unresolved", updatedAt: new Date() })
        .where(eq(chat.id, targetChatId));

      broadcastToRoom(targetChatId, { type: "agent_left", chatId: targetChatId });
    }
  }

  if (meta) {
    meta.chatId = undefined;
    meta.role = undefined;
  }
}

async function handleDisconnect(ws: WebSocket) {
  await handleLeave(ws);
}
