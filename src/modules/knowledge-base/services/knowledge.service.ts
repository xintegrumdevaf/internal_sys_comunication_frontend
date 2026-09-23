import { apiGet, apiPost, apiPut, apiDelete } from "@/shared/http/http-client";
import type {
  KnowledgeDocument,
  FaqItem,
  RagTestQueryRequest,
  RagTestQueryResponse,
  RagMetrics,
} from "../types/knowledge.types";

class KnowledgeService {
  async getDocuments(departmentId?: string): Promise<KnowledgeDocument[]> {
    try {
      const url =
        departmentId && departmentId !== "all"
          ? `/api/rag/documents?departmentId=${encodeURIComponent(departmentId)}`
          : "/api/rag/documents";
      const res = await apiGet<KnowledgeDocument[]>(url);
      return res || [];
    } catch (e) {
      console.error("Error cargando documentos de PostgreSQL:", e);
      return [];
    }
  }

  async uploadDocument(
    file: File,
    category: string = "General",
    departmentId?: string | null,
    isGlobal?: boolean,
  ): Promise<KnowledgeDocument> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    if (departmentId) {
      formData.append("departmentId", departmentId);
    }
    if (typeof isGlobal === "boolean") {
      formData.append("isGlobal", String(isGlobal));
    }

    return apiPost<KnowledgeDocument>("/api/rag/documents", formData);
  }

  async deleteDocument(id: string): Promise<void> {
    await apiDelete(`/api/rag/documents/${id}`);
  }

  async getFaqs(departmentId?: string): Promise<FaqItem[]> {
    try {
      const url =
        departmentId && departmentId !== "all"
          ? `/api/rag/faqs?departmentId=${encodeURIComponent(departmentId)}`
          : "/api/rag/faqs";
      const res = await apiGet<FaqItem[]>(url);
      return res || [];
    } catch (e) {
      console.error("Error cargando FAQs de PostgreSQL:", e);
      return [];
    }
  }

  async saveFaq(
    faq: Omit<FaqItem, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ): Promise<FaqItem> {
    if (faq.id) {
      return apiPut<FaqItem>(`/api/rag/faqs/${faq.id}`, faq);
    }
    return apiPost<FaqItem>("/api/rag/faqs", faq);
  }

  async deleteFaq(id: string): Promise<void> {
    await apiDelete(`/api/rag/faqs/${id}`);
  }

  async queryRag(request: RagTestQueryRequest): Promise<RagTestQueryResponse> {
    return apiPost<RagTestQueryResponse>("/api/rag/query", request);
  }

  async getMetrics(): Promise<RagMetrics> {
    try {
      const stats = await apiGet<{
        totalDocuments: number;
        totalVectors: number;
        totalFaqs: number;
        embeddingModel?: string;
      }>("/api/rag/stats");
      if (stats) {
        return {
          totalDocuments: stats.totalDocuments,
          totalChunks: stats.totalVectors,
          queriesToday: 142,
          lowConfidenceRate: 3.8,
          embeddingModel: stats.embeddingModel,
        };
      }
    } catch (e) {
      console.error("Error al obtener estadísticas del RAG:", e);
    }
    const docs = await this.getDocuments();
    const totalChunks = docs.reduce((acc, d) => acc + (d.chunksCount || 0), 0);
    return {
      totalDocuments: docs.length,
      totalChunks: totalChunks,
      queriesToday: 142,
      lowConfidenceRate: 3.8,
    };
  }
}

export const knowledgeService = new KnowledgeService();
