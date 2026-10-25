import { useCallback, useEffect, useRef } from "react";
import { useStore } from "zustand";
import { useChatStoreApi } from "./context";
import type { ChatMessage, ChatState, ChatStatus } from "./types";
import { debug } from "./debug";

export function useSelector<T>(selector: (state: ChatState) => T): T {
  const store = useChatStoreApi();
  return useStore(store, selector);
}

export function useChatMessages(): ChatMessage[] {
  return useSelector((state) => state.messages);
}

export function useChatStatus(): ChatStatus {
  return useSelector((state) => state.status);
}

export function useChatError(): Error | null {
  return useSelector((state) => state.error);
}

export function useChatId(): string {
  return useSelector((state) => state.id);
}

export function useMessageIds(): string[] {
  return useSelector((state) => state.messageIds);
}

export function useMessageById(id: string): ChatMessage | undefined {
  return useSelector((state) => state.messageMap.get(id));
}

export function useMessageCount(): number {
  return useSelector((state) => state.messages.length);
}

export function useVirtualMessages(start: number, end: number): ChatMessage[] {
  return useSelector((state) => state.messages.slice(start, end));
}

export function useChatActions() {
  return useSelector((state) => state.actions);
}

export function useChatReset() {
  const store = useChatStoreApi();
  return useCallback((newId?: string) => {
    store.getState().reset(newId);
  }, [store]);
}

/**
 * useChat hook that integrates with AI SDK or local state,
 * synchronizing with the store using batched requestAnimationFrame.
 */
export function useChat(options: any = {}) {
  const store = useChatStoreApi();
  const rafRef = useRef<number | null>(null);
  const pendingMessagesRef = useRef<ChatMessage[] | null>(null);

  // Sync options.id if provided
  useEffect(() => {
    if (options.id && store.getState().id !== options.id) {
      store.getState().setId(options.id);
    }
  }, [options.id, store]);

  // Sync actions if provided via options or callers
  const setMessagesInStore = useCallback((incoming: ChatMessage[]) => {
    // Prevent overwriting pre-hydrated messages with empty array
    if (incoming.length === 0 && store.getState().messages.length > 0) {
      debug("Ignoring empty messages overwrite over hydrated messages");
      return;
    }

    pendingMessagesRef.current = incoming;
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        if (pendingMessagesRef.current) {
          store.getState().setMessages(pendingMessagesRef.current);
          pendingMessagesRef.current = null;
        }
        rafRef.current = null;
      });
    }
  }, [store]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    id: useSelector((state) => state.id),
    messages: useSelector((state) => state.messages),
    status: useSelector((state) => state.status),
    error: useSelector((state) => state.error),
    setMessages: setMessagesInStore,
    setStatus: store.getState().setStatus,
    setError: store.getState().setError,
    actions: useSelector((state) => state.actions),
  };
}
