import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { AiAssistantChat } from "@/features/ai/AiAssistantChat";
import { resolveAssetUrl } from "@/lib/apiClient";

export function AiChatWidget() {
  const { academy } = useAuth();
  const [open, setOpen] = useState(false);

  const academyName = academy?.name ?? "da academia";
  const logo = resolveAssetUrl(academy?.logoUrl);

  return (
    <>
      <button
        type="button"
        className="ai-chat-fab"
        onClick={() => setOpen((v) => !v)}
        title={`Assistente ${academyName}`}
      >
        {open ? (
          <X size={20} />
        ) : logo ? (
          <img src={logo} alt={academyName} />
        ) : (
          <Sparkles size={20} />
        )}
        {!open && <span className="ai-chat-fab-badge" />}
      </button>

      {open && (
        <div className="ai-chat-panel">
          <AiAssistantChat variant="widget" />
        </div>
      )}
    </>
  );
}
