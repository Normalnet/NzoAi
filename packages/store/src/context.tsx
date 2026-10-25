import React, { createContext, useContext, useRef } from "react";
import { createChatStore, type ChatStore } from "./store";
import type { ChatMessage } from "./types";

export const ChatStoreContext = createContext<ChatStore | null>(null);

export interface ProviderProps {
  initialMessages?: ChatMessage[];
  initialId?: string;
  children: React.ReactNode;
}

export function Provider({ initialMessages = [], initialId = "", children }: ProviderProps) {
  const storeRef = useRef<ChatStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createChatStore(initialMessages, initialId);
  }

  return (
    <ChatStoreContext.Provider value={storeRef.current}>
      {children}
    </ChatStoreContext.Provider>
  );
}

export function useChatStoreApi(): ChatStore {
  const store = useContext(ChatStoreContext);
  if (!store) {
    throw new Error("useChatStoreApi must be used within an @nzoai/store Provider");
  }
  return store;
}
