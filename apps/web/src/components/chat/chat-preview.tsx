import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, RefreshCw, X, Sparkles } from "lucide-react";
import { PreviewMessage } from "./preview-message";
import { TypingIndicator } from "./typing-indicator";
import { AgentStatusBanner } from "./agent-status-banner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export interface ChatbotConfig {
  id?: string;
  name: string;
  image?: string | null;
  primaryColor?: string;
  theme?: string;
  hidePoweredBy?: boolean;
  initialMessage?: string;
  suggestedMessages?: string[];
  embedToken?: string;
  quickActions?: Array<{
    id: string;
    name: string;
    toolName: string;
    actionProperties?: any;
  }>;
}

interface ChatPreviewProps {
  chatbot: ChatbotConfig;
  messages: any[];
  status: string; // 'ready' | 'submitted' | 'streaming' | 'error'
  chatStatus?: string; // 'unresolved' | 'resolved' | 'escalated'
  isTyping?: boolean;
  onSendMessage: (text: string) => void;
  onReset?: () => void;
  onClose?: () => void;
}

export function ChatPreview({
  chatbot,
  messages,
  status,
  chatStatus = "unresolved",
  isTyping = false,
  onSendMessage,
  onReset,
  onClose,
}: ChatPreviewProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const primaryColor = chatbot.primaryColor || "#800020";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, status, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || status === "streaming" || status === "submitted") return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleSuggestionClick = (msg: string) => {
    if (status === "streaming" || status === "submitted") return;
    onSendMessage(msg);
  };

  return (
    <div className="flex flex-col h-full bg-background border rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between text-white shrink-0 shadow-xs"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-2.5">
          {chatbot.image ? (
            <img src={chatbot.image} alt={chatbot.name} className="w-8 h-8 rounded-full object-cover border border-white/20" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              <Bot className="w-4 h-4" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-sm leading-tight">{chatbot.name}</h3>
            <p className="text-[11px] text-white/80 leading-tight">AI Customer Support</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onReset && (
            <button
              onClick={onReset}
              title="Reset conversation"
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              title="Close chat"
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Agent status banner */}
      <AgentStatusBanner status={chatStatus} />

      {/* Scrollable messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Initial Bot Greeting */}
        {chatbot.initialMessage && messages.length === 0 && (
          <PreviewMessage
            message={{
              id: "initial-greeting",
              role: "assistant",
              content: chatbot.initialMessage,
            }}
            primaryColor={primaryColor}
            embedToken={chatbot.embedToken}
          />
        )}

        {/* Conversation messages */}
        {messages.map((msg) => (
          <PreviewMessage
            key={msg.id}
            message={msg}
            primaryColor={primaryColor}
            embedToken={chatbot.embedToken}
          />
        ))}

        {/* Loading / Typing indicator */}
        {(status === "submitted" || status === "streaming" || isTyping) && (
          <div className="flex items-center gap-2">
            <TypingIndicator />
          </div>
        )}

        {/* Suggested questions (shown at start) */}
        {messages.length === 0 && chatbot.suggestedMessages && chatbot.suggestedMessages.length > 0 && (
          <div className="pt-2 flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Suggested questions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {chatbot.suggestedMessages.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(sug)}
                  className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-full border transition-colors text-left"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Menu Actions */}
      {chatbot.quickActions && chatbot.quickActions.length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/30 flex items-center gap-1.5 overflow-x-auto">
          {chatbot.quickActions.map((qa) => (
            <button
              key={qa.id}
              onClick={() => handleSuggestionClick(qa.name)}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-background border hover:bg-muted shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              {qa.name}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="p-3 border-t bg-background flex items-center gap-2">
        <Input
          placeholder="Ask a question..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={status === "streaming" || status === "submitted"}
          className="flex-1 text-sm bg-muted/40 focus-visible:ring-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!inputText.trim() || status === "streaming" || status === "submitted"}
          className="text-white shrink-0 shadow-xs"
          style={{ backgroundColor: primaryColor }}
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>

      {/* Footer Branding */}
      {!chatbot.hidePoweredBy && (
        <div className="py-1.5 text-center bg-muted/20 border-t border-border/40">
          <a
            href="https://nzoai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-muted-foreground hover:text-foreground font-medium"
          >
            Powered by <span className="font-bold text-primary">NzoAI</span>
          </a>
        </div>
      )}
    </div>
  );
}
