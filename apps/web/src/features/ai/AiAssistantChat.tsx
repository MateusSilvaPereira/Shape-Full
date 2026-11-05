import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Send, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/toast/ToastContext";
import { useAuth } from "@/features/auth/AuthContext";
import { resolveAssetUrl } from "@/lib/apiClient";
import { useAiChatContext } from "./AiChatContext";

const SUGGESTIONS = [
  "O que meu treino trabalha hoje?",
  "Dicas rápidas de nutrição",
  "Como atualizo meus dados?",
];

interface AiAssistantChatProps {
  /** "widget": compacto dentro do balão flutuante. "page": ocupa a aba inteira. */
  variant?: "widget" | "page";
}

export function AiAssistantChat({ variant = "widget" }: AiAssistantChatProps) {
  const { user, academy } = useAuth();
  const { toast } = useToast();
  const { messages, isPending, sendMessage } = useAiChatContext();
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const academyName = academy?.name ?? "da academia";
  const logo = resolveAssetUrl(academy?.logoUrl);
  const firstName = user?.name?.split(" ")[0];

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isPending]);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input;
    setInput("");
    await sendMessage(text);
  }

  function explainAssistant() {
    toast.info(
      "Este é um assistente virtual (inteligência artificial), não uma pessoa da equipe. " +
        "Ele pode errar — sempre confirme informações importantes com a equipe da academia.",
    );
  }

  function Avatar({ size = "md" }: { size?: "md" | "lg" }) {
    return (
      <button
        type="button"
        className={"ai-chat-avatar-btn " + size}
        onClick={explainAssistant}
        title="Isto é um assistente de IA — clique para saber mais"
      >
        {logo ? (
          <img src={logo} alt={academyName} className="ai-chat-avatar" />
        ) : (
          <div className="ai-chat-avatar ai-chat-avatar-fallback">
            <Sparkles size={16} />
          </div>
        )}
        <span className="ai-chat-avatar-badge">
          <Sparkles size={size === "lg" ? 11 : 9} />
        </span>
      </button>
    );
  }

  return (
    <div className={"ai-assistant-chat " + variant}>
      <div className="ai-chat-header">
        <Avatar size="lg" />
        <div className="ai-chat-header-text">
          <span>
            Assistente {academyName} <em className="ai-chat-ia-pill">IA</em>
          </span>
          <small>
            <i /> online agora · pode cometer erros
          </small>
        </div>
      </div>
      <div className="ai-chat-messages" ref={listRef}>
        {messages.length === 0 && (
          <div className="ai-chat-empty">
            <Avatar size="lg" />
            <p>
              Oi{firstName ? `, ${firstName}` : ""}! Sou o assistente virtual{" "}
              <b>(IA)</b> da <b>{academyName}</b>. Pergunte sobre seu treino,
              nutrição ou o sistema, estou aqui pra ajudar 💪
            </p>
            <div className="ai-chat-suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="ai-chat-suggestion"
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={"ai-chat-row " + msg.role}>
            {msg.role === "model" && <Avatar />}
            <div className={"ai-chat-bubble " + msg.role}>{msg.text}</div>
          </div>
        ))}
        {isPending && (
          <div className="ai-chat-row model">
            <Avatar />
            <div className="ai-chat-bubble model ai-chat-typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>
      <form className="ai-chat-input-row" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua pergunta..."
          disabled={isPending}
        />
        <button type="submit" className="ai-chat-send" disabled={isPending || !input.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
