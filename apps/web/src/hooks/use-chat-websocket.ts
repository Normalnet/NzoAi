import { useEffect, useRef, useState, useCallback } from "react";

interface UseChatWebSocketOptions {
  chatId: string;
  role: "user" | "agent";
  enabled?: boolean;
  onMessageReceived?: (message: any) => void;
  onStatusChange?: (status: string) => void;
}

export function useChatWebSocket({
  chatId,
  role,
  enabled = true,
  onMessageReceived,
  onStatusChange,
}: UseChatWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAgentOnline, setIsAgentOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const reconnectTimeoutRef = useRef<any>(null);

  const getWsUrl = useCallback(() => {
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocal) {
      return "ws://localhost:3000/ws";
    }
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws`;
  }, []);

  const connect = useCallback(() => {
    if (!chatId || !enabled) return;

    try {
      const url = getWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Join room
        ws.send(JSON.stringify({ type: "join", chatId, role }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case "joined":
              if (data.role === "agent") setIsAgentOnline(true);
              break;
            case "agent_joined":
              setIsAgentOnline(true);
              break;
            case "agent_left":
              setIsAgentOnline(false);
              onStatusChange?.("unresolved");
              break;
            case "typing":
              if (data.role !== role) {
                setIsTyping(Boolean(data.isTyping));
              }
              break;
            case "message":
              if (data.message) {
                onMessageReceived?.(data.message);
              }
              break;
            case "error":
              console.warn("[ws error]:", data.error);
              break;
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsAgentOnline(false);
        // Reconnect after 3 seconds
        if (enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = (err) => {
        console.warn("[ws socket warning]:", err);
      };
    } catch (e) {
      console.warn("[ws connect failed]:", e);
    }
  }, [chatId, role, enabled, getWsUrl, onMessageReceived, onStatusChange]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({ type: "leave", chatId }));
        wsRef.current.close();
      }
    };
  }, [connect, chatId]);

  const sendTextMessage = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "message", chatId, text, role }));
    }
  }, [chatId, role]);

  const sendTyping = useCallback((typingState: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "typing", chatId, role, isTyping: typingState }));
    }
  }, [chatId, role]);

  return {
    isConnected,
    isAgentOnline,
    isTyping,
    sendMessage: sendTextMessage,
    sendTyping,
  };
}
