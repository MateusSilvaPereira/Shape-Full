import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { useToast } from "@/components/ui/toast/ToastContext";
import { getApiErrorMessage } from "@/lib/apiClient";
import { useAiChat } from "./useAi";
import type { ChatMessage } from "./types";

interface AiChatContextValue {
  messages: ChatMessage[];
  isPending: boolean;
  sendMessage: (text: string) => Promise<void>;
}

const AiChatContext = createContext<AiChatContextValue | null>(null);

/** Mantém uma única conversa compartilhada entre o balão flutuante e a aba
 * "Assistente" — abrir em qualquer um dos dois lugares continua o mesmo papo. */
export function AiChatProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const chat = useAiChat();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  async function sendMessage(text: string) {
    if (!text.trim() || chat.isPending) return;
    const history = messages;
    setMessages((prev) => [...prev, { role: "user", text }]);

    try {
      const reply = await chat.mutateAsync({ message: text, history });
      setMessages((prev) => [...prev, { role: "model", text: reply }]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Não foi possível falar com o assistente agora."));
    }
  }

  return (
    <AiChatContext.Provider value={{ messages, isPending: chat.isPending, sendMessage }}>
      {children}
    </AiChatContext.Provider>
  );
}

export function useAiChatContext() {
  const ctx = useContext(AiChatContext);
  if (!ctx) throw new Error("useAiChatContext deve ser usado dentro de AiChatProvider");
  return ctx;
}
