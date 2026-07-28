import { useCallback, useEffect, useRef, useState } from "react";
import {
  getConversationContextFn,
  listConversationsFn,
  listMessagesFn,
  takeControlFn,
  transferConversationFn,
} from "@/adapters/http/server-fns";
import type { ConversationDto, MessageDto } from "@/adapters/http/dto";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.max(1, Math.round(diff / 60_000));
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export function intentLabel(intent?: string): { label: string; cls: string } {
  switch (intent) {
    case "dano":
      return { label: "Daño", cls: "bg-red-100 text-red-700" };
    case "pago":
      return { label: "Pago", cls: "bg-green-100 text-green-700" };
    case "instalacion":
      return { label: "Instalación", cls: "bg-amber-100 text-amber-700" };
    case "traslado":
      return { label: "Traslado", cls: "bg-amber-100 text-amber-700" };
    case "velocidad":
      return { label: "Velocidad", cls: "bg-blue-100 text-blue-700" };
    case "infra":
      return { label: "Infra", cls: "bg-purple-100 text-purple-700" };
    case "campana":
      return { label: "Campaña", cls: "bg-emerald-100 text-emerald-700" };
    default:
      return { label: intent ?? "General", cls: "bg-foreground/5 text-muted-foreground" };
  }
}

type InboxOptions = {
  /** If set, filter by department slug. If omitted with userScope, uses session user inbox. */
  departmentSlug?: string;
  userScope?: boolean;
  /** Poll interval in ms for live WhatsApp/inbound updates. Default 2500. Set 0 to disable. */
  pollMs?: number;
};

export function useOperationalInbox(options: InboxOptions = {}) {
  const session = useSession();
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [context, setContext] = useState<Awaited<
    ReturnType<typeof getConversationContextFn>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;
  const pollMs = options.pollMs ?? 2500;

  const reload = useCallback(async (opts?: { silent?: boolean }) => {
    if (!session) return;
    if (!opts?.silent) setLoading(true);
    try {
      const data = await listConversationsFn({
        data: options.departmentSlug
          ? { departmentSlug: options.departmentSlug, userId: session.id }
          : { userId: session.id },
      });
      setConversations(data);

      const prevId = selectedIdRef.current;
      const nextId =
        prevId && data.some((c) => c.id === prevId) ? prevId : (data[0]?.id ?? null);
      setSelectedId(nextId);

      if (!nextId) {
        setMessages([]);
        setContext(null);
        return;
      }

      const [msgs, ctx] = await Promise.all([
        listMessagesFn({ data: { conversationId: nextId } }),
        getConversationContextFn({ data: { conversationId: nextId } }),
      ]);
      setMessages(msgs);
      setContext(ctx);
    } catch (e) {
      if (!opts?.silent) {
        toast.error(e instanceof Error ? e.message : "Error cargando bandeja");
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [session, options.departmentSlug, options.userScope]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (pollMs <= 0) return;
    const id = window.setInterval(() => {
      void reload({ silent: true });
    }, pollMs);
    return () => window.clearInterval(id);
  }, [reload, pollMs]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setContext(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [msgs, ctx] = await Promise.all([
          listMessagesFn({ data: { conversationId: selectedId } }),
          getConversationContextFn({ data: { conversationId: selectedId } }),
        ]);
        if (!cancelled) {
          setMessages(msgs);
          setContext(ctx);
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Error cargando chat");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const takeControl = async () => {
    if (!session || !selectedId) return;
    setBusy(true);
    try {
      await takeControlFn({
        data: { conversationId: selectedId, agentUserId: session.id },
      });
      toast.success("Control tomado");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo tomar control");
    } finally {
      setBusy(false);
    }
  };

  const transfer = async (toDepartmentSlug: string, reason: string) => {
    if (!session || !selectedId) return;
    setBusy(true);
    try {
      await transferConversationFn({
        data: {
          conversationId: selectedId,
          toDepartmentSlug,
          requestedByUserId: session.id,
          reason,
        },
      });
      toast.success(`Transferido a ${toDepartmentSlug}`);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo transferir");
    } finally {
      setBusy(false);
    }
  };

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return {
    session,
    conversations,
    selected,
    selectedId,
    setSelectedId,
    messages,
    context,
    loading,
    busy,
    reload,
    takeControl,
    transfer,
  };
}
