import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AtSign, MessagesSquare } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { InternalChatShell } from "@/modules/internal-chat/ui/InternalChatShell";
import { parseInternalChatDeepLink } from "@/modules/internal-chat/domain/deep-link";
import { isSupervisorSession } from "@/modules/identity/application/access-control";
import { useSession } from "@/modules/identity/application/use-session";

type ChatInternoSearch = {
  threadId?: string;
  peerId?: string;
  qualityReviewId?: string;
};

export const Route = createFileRoute("/chat-interno")({
  validateSearch: (search: Record<string, unknown>): ChatInternoSearch =>
    parseInternalChatDeepLink(search),
  component: ChatInternoPage,
});

function ChatInternoPage() {
  const session = useSession();
  const deepLink = Route.useSearch();
  const [mentionsOpen, setMentionsOpen] = useState(false);
  const supervisor = isSupervisorSession(session);

  return (
    <AppShell title="Chat interno · Solo staff" icon={MessagesSquare}>
      <div className="mb-4 p-3 rounded-lg border border-border bg-card text-[11px] text-muted-foreground animate-fade-up flex flex-wrap items-center justify-between gap-3">
        <p>
          Conversaciones 1:1 y de coaching entre agentes. Las observaciones y menciones son
          privadas: <span className="font-bold text-foreground">el cliente no las ve</span>.{" "}
          <span className="italic">Sincronizado en tiempo real.</span>
        </p>
        {supervisor && (
          <button
            type="button"
            onClick={() => setMentionsOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide hover:bg-muted text-foreground"
          >
            <AtSign className="h-3.5 w-3.5" />
            Menciones
          </button>
        )}
      </div>
      <InternalChatShell
        mentionsOpen={mentionsOpen}
        onMentionsOpenChange={setMentionsOpen}
        initialThreadId={deepLink.threadId}
        initialPeerId={deepLink.peerId}
        initialQualityReviewId={deepLink.qualityReviewId}
      />
    </AppShell>
  );
}
