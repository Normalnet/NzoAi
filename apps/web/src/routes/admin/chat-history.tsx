import React, { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Inbox,
  UserCheck,
  CheckCircle,
  Clock,
  Send,
  User,
  Bot,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { PreviewMessage } from "../../components/chat/preview-message";
import { TypingIndicator } from "../../components/chat/typing-indicator";
import { useChatWebSocket } from "../../hooks/use-chat-websocket";

export const Route = createFileRoute("/admin/chat-history")({
  component: ChatHistoryPage,
});

function ChatHistoryPage() {
  const [chats, setChats] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatbot, setChatbot] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadBot = () => {
    fetch("/api/my-chatbot")
      .then((r) => r.ok && r.json())
      .then((d) => d && setChatbot(d.chatbot));
  };

  const loadChats = () => {
    fetch(`/api/chat/history?status=${statusFilter}&limit=50`)
      .then((r) => r.ok && r.json())
      .then((d) => {
        if (d?.chats) {
          setChats(d.chats);
          if (!selectedChat && d.chats.length > 0) {
            setSelectedChat(d.chats[0]);
          }
        }
      });
  };

  useEffect(() => {
    loadBot();
  }, []);

  useEffect(() => {
    loadChats();
  }, [statusFilter]);

  // Load transcript when selected chat changes
  useEffect(() => {
    if (!selectedChat?.id) return;
    // We can fetch votes / messages for the chat
    fetch(`/api/chat/history?status=all&limit=100`)
      .then((r) => r.ok && r.json())
      .then(() => {
        // Mock / load messages for selected chat
        setChatMessages([]);
      });
  }, [selectedChat?.id]);

  // WebSocket connection for real-time escalation reply
  const isEscalated = selectedChat?.status === "escalated";
  const { isConnected, isTyping, sendMessage: sendWsMessage, sendTyping } = useChatWebSocket({
    chatId: selectedChat?.id || "",
    role: "agent",
    enabled: isEscalated,
    onMessageReceived: (newMsg) => {
      setChatMessages((prev) => [...prev, newMsg]);
    },
    onStatusChange: (newStatus) => {
      if (selectedChat) {
        setSelectedChat({ ...selectedChat, status: newStatus });
      }
    },
  });

  const handleUpdateStatus = async (status: string) => {
    if (!selectedChat?.id) return;
    try {
      await fetch("/api/update-chat-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: selectedChat.id, status }),
      });
      setSelectedChat({ ...selectedChat, status });
      loadChats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChat?.id) return;

    if (isEscalated) {
      sendWsMessage(replyText.trim());
    }
    setReplyText("");
  };

  const primaryColor = chatbot?.primaryColor || "#800020";

  return (
    <div className="p-6 h-full flex flex-col max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Conversation Inbox</h1>
          <p className="text-sm text-muted-foreground">
            Monitor customer conversations, resolve inquiries, and take over live escalated chats.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg border text-xs">
          {["all", "unresolved", "escalated", "resolved"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md capitalize font-medium transition-all ${
                statusFilter === s ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
        {/* Chats List Sidebar */}
        <div className="md:col-span-5 h-[650px] overflow-y-auto border rounded-2xl bg-card">
          <div className="p-3 border-b flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Conversations ({chats.length})</span>
            <button onClick={loadChats} className="p-1 hover:bg-muted rounded text-muted-foreground">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y">
            {chats.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">No conversations found.</div>
            ) : (
              chats.map((c) => {
                const isSelected = selectedChat?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedChat(c)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm truncate max-w-[200px]">
                        {c.title || "Visitor Session"}
                      </h4>
                      <Badge
                        variant={
                          c.status === "escalated"
                            ? "destructive"
                            : c.status === "resolved"
                            ? "success"
                            : "secondary"
                        }
                        className="text-[10px] uppercase font-bold"
                      >
                        {c.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Channel: {c.channel}</span>
                      <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Chat Thread */}
        <div className="md:col-span-7 h-[650px] flex flex-col border rounded-2xl bg-card overflow-hidden">
          {selectedChat ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                <div>
                  <h3 className="font-semibold text-sm">{selectedChat.title || "Visitor Session"}</h3>
                  <p className="text-xs text-muted-foreground font-mono">ID: {selectedChat.id}</p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedChat.status !== "escalated" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5"
                      onClick={() => handleUpdateStatus("escalated")}
                    >
                      <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                      <span>Take Over</span>
                    </Button>
                  )}

                  {selectedChat.status !== "resolved" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5 text-emerald-600 dark:text-emerald-400"
                      onClick={() => handleUpdateStatus("resolved")}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleUpdateStatus("unresolved")}
                    >
                      Reopen
                    </Button>
                  )}
                </div>
              </div>

              {/* Status Banner */}
              {isEscalated && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between">
                  <span>Chat is Escalated. You are connected via WebSocket as human agent.</span>
                  <span className="font-bold">{isConnected ? "CONNECTED" : "CONNECTING..."}</span>
                </div>
              )}

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-muted-foreground">
                    Connected to thread. Live messages will appear here.
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <PreviewMessage
                      key={msg.id || i}
                      message={msg}
                      primaryColor={primaryColor}
                    />
                  ))
                )}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="p-3 border-t flex items-center gap-2 bg-background">
                <Input
                  placeholder={
                    isEscalated
                      ? "Reply directly as human support agent..."
                      : "Escalate conversation to reply as human agent"
                  }
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={!isEscalated}
                  className="flex-1 text-xs"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!replyText.trim() || !isEscalated}
                  className="text-white text-xs gap-1.5"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </Button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Select a conversation from the left to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
