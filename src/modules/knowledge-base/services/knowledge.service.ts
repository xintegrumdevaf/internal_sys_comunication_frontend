import type {
  KnowledgeDocument,
  FaqItem,
  RagTestQueryRequest,
  RagTestQueryResponse,
  RagMetrics,
} from "../types/knowledge.types";

const API_BASE = "http://localhost:3000";

class KnowledgeService {
  async getDocuments(): Promise<KnowledgeDocument[]> {
    try {
      const res = await fetch(`${API_BASE}/api/rag/documents`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Error al obtener documentos");
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      console.error("Error cargando documentos de PostgreSQL:", e);
      return [];
    }
  }

  async uploadDocument(file: File, category: string): Promise<KnowledgeDocument> {
    const payload = {
      name: file.name,
      category: category || "General",
      mimeType: file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "application/octet-stream"),
      sizeBytes: file.size,
      uploadedBy: "Admin Sistema",
    };

    const res = await fetch(`${API_BASE}/api/rag/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("No se pudo guardar el documento en PostgreSQL");
    const json = await res.json();

    // Notificar al webhook de n8n para procesamiento de vectores si está activo
    try {
      const formData = new FormData();
      formData.append("Documentos_a_cargar", file);
      formData.append("category", category);
      void fetch("http://localhost:5678/webhook-test/cargar-documentos", {
        method: "POST",
        body: formData,
      }).catch(() => {});
    } catch {}

    return json.data;
  }

  async deleteDocument(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/rag/documents/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("No se pudo eliminar el documento de PostgreSQL");
  }

  async getFaqs(): Promise<FaqItem[]> {
    try {
      const res = await fetch(`${API_BASE}/api/rag/faqs`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Error al obtener FAQs");
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      console.error("Error cargando FAQs de PostgreSQL:", e);
      return [];
    }
  }

  async saveFaq(faq: Omit<FaqItem, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<FaqItem> {
    const res = await fetch(`${API_BASE}/api/rag/faqs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(faq),
    });
    if (!res.ok) throw new Error("Error al guardar la FAQ en PostgreSQL");
    const json = await res.json();
    return json.data;
  }

  async deleteFaq(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/rag/faqs/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Error al eliminar la FAQ de PostgreSQL");
  }

  async queryRag(request: RagTestQueryRequest): Promise<RagTestQueryResponse> {
    const res = await fetch(`${API_BASE}/api/rag/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error("Error al consultar el RAG en PostgreSQL");
    return await res.json();
  }

  async getMetrics(): Promise<RagMetrics> {
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
