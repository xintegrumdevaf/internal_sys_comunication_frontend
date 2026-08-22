export type KnowledgeStatus = "processed" | "processing" | "error" | "pending";

export interface KnowledgeDocument {
  id: string;
  name: string;
  category: string;
  mimeType: string;
  sizeBytes: number;
  status: KnowledgeStatus;
  chunksCount: number;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  sourceUrl?: string;
  errorMessage?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  variations: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RagRetrievedChunk {
  id: string;
  sourceName: string;
  pageNumber?: number;
  contentSnippet: string;
  similarityScore: number; // e.g. 0.88 (88%)
}

export interface RagTestQueryRequest {
  question: string;
  departmentId?: string;
  topK?: number;
}

export interface RagTestQueryResponse {
  answer: string;
  found: boolean;
  confidenceScore: number;
  sources: string[];
  retrievedChunks: RagRetrievedChunk[];
  executionTimeMs: number;
}

export interface RagMetrics {
  totalDocuments: number;
  totalChunks: number;
  queriesToday: number;
  lowConfidenceRate: number; // e.g. 4.2%
}
