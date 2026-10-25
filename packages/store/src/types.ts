export type ChatStatus = "ready" | "submitted" | "streaming" | "error";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "human" | "data";
  content?: string;
  parts?: any[];
  createdAt?: Date | string;
  [key: string]: any;
}

export interface ChatActions {
  sendMessage?: (message: any, chatRequestOptions?: any) => Promise<any>;
  append?: (message: any, chatRequestOptions?: any) => Promise<any>;
  reload?: (chatRequestOptions?: any) => Promise<any>;
  stop?: () => void;
  setMessages?: (messages: ChatMessage[] | ((messages: ChatMessage[]) => ChatMessage[])) => void;
  setInput?: (input: string) => void;
  input?: string;
  handleInputChange?: (e: any) => void;
  handleSubmit?: (e?: any, chatRequestOptions?: any) => void;
  reset?: () => void;
}

export interface ChatState {
  id: string;
  messages: ChatMessage[];
  messageMap: Map<string, ChatMessage>;
  messageIds: string[];
  status: ChatStatus;
  error: Error | null;
  actions: ChatActions;
  
  // Internal setters
  setId: (id: string) => void;
  setStatus: (status: ChatStatus) => void;
  setError: (error: Error | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setActions: (actions: Partial<ChatActions>) => void;
  reset: (newId?: string) => void;
}
