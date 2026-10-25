import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Zap,
  Inbox,
  Activity,
  BarChart2,
  Settings,
  Share2,
  Bot,
  LogOut,
  ChevronDown,
  Crown,
} from "lucide-react";
import { signOut } from "../../lib/auth-client";

interface AppSidebarProps {
  chatbotName?: string;
  chatbotColor?: string;
  onShareClick?: () => void;
}

export function AppSidebar({ chatbotName = "My Chatbot", chatbotColor = "#800020", onShareClick }: AppSidebarProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const navItems = [
    { label: "Overview", href: "/admin/overview", icon: LayoutDashboard },
    { label: "Playground", href: "/admin/playground", icon: MessageSquare },
    { label: "Knowledge Base", href: "/admin/knowledge-base", icon: BookOpen },
    { label: "Actions", href: "/admin/actions", icon: Zap },
    { label: "Chat History", href: "/admin/chat-history", icon: Inbox },
    { label: "Activity", href: "/admin/activity", icon: Activity },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart2 },
    { label: "Settings", href: "/admin/settings", icon: Settings },
    { label: "Superadmin", href: "/admin/superadmin", icon: Crown },
  ];

  return (
    <aside className="w-64 border-r bg-card flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-foreground tracking-tight">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-base shadow-sm"
            style={{ backgroundColor: chatbotColor }}
          >
            N
          </div>
          <span>NzoAI</span>
        </Link>
      </div>

      {/* Active Bot Switcher / Badge */}
      <div className="p-3 border-b bg-muted/20">
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-background border shadow-2xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <Bot className="w-4 h-4 text-primary shrink-0" />
            <span className="font-medium text-xs truncate">{chatbotName}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Share & Sign out */}
      <div className="p-3 border-t space-y-2">
        {onShareClick && (
          <button
            onClick={onShareClick}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium text-xs hover:bg-primary/20 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Embed / Share Widget</span>
          </button>
        )}

        <button
          onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login"; } } })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
