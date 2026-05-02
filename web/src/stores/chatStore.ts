import { create } from "zustand";
import {
  type ChatMessage,
  type StreamHandle,
  getChatHistory,
  streamChat,
} from "../api/client";

interface ChatState {
  messages: ChatMessage[];
  streaming: string;
  isStreaming: boolean;
  error: string | null;
  handle: StreamHandle | null;
  loadHistory: (id: string) => Promise<void>;
  send: (id: string, message: string) => Promise<void>;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  streaming: "",
  isStreaming: false,
  error: null,
  handle: null,
  async loadHistory(id) {
    try {
      const messages = await getChatHistory(id);
      set({ messages, error: null });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
  async send(id, message) {
    const userMsg: ChatMessage = {
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    };
    set((s) => ({
      messages: [...s.messages, userMsg],
      streaming: "",
      isStreaming: true,
      error: null,
    }));

    const handle = await streamChat(id, message, (ev) => {
      if (ev.type === "chunk") {
        set((s) => ({ streaming: s.streaming + ev.text }));
      } else if (ev.type === "done") {
        const final = get().streaming;
        set((s) => ({
          messages: [
            ...s.messages,
            {
              role: "ancestor",
              content: final,
              created_at: new Date().toISOString(),
            },
          ],
          streaming: "",
          isStreaming: false,
          handle: null,
        }));
      } else if (ev.type === "error") {
        set({ error: ev.message, isStreaming: false, handle: null });
      }
    });
    set({ handle });
  },
  reset() {
    const h = get().handle;
    if (h) h.cancel();
    set({
      messages: [],
      streaming: "",
      isStreaming: false,
      error: null,
      handle: null,
    });
  },
}));
