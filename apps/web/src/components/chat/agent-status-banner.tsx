import React from "react";
import { UserCheck, Bot } from "lucide-react";

interface AgentStatusBannerProps {
  status: string; // 'unresolved' | 'resolved' | 'escalated'
}

export function AgentStatusBanner({ status }: AgentStatusBannerProps) {
  if (status === "escalated") {
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
        <div className="flex items-center gap-1.5 font-medium">
          <UserCheck className="w-3.5 h-3.5" />
          <span>Human Support Agent Active</span>
        </div>
        <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded-full font-semibold">LIVE</span>
      </div>
    );
  }

  return (
    <div className="bg-primary/5 border-b border-primary/10 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5 font-medium">
        <Bot className="w-3.5 h-3.5 text-primary" />
        <span>NzoAI Assistant Active</span>
      </div>
      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-semibold">ONLINE</span>
    </div>
  );
}
