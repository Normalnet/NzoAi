import React, { useState, useEffect } from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "../../components/dashboard/app-sidebar";
import { ShareDialog } from "../../components/share-bot/share-dialog";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [chatbot, setChatbot] = useState<any>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    fetch("/api/my-chatbot")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.chatbot) {
          setChatbot(data.chatbot);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="flex h-screen bg-muted/10 overflow-hidden font-sans">
      <AppSidebar
        chatbotName={chatbot?.name || "Support Bot"}
        chatbotColor={chatbot?.primaryColor || "#800020"}
        onShareClick={() => setIsShareOpen(true)}
      />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <Outlet />
      </main>

      {chatbot && (
        <ShareDialog
          chatbotName={chatbot.name}
          embedToken={chatbot.embedToken}
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </div>
  );
}
