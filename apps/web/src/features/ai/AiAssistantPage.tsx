import { PageHeading } from "@/components/layout/PageHeading";
import { AiAssistantChat } from "./AiAssistantChat";

export function AiAssistantPage() {
  return (
    <>
      <PageHeading
        title="Assistente IA"
        subtitle="O mesmo assistente do balão flutuante, em tela cheia — a conversa continua de onde parou."
      />
      <AiAssistantChat variant="page" />
    </>
  );
}
