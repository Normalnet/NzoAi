import React, { useState } from "react";
import { Bot, User, Check, Send, Star, ExternalLink, Calendar, Search, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

interface PreviewMessageProps {
  message: {
    id: string;
    role: "user" | "assistant" | "system" | "human" | string;
    content?: string;
    parts?: any[];
  };
  primaryColor?: string;
  embedToken?: string;
}

export function PreviewMessage({ message, primaryColor = "#800020", embedToken }: PreviewMessageProps) {
  const isUser = message.role === "user";
  const isHumanAgent = message.role === "human";

  // State for interactive forms
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", contact: "", message: "" });
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, message: "" });

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.contact) return;
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...leadForm, embedToken }),
      });
      setLeadSubmitted(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.message) return;
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...feedbackForm, embedToken }),
      });
      setFeedbackSubmitted(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Render parts or plain text
  const parts = message.parts || [];
  const textContent =
    message.content ||
    parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("\n");

  return (
    <div className={`flex gap-3 text-sm ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white shadow-sm font-semibold text-xs"
          style={{ backgroundColor: isHumanAgent ? "#d97706" : primaryColor }}
        >
          {isHumanAgent ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
      )}

      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Text bubble */}
        {textContent && (
          <div
            className={`px-4 py-2.5 rounded-2xl whitespace-pre-wrap ${
              isUser
                ? "text-white rounded-br-xs shadow-sm"
                : isHumanAgent
                ? "bg-amber-500/10 border border-amber-500/20 text-foreground rounded-bl-xs shadow-xs"
                : "bg-muted text-foreground rounded-bl-xs shadow-xs"
            }`}
            style={isUser ? { backgroundColor: primaryColor } : {}}
          >
            {textContent}
          </div>
        )}

        {/* Tool parts */}
        {parts.map((part, idx) => {
          // AI SDK Tool Invocation
          const invocation = part.toolInvocation;
          const toolName = invocation?.toolName || part.type?.replace("tool-", "");
          const result = invocation?.result || part.result;

          if (toolName === "knowledge_base" && result) {
            return (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border">
                <Search className="w-3.5 h-3.5 text-primary" />
                <span>Referenced {result.count || result.results?.length || 1} knowledge base sources</span>
              </div>
            );
          }

          if (toolName === "escalate_to_human") {
            return (
              <div key={idx} className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl w-full text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>Escalated to Human Support</span>
                </div>
                <p className="text-muted-foreground">
                  Our team has been alerted. An agent will connect to this session momentarily.
                </p>
              </div>
            );
          }

          if (toolName === "custom_button") {
            const btnData = result || invocation?.args || {};
            return (
              <div key={idx} className="pt-1">
                <a
                  href={btnData.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium text-xs shadow-sm hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>{btnData.label || "Learn More"}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            );
          }

          if (toolName === "cal_booking" || toolName === "calendly_booking") {
            const bookData = result || invocation?.args || {};
            return (
              <div key={idx} className="bg-card border p-3.5 rounded-xl w-full space-y-2">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{bookData.title || "Schedule a Meeting"}</span>
                </div>
                <a
                  href={bookData.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2 rounded-lg text-white text-xs font-medium shadow-sm hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>Open Appointment Calendar</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            );
          }

          if (toolName === "collect_leads") {
            if (leadSubmitted) {
              return (
                <div key={idx} className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Thank you! Your information has been received.</span>
                </div>
              );
            }
            return (
              <form key={idx} onSubmit={handleLeadSubmit} className="bg-card border p-3.5 rounded-xl w-full space-y-2.5">
                <p className="font-medium text-foreground text-xs">Let us contact you</p>
                <Input
                  placeholder="Your Name"
                  className="h-8 text-xs"
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                  required
                />
                <Input
                  placeholder="Email or Phone Number"
                  className="h-8 text-xs"
                  value={leadForm.contact}
                  onChange={(e) => setLeadForm({ ...leadForm, contact: e.target.value })}
                  required
                />
                <Textarea
                  placeholder="How can we help? (optional)"
                  className="min-h-[50px] text-xs resize-none"
                  value={leadForm.message}
                  onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                />
                <Button type="submit" size="sm" className="w-full text-xs text-white" style={{ backgroundColor: primaryColor }}>
                  Submit Details
                </Button>
              </form>
            );
          }

          if (toolName === "collect_feedback") {
            if (feedbackSubmitted) {
              return (
                <div key={idx} className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Thank you for your feedback!</span>
                </div>
              );
            }
            return (
              <form key={idx} onSubmit={handleFeedbackSubmit} className="bg-card border p-3.5 rounded-xl w-full space-y-2.5">
                <p className="font-medium text-foreground text-xs">How was your experience?</p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= feedbackForm.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="Your comments or feedback..."
                  className="h-8 text-xs"
                  value={feedbackForm.message}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                  required
                />
                <Button type="submit" size="sm" className="w-full text-xs text-white" style={{ backgroundColor: primaryColor }}>
                  Send Feedback
                </Button>
              </form>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
