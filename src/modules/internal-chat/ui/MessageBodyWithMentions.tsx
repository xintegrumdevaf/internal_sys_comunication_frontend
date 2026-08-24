import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  findTarget,
  parseMentionMarkers,
  resolveConversationId,
} from "@/modules/internal-chat/domain/mention-parser";
import type { Mention, MentionTarget } from "@/modules/internal-chat/domain/internal-chat";

type Props = {
  body: string;
  mentions?: Mention[];
  targets: MentionTarget[];
  onOpenConversation: (conversationId: string) => void;
};

export function MessageBodyWithMentions({ body, targets, onOpenConversation }: Props) {
  const parts = parseMentionMarkers(body);

  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed">
      {parts.map((part, i) => {
        if (part.kind === "text") {
          return <span key={i}>{part.text}</span>;
        }

        const target = findTarget(part.mention, targets);
        const conversationId = resolveConversationId(part.mention, targets);
        const available = Boolean(conversationId);

        return (
          <HoverCard key={i} openDelay={200}>
            <HoverCardTrigger asChild>
              <button
                type="button"
                disabled={!available}
                onClick={() => {
                  if (conversationId) onOpenConversation(conversationId);
                }}
                className={
                  available
                    ? "inline rounded bg-sky-500/15 px-1.5 py-0.5 font-semibold text-sky-800 hover:bg-sky-500/25"
                    : "inline rounded bg-muted px-1.5 py-0.5 font-semibold text-muted-foreground cursor-not-allowed"
                }
              >
                @{part.mention.label}
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-72 text-xs space-y-1">
              {available && target ? (
                <>
                  <p className="font-bold text-sm text-foreground">{target.customerName}</p>
                  {target.contractId && (
                    <p className="text-muted-foreground">Contrato #{target.contractId}</p>
                  )}
                  <p className="text-muted-foreground">
                    {[target.department, target.status].filter(Boolean).join(" · ") ||
                      "Sin detalle"}
                  </p>
                  {target.preview && (
                    <p className="text-muted-foreground line-clamp-2 pt-1 border-t border-border">
                      {target.preview}
                    </p>
                  )}
                  <p className="text-[10px] text-sky-700 pt-1">Clic para abrir en bandeja</p>
                </>
              ) : (
                <p className="text-muted-foreground">Caso no disponible</p>
              )}
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </p>
  );
}
