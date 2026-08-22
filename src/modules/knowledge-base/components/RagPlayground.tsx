import { useState } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Database,
  ThumbsUp,
  ThumbsDown,
  Layers,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FileText,
} from "lucide-react";
import type { RagTestQueryResponse, RagRetrievedChunk } from "../types/knowledge.types";
import { knowledgeService } from "../services/knowledge.service";

interface MessageItem {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  ragDetails?: RagTestQueryResponse;
}

export function RagPlayground() {
  const [inputQuestion, setInputQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<RagRetrievedChunk | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "m-1",
      sender: "bot",
      text: "¡Hola! Soy el simulador del motor RAG. Hazme cualquier pregunta sobre soporte técnico, facturas o procedimientos para verificar qué información y vectores se recuperan en tiempo real.",
      timestamp: "Ahora",
    },
  ]);
  const [activeRagDetails, setActiveRagDetails] = useState<RagTestQueryResponse | null>(null);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = inputQuestion.trim();
    if (!q || loading) return;

    const userMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion("");
    setLoading(true);

    try {
      const response = await knowledgeService.queryRag({ question: q });

      const botMsg: MessageItem = {
        id: `msg-bot-${Date.now()}`,
        sender: "bot",
        text: response.answer,
        timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        ragDetails: response,
      };

      setMessages((prev) => [...prev, botMsg]);
      setActiveRagDetails(response);
      if (response.retrievedChunks.length > 0) {
        setSelectedChunk(response.retrievedChunks[0]);
      }
    } catch {
      const errorMsg: MessageItem = {
        id: `msg-err-${Date.now()}`,
        sender: "bot",
        text: "Error al consultar el flujo query-knowledge-base de n8n. Verifica la conexión con el servidor.",
        timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "¿Cuáles son los pasos si la luz PON está roja?",
    "¿Cómo consultar el saldo de una factura?",
    "¿Qué procedimientos se requieren para cambio de domicilio?",
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[550px]">
      {/* Panel Izquierdo: Chat Simulador (7 cols) */}
      <div className="lg:col-span-7 border border-border rounded-xl bg-card flex flex-col overflow-hidden shadow-sm">
        {/* Header Chat */}
        <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/15 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Simulador de Consulta RAG</h3>
              <p className="text-[11px] text-muted-foreground">
                Conectado a <code className="text-primary font-mono">query-knowledge-base</code> (n8n + PGVector)
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
            Ollama qwen3-embedding
          </span>
        </div>

        {/* Mensajes Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "bot" && (
                <div className="size-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="size-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm space-y-2 ${
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none font-medium"
                    : "bg-card border border-border text-foreground rounded-tl-none"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                {msg.ragDetails && (
                  <div className="pt-2 mt-2 border-t border-border/40 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                        <CheckCircle className="size-3" />
                        {(msg.ragDetails.confidenceScore * 100).toFixed(0)}% Confianza
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="size-3 text-muted-foreground" />
                        {msg.ragDetails.executionTimeMs}ms
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveRagDetails(msg.ragDetails ?? null)}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <Layers className="size-3" />
                      Inspeccionar Chunks ({msg.ragDetails.retrievedChunks.length})
                    </button>
                  </div>
                )}

                <div className="text-[10px] opacity-70 text-right">{msg.timestamp}</div>
              </div>

              {msg.sender === "user" && (
                <div className="size-8 rounded-full bg-muted text-foreground flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  <User className="size-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-muted-foreground text-xs p-3">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Consultando embeddings vectoriales en PGVector...</span>
            </div>
          )}
        </div>

        {/* Sugerencias de Preguntas */}
        <div className="p-2 border-t border-border bg-card/60 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap pl-2">
            Preguntas de prueba:
          </span>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputQuestion(q)}
              className="text-xs px-2.5 py-1 rounded-md bg-muted/60 hover:bg-muted text-foreground whitespace-nowrap transition-colors border border-border/50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Formulario de Entrada */}
        <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex gap-2">
          <input
            type="text"
            placeholder="Escribe una pregunta para probar la recuperación RAG..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={loading || !inputQuestion.trim()}
            className="px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="size-4" />
            Probar
          </button>
        </form>
      </div>

      {/* Panel Derecho: Inspector de Contexto y Vectores (5 cols) */}
      <div className="lg:col-span-5 border border-border rounded-xl bg-card flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
          <Database className="size-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Inspector de Vectores y Chunks</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!activeRagDetails ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
              <Layers className="size-10 text-muted-foreground/30 mb-2" />
              <p className="font-semibold text-sm">Sin inspección activa</p>
              <p className="text-xs text-muted-foreground mt-1">
                Haz una pregunta en el simulador para inspeccionar exactamente qué fragmentos vectoriales recuperó el RAG.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumen de Fuentes */}
              <div className="p-3 bg-muted/30 rounded-lg border border-border space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Documentos Origen Utilizados
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {activeRagDetails.sources.map((src, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                    >
                      <FileText className="size-3" />
                      {src}
                    </span>
                  ))}
                </div>
              </div>

              {/* Fragmentos Recuperados */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Fragmentos Vectoriales (Top-K Chunks)
                </p>

                <div className="space-y-2">
                  {activeRagDetails.retrievedChunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      onClick={() => setSelectedChunk(chunk)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedChunk?.id === chunk.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40 bg-card"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                          {chunk.sourceName}
                        </span>
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                          {(chunk.similarityScore * 100).toFixed(1)}% Coincidencia
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-3 italic">
                        "{chunk.contentSnippet}"
                      </p>

                      {chunk.pageNumber && (
                        <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                          Página {chunk.pageNumber}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones de Feedback para Entrenamiento */}
              <div className="pt-3 border-t border-border">
                <p className="text-xs font-semibold text-foreground mb-2">
                  ¿La respuesta fue precisa y contextualmente correcta?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                  >
                    <ThumbsUp className="size-3.5" />
                    Respuesta Correcta
                  </button>
                  <button
                    type="button"
                    className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-colors"
                  >
                    <ThumbsDown className="size-3.5" />
                    Requiere Ajuste
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
