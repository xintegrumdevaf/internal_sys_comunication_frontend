import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { SEED_USERS } from "@/lib/auth-seed";
import { useSession } from "@/lib/auth";
import type { Mention } from "@/lib/internal-chat-types";
import {
  getInternalChatSnapshot,
  getOrCreateThread,
  lastMessagePreview,
  listMessages,
  listRecentMentionsByAuthor,
  listThreadsForUser,
  peerIdOfThread,
  sendInternalMessage,
  subscribeInternalChat,
} from "@/lib/internal-chat-store";
import { toast } from "sonner";

export function useInternalChat() {
  const session = useSession();
  const state = useSyncExternalStore(
    subscribeInternalChat,
    getInternalChatSnapshot,
    () => ({ threads: [], messages: [] }),
  );

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const peers = useMemo(
    () => SEED_USERS.filter((u) => u.active && u.id !== session?.id),
    [session?.id],
  );

  const threads = useMemo(() => {
    if (!session) return [];
    return listThreadsForUser(session.id).map((t) => {
      const peerId = peerIdOfThread(t, session.id);
      const peer = SEED_USERS.find((u) => u.id === peerId);
      return {
        thread: t,
        peerId,
        peerName: peer?.name ?? peerId,
        peerInitials: peer?.initials ?? "?",
        preview: lastMessagePreview(t.id),
      };
    });
  }, [session, state]);

  const messages = useMemo(() => {
    if (!selectedThreadId) return [];
    return listMessages(selectedThreadId);
  }, [selectedThreadId, state]);

  const recentMentions = useMemo(() => {
    if (!session) return [];
    return listRecentMentionsByAuthor(session.id);
  }, [session, state]);

  const openThreadWith = useCallback(
    (peerId: string) => {
      if (!session) return null;
      try {
        const thread = getOrCreateThread(session.id, peerId);
        setSelectedThreadId(thread.id);
        return thread;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo abrir el chat");
        return null;
      }
    },
    [session],
  );

  const send = useCallback(
    (body: string, mentions: Mention[]) => {
      if (!session || !selectedThreadId) return false;
      const trimmed = body.trim();
      if (!trimmed) return false;
      try {
        sendInternalMessage({
          threadId: selectedThreadId,
          authorId: session.id,
          body: trimmed,
          mentions,
        });
        return true;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo enviar");
        return false;
      }
    },
    [session, selectedThreadId],
  );

  const selectedThread = threads.find((t) => t.thread.id === selectedThreadId) ?? null;

  return {
    session,
    peers,
    threads,
    selectedThreadId,
    setSelectedThreadId,
    selectedThread,
    messages,
    recentMentions,
    openThreadWith,
    send,
  };
}
