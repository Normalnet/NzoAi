import { createStore } from "zustand";
import type { ChatMessage, ChatState, ChatStatus } from "./types";
import { debug } from "./debug";

function buildMapAndIds(messages: ChatMessage[]) {
  const map = new Map<string, ChatMessage>();
  const ids: string[] = [];
  for (const msg of messages) {
    map.set(msg.id, msg);
    ids.push(msg.id);
  }
  return { map, ids };
}

export function createChatStore(initialMessages: ChatMessage[] = [], initialId: string = "") {
  const { map, ids } = buildMapAndIds(initialMessages);

  return createStore<ChatState>((set, get) => ({
    id: initialId,
    messages: initialMessages,
    messageMap: map,
    messageIds: ids,
    status: "ready",
    error: null,
    actions: {},

    setId: (id: string) => {
      debug("setId:", id);
      set({ id });
    },

    setStatus: (status: ChatStatus) => {
      debug("setStatus:", status);
      set({ status });
    },

    setError: (error: Error | null) => {
      debug("setError:", error);
      set({ error });
    },

    setMessages: (messages: ChatMessage[]) => {
      const { map, ids } = buildMapAndIds(messages);
      set({ messages, messageMap: map, messageIds: ids });
    },

    setActions: (actions) => {
      set((state) => ({ actions: { ...state.actions, ...actions } }));
    },

    reset: (newId?: string) => {
      debug("reset store");
      set({
        id: newId || "",
        messages: [],
        messageMap: new Map(),
        messageIds: [],
        status: "ready",
        error: null,
      });
    },
  }));
}

export type ChatStore = ReturnType<typeof createChatStore>;
