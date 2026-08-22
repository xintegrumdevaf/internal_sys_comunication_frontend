import { useState } from "react";
import {
  FileText,
  Trash2,
  RefreshCw,
  Search,
  Plus,
  FileCode,
  Globe,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import type { KnowledgeDocument } from "../types/knowledge.types";

interface KnowledgeSourcesTableProps {
  documents: KnowledgeDocument[];
  onUploadClick: () => void;
  onDeleteDoc: (id: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export function KnowledgeSourcesTable({
  documents,
  onUploadClick,
  onDeleteDoc,
  onRefresh,
  loading = false,
}: KnowledgeSourcesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = Array.from(new Set(documents.map((d) => d.category)));

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: KnowledgeDocument["status"]) => {
    switch (status) {
      case "processed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="size-3" />
            Vectorizado
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20 animate-pulse">
            <Clock className="size-3 animate-spin" />
            Indexando...
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/20">
            <AlertCircle className="size-3" />
            Error Ingesta
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
            Pendiente
          </span>
        );
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) {
      return <FileText className="size-5 text-rose-400 shrink-0" />;
    }
    if (mimeType.includes("word") || mimeType.includes("document")) {
      return <FileCode className="size-5 text-blue-400 shrink-0" />;
    }
    return <Globe className="size-5 text-emerald-400 shrink-0" />;
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar documento por nombre, categoría o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-muted-foreground hover:text-foreground border border-border bg-card rounded-lg hover:bg-muted/20 transition-colors"
            title="Refrescar lista"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <button
          type="button"
          onClick={onUploadClick}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="size-4" />
          Cargar Documento PDF / URL
        </button>
      </div>

      {/* Documents Table */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3.5">Documento</th>
                <th className="px-4 py-3.5">Categoría</th>
                <th className="px-4 py-3.5">Estado Vectorial</th>
                <th className="px-4 py-3.5 text-center">Chunks Vectorizados</th>
                <th className="px-4 py-3.5">Cargado Por</th>
                <th className="px-4 py-3.5">Fecha</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="size-10 text-muted-foreground/40" />
                      <p className="font-medium">No se encontraron documentos en la base de conocimiento.</p>
                      <p className="text-xs text-muted-foreground">
                        Haz clic en "Cargar Documento" para alimentar al RAG.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.mimeType)}
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-[280px]" title={doc.name}>
                            {doc.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">{formatFileSize(doc.sizeBytes)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-foreground border border-border">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(doc.status)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                        {doc.chunksCount} chunks
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{doc.uploadedBy}</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {doc.sourceUrl && (
                          <a
                            href={doc.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/40 transition-colors"
                            title="Ver enlace de origen"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteDoc(doc.id)}
                          className="p-1.5 text-muted-foreground hover:text-rose-400 rounded-md hover:bg-rose-500/10 transition-colors"
                          title="Eliminar documento del RAG"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
