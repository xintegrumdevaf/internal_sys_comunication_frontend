import { apiGet, apiPatch, apiPost } from "@/shared/http/http-client";
import {
  normalizeAgentStats,
  normalizeQualityReview,
  type AgentQualityStatsDto,
  type QualityCoachingNoteDto,
  type QualityReviewDto,
  type QualityReviewStatus,
} from "@/modules/quality/domain/quality-review";

/** Puerto de infraestructura: /api/quality/* (07_QUALITY_SUPERVISION.md, backend Etapa 10). */

export type ListAgentQualityStatsFilter = {
  from?: string;
  to?: string;
  departmentId?: string;
};

export type ListQualityReviewsFilter = {
  agentId?: string;
  from?: string;
  to?: string;
  minScore?: number;
  maxScore?: number;
  status?: QualityReviewStatus;
  departmentId?: string;
};

export async function listAgentQualityStats(
  filter: ListAgentQualityStatsFilter = {},
): Promise<AgentQualityStatsDto[]> {
  const data = await apiGet<Partial<AgentQualityStatsDto>[]>("/api/quality/agents", {
    query: {
      from: filter.from,
      to: filter.to,
      departmentId: filter.departmentId,
    },
  });
  return (data ?? []).map((row) => normalizeAgentStats({ ...row, agentId: row.agentId ?? "" }));
}

export async function listQualityReviews(
  filter: ListQualityReviewsFilter = {},
): Promise<QualityReviewDto[]> {
  const data = await apiGet<Partial<QualityReviewDto>[]>("/api/quality/reviews", {
    query: {
      agentId: filter.agentId,
      from: filter.from,
      to: filter.to,
      minScore: filter.minScore,
      maxScore: filter.maxScore,
      status: filter.status,
      departmentId: filter.departmentId,
    },
  });
  return (data ?? [])
    .filter((row): row is Partial<QualityReviewDto> & { id: string } => Boolean(row.id))
    .map(normalizeQualityReview);
}

export async function getQualityReview(reviewId: string): Promise<QualityReviewDto> {
  const data = await apiGet<Partial<QualityReviewDto>>(`/api/quality/reviews/${reviewId}`);
  return normalizeQualityReview({ ...data, id: data.id ?? reviewId });
}

export async function requestOnDemandReview(caseId: string): Promise<QualityReviewDto> {
  const data = await apiPost<Partial<QualityReviewDto>>("/api/quality/reviews", { caseId });
  return normalizeQualityReview({ ...data, id: data.id ?? "" });
}

export async function addQualityCoachingNote(
  reviewId: string,
  body: string,
): Promise<QualityCoachingNoteDto> {
  return apiPost<QualityCoachingNoteDto>(`/api/quality/reviews/${reviewId}/notes`, { body });
}

export async function markQualityReviewReviewed(reviewId: string): Promise<QualityReviewDto> {
  const data = await apiPatch<Partial<QualityReviewDto>>(`/api/quality/reviews/${reviewId}`, {
    status: "reviewed",
  });
  return normalizeQualityReview({ ...data, id: data.id ?? reviewId });
}

export type AnalyzeBatchInput = {
  from?: string;
  to?: string;
  agentId?: string;
  departmentId?: string;
  limit?: number;
};

export type AnalyzeBatchResult = {
  enqueued: number;
  pendingTotal: number;
  reviews: QualityReviewDto[];
};

export async function getQualityPendingCount(
  filter: {
    agentId?: string;
    departmentId?: string;
  } = {},
): Promise<number> {
  const data = await apiGet<{ pendingCount: number }>("/api/quality/pending-count", {
    query: {
      agentId: filter.agentId,
      departmentId: filter.departmentId,
    },
  });
  return data?.pendingCount ?? 0;
}

/** Encola análisis de casos cerrados sin review útil (límite bajo en backend). */
export async function analyzeQualityBatch(
  input: AnalyzeBatchInput = {},
): Promise<AnalyzeBatchResult> {
  const data = await apiPost<{
    enqueued: number;
    pendingTotal: number;
    reviews?: Partial<QualityReviewDto>[];
  }>("/api/quality/analyze-batch", {
    from: input.from,
    to: input.to,
    agentId: input.agentId,
    departmentId: input.departmentId,
    limit: input.limit,
  });
  return {
    enqueued: data?.enqueued ?? 0,
    pendingTotal: data?.pendingTotal ?? 0,
    reviews: (data?.reviews ?? [])
      .filter((row): row is Partial<QualityReviewDto> & { id: string } => Boolean(row.id))
      .map(normalizeQualityReview),
  };
}
