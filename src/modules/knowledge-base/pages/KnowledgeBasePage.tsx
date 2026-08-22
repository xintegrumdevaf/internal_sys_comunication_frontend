import { useState, useEffect } from "react";
import {
  BrainCircuit,
  FileText,
  HelpCircle,
  Sparkles,
  BarChart3,
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { AppShell, StatCard } from "@/app/shell/AppShell";
import { KnowledgeSourcesTable } from "../components/KnowledgeSourcesTable";
import { UploadModal } from "../components/UploadModal";
import { RagPlayground } from "../components/RagPlayground";
import { FaqDirectEditor } from "../components/FaqDirectEditor";
import { knowledgeService } from "../services/knowledge.service";
import type { KnowledgeDocument, FaqItem, RagMetrics } from "../types/knowledge.types";
import { toast } from "sonner";

export function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState<"sources" | "faqs" | "playground" | "metrics">("sources");
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [metrics, setMetrics] = useState<RagMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsData, faqsData, metricsData] = await Promise.all([
        knowledgeService.getDocuments(),
        knowledgeService.getFaqs(),
        knowledgeService.getMetrics(),
      ]);
      setDocuments(docsData);
      setFaqs(faqsData);
      setMetrics(metricsData);
    } catch (e) {
      toast.error("Error al cargar la información de la Base de Conocimiento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleUploadDocument = async (file: File, category: string) => {
    try {
      const newDoc = await knowledgeService.uploadDocument(file, category);
      setDocuments((prev) => [newDoc, ...prev]);
      toast.success(`Documento ${file.name} cargado e indexado correctamente`);
      void loadData();
    } catch (err) {
      toast.error("Error al vectorizar el documento en n8n");
      throw err;
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await knowledgeService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast.success("Documento eliminado de la base de conocimiento");
      void loadData();
    } catch {
      toast.error("No se pudo eliminar el documento");
    }
  };

  const handleSaveFaq = async (faqData: Omit<FaqItem, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
    try {
      await knowledgeService.saveFaq(faqData);
      toast.success("Pregunta frecuente guardada");
      void loadData();
    } catch {
      toast.error("Error al guardar la pregunta frecuente");
    }
  };

  const handleDeleteFaq = async (id: string) => {
    try {
      await knowledgeService.deleteFaq(id);
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      toast.success("Pregunta frecuente eliminada");
      void loadData();
    } catch {
      toast.error("No se pudo eliminar la pregunta frecuente");
    }
  };

  return (
    <AppShell title="Base de Conocimiento & Entrenamiento RAG" icon={BrainCircuit}>
      <div className="space-y-6">
        {/* KPI Stats Top Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Documentos Indexados"
            value={metrics?.totalDocuments.toString() || "0"}
            unit="archivos"
            hint="Archivos PDF / DOCX activos en RAG"
          />
          <StatCard
            label="Vectores Generados"
            value={metrics?.totalChunks.toString() || "0"}
            unit="chunks"
            hint="Almacenados en PGVector (PostgreSQL)"
            tone="success"
          />
          <StatCard
            label="Consultas RAG Hoy"
            value={metrics?.queriesToday.toString() || "0"}
            unit="preguntas"
            hint="Vía webhooks n8n y WhatsApp"
          />
          <StatCard
            label="Modelo de Embeddings"
            value="Ollama"
            unit="qwen3-4b"
            hint="Motor PGVector + n8n activo"
          />
        </div>

        {/* Custom Navigation Tabs */}
        <div className="border-b border-border flex gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("sources")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "sources"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="size-4" />
            Fuentes y Documentos ({documents.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("faqs")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "faqs"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <HelpCircle className="size-4" />
            FAQs y Contenido Directo ({faqs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("playground")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "playground"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="size-4 text-amber-400" />
            🧪 RAG Playground (Simulador en Vivo)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("metrics")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "metrics"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="size-4" />
            📊 Métricas de Entrenamiento
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "sources" && (
          <KnowledgeSourcesTable
            documents={documents}
            onUploadClick={() => setIsUploadOpen(true)}
            onDeleteDoc={handleDeleteDocument}
            onRefresh={loadData}
            loading={loading}
          />
        )}

        {activeTab === "faqs" && (
          <FaqDirectEditor faqs={faqs} onSaveFaq={handleSaveFaq} onDeleteFaq={handleDeleteFaq} />
        )}

        {activeTab === "playground" && <RagPlayground />}

        {activeTab === "metrics" && (
          <div className="p-6 border border-border rounded-xl bg-card space-y-6">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" />
              Salud y Desempeño de la Base de Conocimiento RAG
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-border rounded-lg bg-background space-y-2">
                <p className="text-xs font-bold uppercase text-muted-foreground">Tasa de Respuestas Exitosas</p>
                <p className="text-3xl font-extrabold text-emerald-400 font-mono">96.2%</p>
                <p className="text-xs text-muted-foreground">Consultas con similitud vectorial &gt; 70%</p>
              </div>

              <div className="p-4 border border-border rounded-lg bg-background space-y-2">
                <p className="text-xs font-bold uppercase text-muted-foreground">Tiempo Promedio de Respuesta</p>
                <p className="text-3xl font-extrabold text-foreground font-mono">420ms</p>
                <p className="text-xs text-muted-foreground">Búsqueda PGVector + n8n webhook</p>
              </div>

              <div className="p-4 border border-border rounded-lg bg-background space-y-2">
                <p className="text-xs font-bold uppercase text-muted-foreground">Consultas de Baja Confianza</p>
                <p className="text-3xl font-extrabold text-amber-400 font-mono">3.8%</p>
                <p className="text-xs text-muted-foreground">Revisión recomendada para entrenamiento</p>
              </div>
            </div>

            <div className="p-4 border border-border/80 rounded-lg bg-muted/20 space-y-3">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-400" />
                Recomendaciones de Entrenamiento Continuo
              </h4>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
                <li>
                  Se detectaron 5 consultas sobre <strong className="text-foreground">"descuentos por pronto pago"</strong> con bajo puntaje de coincidencia. Se sugiere agregar un PDF o FAQ directa con esta política.
                </li>
                <li>
                  El manual <strong className="text-foreground">Manual_Soporte_Tecnico_FTTH_v3.pdf</strong> genera el 62% de los fragmentos recuperados en casos de soporte.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Modal de Carga */}
        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={handleUploadDocument}
        />
      </div>
    </AppShell>
  );
}
