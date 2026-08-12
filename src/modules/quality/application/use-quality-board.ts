import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/shared/http/http-client";
import { useSession } from "@/modules/identity/application/use-session";
import {
  defaultQualityDateRange,
  type AgentQualityStatsDto,
  type QualityReviewDto,
  type QualityReviewStatus,
} from "@/modules/quality/domain/quality-review";
import {
  analyzeQualityBatch,
  getQualityPendingCount,
  listAgentQualityStats,
  listQualityReviews,
  requestOnDemandReview,
} from "@/modules/quality/infrastructure/quality.gateway";

export type QualityBoardFilters = {
  from: string;
  to: string;
  departmentId: string;
  agentId: string;
  status: QualityReviewStatus | "";
  minScore: string;
  maxScore: string;
};

function initialFilters(): QualityBoardFilters {
  const range = defaultQualityDateRange(30);
  return {
    from: range.from.slice(0, 10),
    to: range.to.slice(0, 10),
    departmentId: "",
    agentId: "",
    status: "",
    minScore: "",
    maxScore: "",
  };
}

function toIsoStart(dateYmd: string): string | undefined {
  if (!dateYmd) return undefined;
  return new Date(`${dateYmd}T00:00:00.000`).toISOString();
}

function toIsoEnd(dateYmd: string): string | undefined {
  if (!dateYmd) return undefined;
  return new Date(`${dateYmd}T23:59:59.999`).toISOString();
}

const PENDING_POLL_MS = 15_000;
const FULL_RELOAD_EVERY_N = 3;

export function useQualityBoard(opts?: { pausePolling?: boolean }) {
  const pausePolling = opts?.pausePolling === true;
  const session = useSession();
  const [filters, setFilters] = useState<QualityBoardFilters>(initialFilters);
  const [stats, setStats] = useState<AgentQualityStatsDto[]>([]);
  const [reviews, setReviews] = useState<QualityReviewDto[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyzingCaseId, setAnalyzingCaseId] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const pollTicks = useRef(0);

  const reload = useCallback(
    async (optsReload?: { silent?: boolean }) => {
      if (!session) return;
      const silent = optsReload?.silent === true;
      if (!silent) setLoading(true);
      try {
        const from = toIsoStart(filters.from);
        const to = toIsoEnd(filters.to);
        const departmentId = filters.departmentId || undefined;
        const agentId = filters.agentId || undefined;
        const [agentStats, reviewList, pending] = await Promise.all([
          listAgentQualityStats({ from, to, departmentId }),
          listQualityReviews({
            from,
            to,
            departmentId,
            agentId,
            status: filters.status || undefined,
            minScore: filters.minScore !== "" ? Number(filters.minScore) : undefined,
            maxScore: filters.maxScore !== "" ? Number(filters.maxScore) : undefined,
          }),
          getQualityPendingCount({ agentId, departmentId }),
        ]);
        setStats(agentStats);
        setReviews(reviewList);
        setPendingCount(pending);
        setBackendUnavailable(false);
      } catch (e) {
        if (e instanceof ApiError && (e.status === 404 || e.status === 501)) {
          setStats([]);
          setReviews([]);
          setPendingCount(0);
          setBackendUnavailable(true);
        } else {
          setBackendUnavailable(false);
          if (!silent) {
            toast.error(e instanceof Error ? e.message : "No se pudo cargar calidad");
          }
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [session, filters],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (pausePolling || !session || backendUnavailable || pendingCount <= 0) return;
    const id = window.setInterval(() => {
      void (async () => {
        try {
          const pending = await getQualityPendingCount({
            agentId: filters.agentId || undefined,
            departmentId: filters.departmentId || undefined,
          });
          const prev = pendingCount;
          setPendingCount(pending);
          pollTicks.current += 1;
          if (pending < prev || pollTicks.current % FULL_RELOAD_EVERY_N === 0) {
            await reload({ silent: true });
          }
        } catch {
          /* ignore */
        }
      })();
    }, PENDING_POLL_MS);
    return () => window.clearInterval(id);
  }, [
    pausePolling,
    session,
    backendUnavailable,
    pendingCount,
    filters.agentId,
    filters.departmentId,
    reload,
  ]);

  const analyzeChat = useCallback(
    async (caseId: string) => {
      if (!session || analyzingCaseId || batchBusy) return;
      setAnalyzingCaseId(caseId);
      try {
        const review = await requestOnDemandReview(caseId);
        if (review.status === "ready" || review.status === "reviewed") {
          toast.message("Este chat ya está analizado");
        } else {
          toast.success("Chat encolado (uno a la vez)");
          setPendingCount((c) => Math.max(c, 1));
        }
        await reload({ silent: true });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo analizar el chat");
      } finally {
        setAnalyzingCaseId(null);
      }
    },
    [session, analyzingCaseId, batchBusy, reload],
  );

  /** Encola los casos cerrados más recientes sin score útil (filtro actual). */
  const analyzePendingChats = useCallback(async () => {
    if (!session || batchBusy || analyzingCaseId) return;
    setBatchBusy(true);
    try {
      const result = await analyzeQualityBatch({
        from: toIsoStart(filters.from),
        to: toIsoEnd(filters.to),
        departmentId: filters.departmentId || undefined,
        agentId: filters.agentId || undefined,
        limit: 5,
      });
      setPendingCount(result.pendingTotal);
      if (result.enqueued === 0) {
        toast.message(
          result.pendingTotal > 0
            ? `Ya hay ${result.pendingTotal} en cola`
            : "No hay chats recientes pendientes de analizar",
        );
      } else {
        toast.success(
          `Encolados ${result.enqueued} chat(s) recientes. Ollama los procesa uno a uno.`,
        );
      }
      await reload({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo encolar");
    } finally {
      setBatchBusy(false);
    }
  }, [session, batchBusy, analyzingCaseId, filters, reload]);

  return {
    session,
    filters,
    setFilters,
    stats,
    reviews,
    pendingCount,
    loading,
    analyzingCaseId,
    batchBusy,
    backendUnavailable,
    reload,
    analyzeChat,
    analyzePendingChats,
  };
}
