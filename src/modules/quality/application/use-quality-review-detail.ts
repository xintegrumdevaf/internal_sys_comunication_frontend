import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/shared/http/http-client";
import { listMessages } from "@/modules/conversations/infrastructure/conversation.gateway";
import type { MessageDto } from "@/modules/conversations/domain/conversation";
import { useSession } from "@/modules/identity/application/use-session";
import {
  buildQualityChatDeepLink,
  type QualityReviewDto,
} from "@/modules/quality/domain/quality-review";
import {
  addQualityCoachingNote,
  getQualityReview,
  markQualityReviewReviewed,
  requestOnDemandReview,
} from "@/modules/quality/infrastructure/quality.gateway";

const PENDING_POLL_MS = 3000;

/**
 * Detalle de review: mensajes + nota + mark reviewed + on-demand + deep-link.
 * Si status=pending, hace poll (no dispara análisis nuevo al abrir el ranking).
 * Re-análisis solo con «Analizar de nuevo» (on-demand explícito).
 */
export function useQualityReviewDetail(reviewId: string | undefined) {
  const session = useSession();
  const [review, setReview] = useState<QualityReviewDto | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = useCallback(async (detail: QualityReviewDto) => {
    try {
      const msgs = await listMessages(detail.conversationId, { limit: 200 });
      setMessages(
        detail.caseId
          ? msgs.filter((m) => m.caseId === detail.caseId || m.caseId === null)
          : msgs,
      );
    } catch {
      setMessages([]);
    }
  }, []);

  const reload = useCallback(async () => {
    if (!reviewId || !session) {
      setReview(null);
      setMessages([]);
      return;
    }
    setLoading(true);
    try {
      const detail = await getQualityReview(reviewId);
      setReview(detail);
      setBackendUnavailable(false);
      await loadMessages(detail);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 501)) {
        setReview(null);
        setMessages([]);
        setBackendUnavailable(true);
      } else {
        setBackendUnavailable(false);
        toast.error(e instanceof Error ? e.message : "No se pudo cargar la revisión");
      }
    } finally {
      setLoading(false);
    }
  }, [reviewId, session, loadMessages]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Poll solo mientras pending — no gasta tokens; espera el job ya encolado al cierre.
  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (!reviewId || !session || review?.status !== "pending") return;

    pollRef.current = setInterval(() => {
      void (async () => {
        try {
          const detail = await getQualityReview(reviewId);
          setReview(detail);
          if (detail.status !== "pending") {
            await loadMessages(detail);
          }
        } catch {
          /* silencioso en poll */
        }
      })();
    }, PENDING_POLL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [reviewId, session, review?.status, loadMessages]);

  const submitNote = async () => {
    if (!reviewId || !noteDraft.trim()) return;
    setBusy(true);
    try {
      await addQualityCoachingNote(reviewId, noteDraft.trim());
      setNoteDraft("");
      toast.success("Nota de coaching guardada");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la nota");
    } finally {
      setBusy(false);
    }
  };

  const markReviewed = async () => {
    if (!reviewId) return;
    setBusy(true);
    try {
      await markQualityReviewReviewed(reviewId);
      toast.success("Revisión marcada como revisada");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo marcar como revisada");
    } finally {
      setBusy(false);
    }
  };

  const requestOnDemand = async () => {
    if (!review?.caseId) return;
    setBusy(true);
    try {
      const created = await requestOnDemandReview(review.caseId);
      toast.success(
        created.status === "pending"
          ? "Análisis en curso…"
          : "Análisis solicitado",
      );
      return created.id;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo solicitar el análisis");
      return undefined;
    } finally {
      setBusy(false);
    }
  };

  const chatDeepLink = review
    ? buildQualityChatDeepLink(review.agentId, review.id)
    : null;

  return {
    session,
    review,
    messages,
    loading,
    busy,
    backendUnavailable,
    noteDraft,
    setNoteDraft,
    reload,
    submitNote,
    markReviewed,
    requestOnDemand,
    chatDeepLink,
  };
}
