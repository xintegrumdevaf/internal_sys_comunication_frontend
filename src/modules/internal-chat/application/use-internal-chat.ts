import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession, useDirectoryUsers } from "@/modules/identity/application/use-session";
import type { Mention } from "@/modules/internal-chat/domain/internal-chat";
import {
  internalChatApi,
  type InternalMessage,
  type InternalThread,
} from "@/services/internalChatApi";
import { subscribeRealtimeEvents } from "@/modules/realtime/infrastructure/realtime-bus";
import { toast } from "sonner";

export interface ThreadViewItem {
  thread: InternalThread;
  peerId: string;
  peerName: string;
  peerInitials: string;
  preview: string;
  unreadCount: number;
}

export function useInternalChat(initialThreadId?: string) {
  const session = useSession();
  const directory = useDirectoryUsers();

  const [rawThreads, setRawThreads] = useState<InternalThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(initialThreadId ?? null);
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadThreads = useCallback(async () => {
    if (!session) return;
    try {
      setLoadingThreads(true);
      const data = await internalChatApi.getThreads();
      setRawThreads(data ?? []);
    } catch {
      // Silencioso
    } finally {
      setLoadingThreads(false);
    }
  }, [session]);

  const loadMessages = useCallback(async (threadId: string) => {
    try {
      setLoadingMessages(true);
      const result = await internalChatApi.getMessages(threadId);
      setMessages(result.messages ?? []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Carga inicial de hilos
  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  // Si cambia el thread seleccionado, cargar mensajes y marcar como leído
  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedThreadId);
    void internalChatApi
      .markAsRead(selectedThreadId)
      .then(() => {
        void loadThreads();
      })
      .catch(() => {});
  }, [selectedThreadId, loadMessages, loadThreads]);

  // Escuchar eventos en tiempo real (SSE)
  useEffect(() => {
    return subscribeRealtimeEvents((event) => {
      if (event.type === "INTERNAL_MESSAGE_SENT") {
        if (selectedThreadId && event.threadId === selectedThreadId) {
          void loadMessages(selectedThreadId);
          void internalChatApi.markAsRead(selectedThreadId).catch(() => {});
        }
        void loadThreads();
      }

      if (event.type === "INTERNAL_THREAD_READ") {
        void loadThreads();
      }
    });
  }, [selectedThreadId, loadMessages, loadThreads]);

  const peers = useMemo(
    () => directory.filter((u) => u.active && u.id !== session?.id),
    [directory, session?.id],
  );

  const threads: ThreadViewItem[] = useMemo(() => {
    if (!session) return [];
    return rawThreads.map((t) => {
      const otherParticipant = t.participants?.find((p) => p.agentId !== session.id);
      const peerId = otherParticipant?.agentId ?? t.referenceId ?? "unknown";
      const peerUser = directory.find((u) => u.id === peerId);
      const peerName = otherParticipant?.agentName ?? peerUser?.name ?? peerId;
      const peerInitials = peerUser?.initials ?? (peerName.slice(0, 2).toUpperCase() || "?");

      let preview = "Iniciar conversación";
      if (t.lastMessage) {
        if (t.lastMessage.type === "quality_quote") {
          preview = `Observación de calidad: ${t.lastMessage.body || "Revisión"}`;
        } else {
          preview = t.lastMessage.body;
        }
      }

      return {
        thread: t,
        peerId,
        peerName,
        peerInitials,
        preview,
        unreadCount: t.unreadCount ?? 0,
      };
    });
  }, [session, rawThreads, directory]);

  const openThreadWith = useCallback(
    async (peerAgentId: string, referenceId?: string) => {
      if (!session) return null;
      try {
        const thread = await internalChatApi.getOrCreateDirectThread(peerAgentId, referenceId);
        setSelectedThreadId(thread.id);
        await loadThreads();
        await loadMessages(thread.id);
        return thread;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo abrir el chat");
        return null;
      }
    },
    [session, loadThreads, loadMessages],
  );

  const send = useCallback(
    async (
      body: string,
      _mentions?: Mention[],
      type?: "text" | "quality_quote" | "conversation_excerpt",
      contextData?: Record<string, unknown>,
    ) => {
      if (!session || !selectedThreadId) return false;
      const trimmed = body.trim();
      if (!trimmed && type !== "quality_quote") return false;

      try {
        const newMsg = await internalChatApi.sendMessage(selectedThreadId, {
          body: trimmed,
          type: type ?? "text",
          contextData,
        });
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        void loadThreads();
        return true;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo enviar");
        return false;
      }
    },
    [session, selectedThreadId, loadThreads],
  );

  const selectedThread = threads.find((t) => t.thread.id === selectedThreadId) ?? null;

  return {
    session,
    directory,
    peers,
    threads,
    rawThreads,
    selectedThreadId,
    setSelectedThreadId,
    selectedThread,
    messages,
    loadingThreads,
    loadingMessages,
    openThreadWith,
    send,
    refreshThreads: loadThreads,
    refreshMessages: () => (selectedThreadId ? loadMessages(selectedThreadId) : Promise.resolve()),
  };
}
