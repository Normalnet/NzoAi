import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChatPreview, type ChatbotConfig } from "../../components/chat/chat-preview";
import { useChatWebSocket } from "../../hooks/use-chat-websocket";
import { v4 as uuidv4 } from "uuid";

export const Route = createFileRoute("/bubble/$widgetId")({
  component: BubbleWidgetPage,
});

function BubbleWidgetPage() {
  const { widgetId } = Route.useParams();
  const [botConfig, setBotConfig] = useState<ChatbotConfig | null>(null);
  const [chatId, setChatId] = useState(uuidv4());
  const [messages, setMessages] = useState<any[]>([]);
  const [status, setStatus] = useState("ready"); // 'ready' | 'submitted' | 'streaming'
  const [chatStatus, setChatStatus] = useState("unresolved");

  useEffect(() => {
    fetch(`/api/embed/chatbot/${widgetId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setBotConfig(data);
          // Broadcast color to embed.js parent button
          window.parent.postMessage(
            { type: "nzoai:set-color", color: data.primaryColor },
            "*"
          );
        }
      });
  }, [widgetId]);

  // WebSocket for escalated chats
  const isEscalated = chatStatus === "escalated";
  const { sendMessage: sendWsMessage, isTyping } = useChatWebSocket({
    chatId,
    role: "user",
    enabled: isEscalated,
    onMessageReceived: (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    },
    onStatusChange: (newStatus) => {
      setChatStatus(newStatus);
    },
  });

  const handleSendMessage = async (text: string) => {
    const userMsg = { id: uuidv4(), role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    if (isEscalated) {
      sendWsMessage(text);
      return;
    }

    setStatus("submitted");
    try {
      const res = await fetch(`/api/embed/chat/${widgetId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: chatId, messages: newMessages }),
      });

      if (!res.ok) throw new Error("Request failed");

      // Check if escalated response
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        if (json.message) {
          setChatStatus("escalated");
          setMessages([
            ...newMessages,
            { id: uuidv4(), role: "assistant", content: json.message },
          ]);
        }
        setStatus("ready");
        return;
      }

      setStatus("streaming");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      const assistantId = uuidv4();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith('0:"')) {
              try {
                const textPart = JSON.parse(line.slice(2));
                assistantText += textPart;
              } catch (e) {}
            }
          }
          setMessages([
            ...newMessages,
            { id: assistantId, role: "assistant", content: assistantText },
          ]);
        }
      }
      setStatus("ready");
    } catch (err) {
      console.error(err);
      setStatus("ready");
    }
  };

  const handleClose = () => {
    window.parent.postMessage({ type: "nzoai-widget-toggle" }, "*");
  };

  const handleReset = () => {
    setChatId(uuidv4());
    setMessages([]);
    setChatStatus("unresolved");
  };

  if (!botConfig) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-xs text-muted-foreground">
        Loading support assistant...
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden p-0 bg-background font-sans">
      <ChatPreview
        chatbot={{ ...botConfig, embedToken: widgetId }}
        messages={messages}
        status={status}
        chatStatus={chatStatus}
        isTyping={isTyping}
        onSendMessage={handleSendMessage}
        onClose={handleClose}
        onReset={handleReset}
      />
    </div>
  );
}
