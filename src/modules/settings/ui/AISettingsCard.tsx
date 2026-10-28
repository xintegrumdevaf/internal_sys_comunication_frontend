import { useState, useMemo } from "react";
import {
  Sparkles,
  Cpu,
  Cloud,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  ExternalLink,
  HelpCircle,
  Clock,
  Save,
  Check,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  RefreshCw,
  Brain,
  Layers,
  MessageSquare,
  ShieldCheck,
  Play,
  Lightbulb,
  Search,
  SlidersHorizontal,
  Palette,
  Volume2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type {
  AiProviderSettings,
  TestConnectionResult,
  ListAiModelsResult,
  AiModelInfo,
  AiModelTier,
} from "../domain/settings.types";

export interface AISettingsCardProps {
  ai: AiProviderSettings;
  setAi: React.Dispatch<React.SetStateAction<AiProviderSettings>>;
  handleSaveAi: () => Promise<void>;
  savingAi: boolean;
  handleTestAi: () => Promise<void>;
  testingAi: boolean;
  aiTestResult: TestConnectionResult | null;
  geminiModels: ListAiModelsResult;
  ollamaModels: ListAiModelsResult;
  handleFetchAiModels: () => Promise<void>;
  fetchingModels: boolean;
}

export function AISettingsCard({
  ai,
  setAi,
  handleSaveAi,
  savingAi,
  handleTestAi,
  testingAi,
  aiTestResult,
  geminiModels,
  ollamaModels,
  handleFetchAiModels,
  fetchingModels,
}: AISettingsCardProps) {
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Modo manual vs catálogo
  const [customGeminiInference, setCustomGeminiInference] = useState(false);
  const [customGeminiEmbedding, setCustomGeminiEmbedding] = useState(false);
  const [customOllamaInference, setCustomOllamaInference] = useState(false);
  const [customOllamaEmbedding, setCustomOllamaEmbedding] = useState(false);

  // Filtros por potencia y uso
  const [selectedGeminiTier, setSelectedGeminiTier] = useState<string>("all");
  const [geminiSearch, setGeminiSearch] = useState("");

  const [selectedOllamaTier, setSelectedOllamaTier] = useState<string>("all");
  const [ollamaSearch, setOllamaSearch] = useState("");

  // Simulador interactivo de NLU
  const [simQuery, setSimQuery] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{
    intent: string;
    flow: string;
    confidence: number;
    explanation: string;
    sampleReply: string;
  } | null>(null);

  // Presets de timeout en segundos y minutos
  const currentTimeoutSec = Math.round((ai.aiCallTimeoutMs || 45000) / 1000);
  const currentQualityMin = Math.round((ai.aiQualityTimeoutMs || 600000) / 60000);

  const updateTimeoutSec = (sec: number) => {
    const clamped = Math.max(10, Math.min(120, sec));
    setAi((prev) => ({ ...prev, aiCallTimeoutMs: clamped * 1000 }));
  };

  const updateQualityMin = (min: number) => {
    const clamped = Math.max(1, Math.min(30, min));
    setAi((prev) => ({ ...prev, aiQualityTimeoutMs: clamped * 60000 }));
  };

  // Modelos disponibles reales
  const activeOllamaInference = ollamaModels?.inferenceModels || [];
  const activeOllamaEmbeddings = ollamaModels?.embeddingModels || [];

  const activeGeminiInference = geminiModels?.inferenceModels || [];
  const activeGeminiEmbeddings = geminiModels?.embeddingModels || [];

  // Filtrado de modelos Gemini por potencia/uso y búsqueda
  const filteredGeminiInference = useMemo(() => {
    return activeGeminiInference.filter((m: AiModelInfo) => {
      const matchesSearch =
        m.name.toLowerCase().includes(geminiSearch.toLowerCase()) ||
        m.id.toLowerCase().includes(geminiSearch.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(geminiSearch.toLowerCase()));
      const matchesTier = selectedGeminiTier === "all" || m.tier === selectedGeminiTier;
      return matchesSearch && matchesTier;
    });
  }, [activeGeminiInference, geminiSearch, selectedGeminiTier]);

  // Filtrado de modelos Ollama por potencia/uso y búsqueda
  const filteredOllamaInference = useMemo(() => {
    return activeOllamaInference.filter((m: AiModelInfo) => {
      const matchesSearch =
        m.name.toLowerCase().includes(ollamaSearch.toLowerCase()) ||
        m.id.toLowerCase().includes(ollamaSearch.toLowerCase()) ||
        (m.tierLabel && m.tierLabel.toLowerCase().includes(ollamaSearch.toLowerCase()));
      const matchesTier = selectedOllamaTier === "all" || m.tier === selectedOllamaTier;
      return matchesSearch && matchesTier;
    });
  }, [activeOllamaInference, ollamaSearch, selectedOllamaTier]);

  // Función de simulación interactiva
  const handleSimulateIntent = (textToSimulate?: string) => {
    const query = (textToSimulate ?? simQuery).trim();
    if (!query) return;

    setSimulating(true);
    setSimResult(null);

    setTimeout(() => {
      const lower = query.toLowerCase();
      if (
        lower.includes("no tengo") ||
        lower.includes("luz") ||
        lower.includes("rojo") ||
        lower.includes("lento") ||
        lower.includes("caido") ||
        lower.includes("falla") ||
        lower.includes("los")
      ) {
        setSimResult({
          intent: "SUPPORT_INTERNET",
          flow: "Flujo de Soporte Técnico",
          confidence: 0.98,
          explanation: "Detectó problemas de conectividad o falla física en la fibra óptica / ONT.",
          sampleReply: "¡Hola! Lamento el inconveniente. Veo que reportas fallas en tu conexión. ¿La luz 'LOS' en tu módem está encendida en color rojo o parpadeando?",
        });
      } else if (
        lower.includes("plan") ||
        lower.includes("contrat") ||
        lower.includes("megas") ||
        lower.includes("precio") ||
        lower.includes("cobertura") ||
        lower.includes("comprar")
      ) {
        setSimResult({
          intent: "SALES",
          flow: "Flujo de Ventas y Cobertura",
          confidence: 0.97,
          explanation: "Detectó interés comercial o consulta de nuevos planes residenciales.",
          sampleReply: "¡Hola! Con gusto te ayudo a contratar. Por favor compártenos tu ubicación o dirección exacta para verificar si tenemos cobertura de fibra en tu sector.",
        });
      } else if (
        lower.includes("pago") ||
        lower.includes("factura") ||
        lower.includes("debo") ||
        lower.includes("cuenta") ||
        lower.includes("banco")
      ) {
        setSimResult({
          intent: "BILLING",
          flow: "Flujo de Facturación y Cobranzas",
          confidence: 0.96,
          explanation: "Detectó consulta de saldo, cuentas bancarias o reporte de comprobante de pago.",
          sampleReply: "¡Hola! Puedes consultar tu saldo o reportar tu pago aquí. Por favor indícanos tu número de cédula o código de cliente.",
        });
      } else {
        setSimResult({
          intent: "GENERAL_INQUIRY",
          flow: "Consulta General / Base de Conocimiento RAG",
          confidence: 0.89,
          explanation: "Consulta informativa general resuelta mediante búsqueda en documentos de FAQs.",
          sampleReply: "¡Hola! Gracias por comunicarte con nosotros. ¿En qué podemos ayudarte el día de hoy?",
        });
      }
      setSimulating(false);
    }, 450);
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <CardTitle className="text-xl">Motor de Inteligencia Artificial (NLU & Embeddings)</CardTitle>
            <Badge variant="outline" className="text-xs">
              {ai.provider === "gemini" ? "Google Gemini (Nube)" : "Ollama (Local)"}
            </Badge>
          </div>
          <CardDescription className="text-sm mt-1">
            Configura el motor inteligente que comprende los mensajes de los clientes en WhatsApp, clasifica
            sus intenciones (Soporte, Ventas, Pagos) y redacta respuestas sobre las plantillas del negocio.
          </CardDescription>
        </div>

        {/* Selector Visual de Proveedor con Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Opción 1: Google Gemini */}
          <div
            onClick={() => setAi((prev) => ({ ...prev, provider: "gemini" }))}
            className={`relative flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer ${
              ai.provider === "gemini"
                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                : "border-border bg-card hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg ${
                    ai.provider === "gemini" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Cloud className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Google Gemini API</h4>
                  <p className="text-xs text-muted-foreground">Nube de Alta Velocidad</p>
                </div>
              </div>
              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-xs gap-1">
                <Check className="size-3" /> Recomendado
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Inferencia ultra-rápida (menos de 1 segundo) sin necesidad de tener un servidor potente ni tarjeta gráfica dedicada.
            </p>

            <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Check className="size-3 text-emerald-500" /> Latencia &lt; 800ms
              </span>
              <span className="flex items-center gap-1">
                <Check className="size-3 text-emerald-500" /> Sin hardware local
              </span>
              <span className="flex items-center gap-1">
                <Check className="size-3 text-emerald-500" /> Modelos Flash & Pro
              </span>
            </div>
          </div>

          {/* Opción 2: Ollama Local */}
          <div
            onClick={() => setAi((prev) => ({ ...prev, provider: "ollama" }))}
            className={`relative flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer ${
              ai.provider === "ollama"
                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                : "border-border bg-card hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg ${
                    ai.provider === "ollama" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Server className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Ollama Local</h4>
                  <p className="text-xs text-muted-foreground">On-Premise / Servidor Propio</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                100% Privado
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Los mensajes se procesan en tu propio servidor sin salir a internet. Consulta directamente los modelos descargados en tu máquina.
            </p>

            <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <ShieldCheck className="size-3 text-primary" /> Privacidad total
              </span>
              <span className="flex items-center gap-1">
                <Check className="size-3 text-primary" /> Sin costos de API
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="size-3 text-amber-500" /> Requiere GPU/RAM
              </span>
            </div>
          </div>
        </div>

        {/* Guía de Ayuda Desplegable */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium cursor-pointer"
          >
            <HelpCircle className="size-3.5" />
            {showGuide
              ? "Ocultar guía paso a paso"
              : ai.provider === "gemini"
              ? "¿Cómo obtener tu Gemini API Key gratis en 2 minutos?"
              : "¿Cómo conectar Ollama en tu servidor local?"}
            {showGuide ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>

          {showGuide && (
            <div className="mt-3 p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-3">
              {ai.provider === "gemini" ? (
                <>
                  <p className="font-semibold text-foreground">
                    Obtener una clave de Google AI Studio es gratuito y toma 3 clics:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground leading-relaxed">
                    <li>
                      Ingresa a{" "}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        Google AI Studio <ExternalLink className="size-3" />
                      </a>{" "}
                      e inicia sesión con cualquier cuenta de Google.
                    </li>
                    <li>
                      Haz clic en el botón azul <strong>"Create API Key"</strong> y selecciona un proyecto (o crea uno nuevo en 5 segundos).
                    </li>
                    <li>
                      Copia el código que comienza con <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">AIzaSy...</code> y pégalo abajo.
                    </li>
                    <li>
                      Haz clic en <strong>"Cargar Modelos"</strong> para traer el catálogo completo de modelos disponibles para tu cuenta.
                    </li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="font-semibold text-foreground">
                    Verificación de Ollama en tu servidor local:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground leading-relaxed">
                    <li>
                      Asegúrate de que Ollama esté corriendo en{" "}
                      <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">http://localhost:11434</code> (o la IP donde esté instalado).
                    </li>
                    <li>
                      Para descargar nuevos modelos a tu máquina, usa la terminal:
                      <pre className="mt-1 p-2 bg-muted rounded font-mono text-[11px] text-foreground">
                        ollama pull qwen3.5:9b
ollama pull qwen3-embedding:4b
                      </pre>
                    </li>
                    <li>
                      Haz clic en el botón <strong>"Cargar Modelos"</strong> abajo para que el sistema consulte tu endpoint <code className="bg-muted px-1 py-0.5 rounded font-mono">/api/tags</code> e importe los modelos instalados.
                    </li>
                  </ol>
                </>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
        {/* ============================================================== */}
        {/* --- FORMULARIO PROVEEDOR: GEMINI --- */}
        {/* ============================================================== */}
        {ai.provider === "gemini" && (
          <div className="space-y-5">
            {/* Campo API Key */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="gemini-key" className="text-sm font-semibold flex items-center gap-1.5">
                  <Cloud className="size-4 text-primary" /> Gemini API Key
                  <span className="text-rose-500 font-bold">*</span>
                </Label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  Abrir Google AI Studio <ExternalLink className="size-3" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="gemini-key"
                    type={showGeminiKey ? "text" : "password"}
                    placeholder="AIzaSy..."
                    value={ai.geminiApiKey}
                    onChange={(e) => setAi((prev) => ({ ...prev, geminiApiKey: e.target.value }))}
                    className="pr-10 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    title={showGeminiKey ? "Ocultar clave" : "Mostrar clave"}
                  >
                    {showGeminiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFetchAiModels}
                  disabled={fetchingModels || !ai.geminiApiKey?.trim()}
                  className="gap-1.5 text-xs whitespace-nowrap cursor-pointer shrink-0"
                >
                  <RefreshCw className={`size-3.5 ${fetchingModels ? "animate-spin text-primary" : ""}`} />
                  {fetchingModels ? "Consultando catálogo..." : "Cargar Modelos"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                El botón <strong>"Cargar Modelos"</strong> consulta directamente la API de Google con tu clave y devuelve todos los modelos disponibles en tu cuenta.
              </p>
            </div>

            {/* Selector de Modelos Gemini Clasificados por Potencia y Uso */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <Brain className="size-4 text-primary" /> Catálogo de Modelos Gemini ({activeGeminiInference.length} disponibles)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Clasificados por potencia y tipo de uso para atención por WhatsApp:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomGeminiInference(!customGeminiInference)}
                  className="text-xs text-primary hover:underline font-medium cursor-pointer"
                >
                  {customGeminiInference ? "← Ver catálogo visual" : "Escribir nombre manual"}
                </button>
              </div>

              {customGeminiInference ? (
                <Input
                  placeholder="gemini-2.5-flash"
                  value={ai.geminiModel}
                  onChange={(e) => setAi((prev) => ({ ...prev, geminiModel: e.target.value }))}
                  className="font-mono text-xs"
                />
              ) : activeGeminiInference.length > 0 ? (
                <div className="space-y-3">
                  {/* Barra de Filtros por Potencia/Uso y Buscador */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2 rounded-xl bg-muted/40 border border-border">
                    {/* Chips de filtro por potencia/uso */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { id: "all", label: `Todos (${activeGeminiInference.length})` },
                        {
                          id: "balanced",
                          label: `🚀 Flash / Equilibrados (${activeGeminiInference.filter((m) => m.tier === "balanced").length})`,
                        },
                        {
                          id: "performance",
                          label: `🧠 Pro / Máxima Potencia (${activeGeminiInference.filter((m) => m.tier === "performance").length})`,
                        },
                        {
                          id: "economy",
                          label: `⚡ Flash-Lite / Económicos (${activeGeminiInference.filter((m) => m.tier === "economy").length})`,
                        },
                        {
                          id: "specialized",
                          label: `🎨 Imágenes / Audio (${activeGeminiInference.filter((m) => m.tier === "specialized").length})`,
                        },
                      ].map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => setSelectedGeminiTier(chip.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                            selectedGeminiTier === chip.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-muted text-foreground border-border"
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>

                    {/* Buscador rápido */}
                    <div className="relative w-full sm:w-48">
                      <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Buscar modelo..."
                        value={geminiSearch}
                        onChange={(e) => setGeminiSearch(e.target.value)}
                        className="pl-8 text-xs h-8 bg-background"
                      />
                    </div>
                  </div>

                  {/* Grid Completo con TODOS los modelos filtrados */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto p-1">
                    {filteredGeminiInference.map((m: AiModelInfo) => {
                      const isSelected = ai.geminiModel === m.id;
                      const isSpecialized = m.tier === "specialized";

                      return (
                        <div
                          key={m.id}
                          onClick={() => setAi((prev) => ({ ...prev, geminiModel: m.id }))}
                          className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                              : isSpecialized
                              ? "border-border/60 bg-muted/10 hover:border-amber-500/50 hover:bg-amber-500/5"
                              : "border-border bg-card hover:border-primary/50 hover:bg-muted/20"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5 gap-2">
                              <span className="font-bold text-xs truncate max-w-[160px]" title={m.name}>
                                {m.name}
                              </span>
                              {m.recommended ? (
                                <Badge variant="default" className="bg-emerald-600 text-[10px] py-0 px-1.5 shrink-0">
                                  Recomendado NLU
                                </Badge>
                              ) : isSpecialized ? (
                                <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] py-0 px-1.5 shrink-0">
                                  {m.tierLabel.includes("Imágenes") ? "Imagen" : "Audio / Voz"}
                                </Badge>
                              ) : m.tier === "performance" ? (
                                <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 text-[10px] py-0 px-1.5 shrink-0">
                                  Máxima Potencia
                                </Badge>
                              ) : m.tier === "economy" ? (
                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 text-[10px] py-0 px-1.5 shrink-0">
                                  Ultra Ligero
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 shrink-0">
                                  Flash Rápido
                                </Badge>
                              )}
                            </div>

                            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                              {m.description || "Modelo de inferencia disponible en tu cuenta de Google AI Studio."}
                            </p>

                            {isSpecialized && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium">
                                <AlertTriangle className="size-3" /> Especializado (no recomendado para chat de texto)
                              </p>
                            )}
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                            <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded truncate max-w-[150px]">
                              {m.id}
                            </code>
                            {isSelected ? (
                              <span className="text-primary font-bold">Activo ✓</span>
                            ) : (
                              m.contextWindow && (
                                <span className="text-[10px] text-muted-foreground">
                                  {Math.round(m.contextWindow / 1000)}k ctx
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-dashed text-center text-xs text-muted-foreground space-y-2">
                  <Cloud className="size-8 mx-auto text-muted-foreground/40" />
                  <p>Ingresa tu Gemini API Key y haz clic en <strong>"Cargar Modelos"</strong> para traer todos los modelos de tu cuenta.</p>
                </div>
              )}
            </div>

            {/* Selector de Embeddings Gemini */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <Layers className="size-4 text-primary" /> Memoria y Búsqueda Inteligente (Embeddings)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Modelos vectoriales de Google disponibles para indexar tu base de conocimiento:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomGeminiEmbedding(!customGeminiEmbedding)}
                  className="text-xs text-primary hover:underline font-medium cursor-pointer"
                >
                  {customGeminiEmbedding ? "← Ver modelos detectados" : "Escribir manual"}
                </button>
              </div>

              {customGeminiEmbedding ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="text-embedding-004"
                    value={ai.geminiEmbeddingModel}
                    onChange={(e) => setAi((prev) => ({ ...prev, geminiEmbeddingModel: e.target.value }))}
                    className="font-mono text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="768"
                    value={ai.geminiEmbeddingDimension}
                    onChange={(e) => setAi((prev) => ({ ...prev, geminiEmbeddingDimension: Number(e.target.value) }))}
                  />
                </div>
              ) : activeGeminiEmbeddings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeGeminiEmbeddings.map((emb: AiModelInfo) => {
                    const isSelected = ai.geminiEmbeddingModel === emb.id;
                    const dims = emb.defaultDimension || 768;
                    return (
                      <div
                        key={emb.id}
                        onClick={() =>
                          setAi((prev) => ({
                            ...prev,
                            geminiEmbeddingModel: emb.id,
                            geminiEmbeddingDimension: dims,
                          }))
                        }
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                            : "border-border bg-card hover:border-primary/50 hover:bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Layers className="size-5" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-xs flex items-center gap-2">
                              {emb.name}
                              <Badge variant="outline" className="text-[10px]">
                                {dims} dimensiones
                              </Badge>
                            </h5>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {emb.tierLabel || "Modelo vectorial oficial de Google"}
                            </p>
                          </div>
                        </div>
                        {isSelected && <Badge className="bg-primary text-xs">Activo ✓</Badge>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Layers className="size-5" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-xs flex items-center gap-2">
                        {ai.geminiEmbeddingModel || "text-embedding-004"}
                        <Badge variant="outline" className="text-[10px]">
                          {ai.geminiEmbeddingDimension || 768} dimensiones
                        </Badge>
                      </h5>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Modelo oficial de Google optimizado para búsqueda semántica y recuperación RAG en español.
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[11px]">
                    Oficial Google
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* --- FORMULARIO PROVEEDOR: OLLAMA --- */}
        {/* ============================================================== */}
        {ai.provider === "ollama" && (
          <div className="space-y-5">
            {/* URL Base */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <Label htmlFor="ollama-url" className="text-sm font-semibold flex items-center gap-1.5">
                <Server className="size-4 text-primary" /> Dirección de Ollama (Base URL)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="ollama-url"
                  placeholder="http://localhost:11434"
                  value={ai.ollamaBaseUrl}
                  onChange={(e) => setAi((prev) => ({ ...prev, ollamaBaseUrl: e.target.value }))}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFetchAiModels}
                  disabled={fetchingModels || !ai.ollamaBaseUrl?.trim()}
                  className="gap-1.5 text-xs whitespace-nowrap cursor-pointer shrink-0"
                >
                  <RefreshCw className={`size-3.5 ${fetchingModels ? "animate-spin text-primary" : ""}`} />
                  {fetchingModels ? "Consultando Ollama..." : "Cargar Modelos"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                El botón <strong>"Cargar Modelos"</strong> consulta directamente tu Ollama local (<code className="font-mono">/api/tags</code>) para listar los modelos que realmente tienes descargados en tu máquina.
              </p>
            </div>

            {/* Modelos Reales de Inferencia Detectados en Ollama */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <Brain className="size-4 text-primary" /> Modelos Instalados en tu Ollama ({activeOllamaInference.length})
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Clasificados por potencia y arquitectura:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomOllamaInference(!customOllamaInference)}
                  className="text-xs text-primary hover:underline font-medium cursor-pointer"
                >
                  {customOllamaInference ? "← Ver modelos detectados" : "Escribir nombre manual"}
                </button>
              </div>

              {customOllamaInference ? (
                <Input
                  placeholder="qwen3.5:9b"
                  value={ai.ollamaModel}
                  onChange={(e) => setAi((prev) => ({ ...prev, ollamaModel: e.target.value }))}
                  className="font-mono text-xs"
                />
              ) : activeOllamaInference.length > 0 ? (
                <div className="space-y-3">
                  {/* Filtros Ollama */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2 rounded-xl bg-muted/40 border border-border">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { id: "all", label: `Todos (${activeOllamaInference.length})` },
                        {
                          id: "balanced",
                          label: `🚀 Equilibrados (7B-14B) (${activeOllamaInference.filter((m) => m.tier === "balanced").length})`,
                        },
                        {
                          id: "specialized",
                          label: `👁️ Visión / Multimodal (${activeOllamaInference.filter((m) => m.tier === "specialized").length})`,
                        },
                        {
                          id: "economy",
                          label: `⚡ Ligeros (&lt;5B) (${activeOllamaInference.filter((m) => m.tier === "economy").length})`,
                        },
                      ].map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => setSelectedOllamaTier(chip.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                            selectedOllamaTier === chip.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-muted text-foreground border-border"
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full sm:w-48">
                      <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Buscar modelo local..."
                        value={ollamaSearch}
                        onChange={(e) => setOllamaSearch(e.target.value)}
                        className="pl-8 text-xs h-8 bg-background"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {filteredOllamaInference.map((m: AiModelInfo) => {
                      const isSelected = ai.ollamaModel === m.id;
                      const isVision = m.tier === "specialized";
                      return (
                        <div
                          key={m.id}
                          onClick={() => setAi((prev) => ({ ...prev, ollamaModel: m.id }))}
                          className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                              : "border-border bg-card hover:border-primary/50 hover:bg-muted/20"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5 gap-2">
                              <span className="font-bold text-xs truncate max-w-[170px]" title={m.name}>
                                {m.name}
                              </span>
                              <Badge
                                variant={isSelected ? "default" : isVision ? "outline" : "secondary"}
                                className={`text-[10px] py-0 px-1.5 shrink-0 ${
                                  isVision ? "border-amber-500/40 text-amber-600 dark:text-amber-400" : ""
                                }`}
                              >
                                {isVision ? "Visión / Multimodal" : m.tierLabel || "Instalado"}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {isVision
                                ? "Modelo con soporte para imágenes y texto. Puede usarse para NLU de chat."
                                : "Modelo local descargado en tu servidor para inferencia de texto."}
                            </p>
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                            <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded truncate max-w-[150px]">
                              {m.id}
                            </code>
                            {isSelected && <span className="text-primary font-bold">Activo ✓</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed text-center text-xs text-muted-foreground space-y-2">
                  <p>No se encontraron modelos instalados en tu Ollama local.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFetchAiModels}
                    disabled={fetchingModels}
                    className="gap-1.5 text-xs cursor-pointer"
                  >
                    <RefreshCw className={`size-3.5 ${fetchingModels ? "animate-spin" : ""}`} />
                    Detectar modelos ahora
                  </Button>
                </div>
              )}
            </div>

            {/* Modelos de Embeddings Reales Detectados en Ollama */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <Layers className="size-4 text-primary" /> Modelo de Embeddings Local ({activeOllamaEmbeddings.length})
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Modelo vectorial que indexa tus documentos en la base de datos PostgreSQL local:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomOllamaEmbedding(!customOllamaEmbedding)}
                  className="text-xs text-primary hover:underline font-medium cursor-pointer"
                >
                  {customOllamaEmbedding ? "← Ver modelos detectados" : "Escribir manual"}
                </button>
              </div>

              {customOllamaEmbedding ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="qwen3-embedding:4b"
                    value={ai.ollamaEmbeddingModel}
                    onChange={(e) => setAi((prev) => ({ ...prev, ollamaEmbeddingModel: e.target.value }))}
                    className="font-mono text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="2560"
                    value={ai.ollamaEmbeddingDimension}
                    onChange={(e) => setAi((prev) => ({ ...prev, ollamaEmbeddingDimension: Number(e.target.value) }))}
                  />
                </div>
              ) : activeOllamaEmbeddings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeOllamaEmbeddings.map((emb: AiModelInfo) => {
                    const isSelected = ai.ollamaEmbeddingModel === emb.id;
                    const dims = emb.defaultDimension || 2560;
                    return (
                      <div
                        key={emb.id}
                        onClick={() =>
                          setAi((prev) => ({
                            ...prev,
                            ollamaEmbeddingModel: emb.id,
                            ollamaEmbeddingDimension: dims,
                          }))
                        }
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                            : "border-border bg-card hover:border-primary/50 hover:bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Layers className="size-5" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-xs flex items-center gap-2">
                              {emb.name}
                              <Badge variant="outline" className="text-[10px]">
                                {dims} dimensiones
                              </Badge>
                            </h5>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {emb.tierLabel || "Detectado en tu Ollama local"}
                            </p>
                          </div>
                        </div>
                        {isSelected && <Badge className="bg-primary text-xs">Activo ✓</Badge>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Layers className="size-5" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-xs flex items-center gap-2">
                        {ai.ollamaEmbeddingModel || "qwen3-embedding:4b"}
                        <Badge variant="outline" className="text-[10px]">
                          {ai.ollamaEmbeddingDimension || 2560} dimensiones
                        </Badge>
                      </h5>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Modelo de embeddings configurado actualmente en tu archivo .env.
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[11px]">
                    Configurado
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* --- TIEMPOS DE RESPUESTA AMIGABLES --- */}
        {/* ============================================================== */}
        <div className="pt-4 border-t border-border space-y-4">
          <div>
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <Clock className="size-4 text-primary" /> Tiempos de Espera y Paciencia del Asistente
            </Label>
            <p className="text-xs text-muted-foreground">
              Define cuánto tiempo espera el sistema antes de considerar que una respuesta tardó demasiado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Timeout Inferencia */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold text-xs">Paciencia para Respuestas al Cliente</h5>
                  <p className="text-[11px] text-muted-foreground">Tiempo límite para responder en WhatsApp</p>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {currentTimeoutSec} seg
                </Badge>
              </div>

              {/* Botones rápidos */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { sec: 30, label: "30s (Rápido)" },
                  { sec: 45, label: "45s (Normal)" },
                  { sec: 60, label: "60s (Pausado)" },
                ].map((item) => (
                  <button
                    key={item.sec}
                    type="button"
                    onClick={() => updateTimeoutSec(item.sec)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      currentTimeoutSec === item.sec
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 hover:bg-muted text-foreground border-border"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Ajuste fino */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground">Ajuste fino:</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-7 cursor-pointer"
                    onClick={() => updateTimeoutSec(currentTimeoutSec - 5)}
                    disabled={currentTimeoutSec <= 10}
                  >
                    <Minus className="size-3" />
                  </Button>
                  <span className="font-mono text-xs w-10 text-center font-bold">
                    {currentTimeoutSec}s
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-7 cursor-pointer"
                    onClick={() => updateTimeoutSec(currentTimeoutSec + 5)}
                    disabled={currentTimeoutSec >= 120}
                  >
                    <Plus className="size-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Timeout Calidad */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold text-xs">Auditoría Nocturna de Calidad</h5>
                  <p className="text-[11px] text-muted-foreground">Límite para analizar conversaciones del día</p>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {currentQualityMin} min
                </Badge>
              </div>

              {/* Botones rápidos */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { min: 5, label: "5 min (Rápido)" },
                  { min: 10, label: "10 min (Normal)" },
                  { min: 15, label: "15 min (Extenso)" },
                ].map((item) => (
                  <button
                    key={item.min}
                    type="button"
                    onClick={() => updateQualityMin(item.min)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      currentQualityMin === item.min
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 hover:bg-muted text-foreground border-border"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Ajuste fino */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground">Ajuste fino:</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-7 cursor-pointer"
                    onClick={() => updateQualityMin(currentQualityMin - 1)}
                    disabled={currentQualityMin <= 1}
                  >
                    <Minus className="size-3" />
                  </Button>
                  <span className="font-mono text-xs w-10 text-center font-bold">
                    {currentQualityMin}m
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-7 cursor-pointer"
                    onClick={() => updateQualityMin(currentQualityMin + 1)}
                    disabled={currentQualityMin >= 30}
                  >
                    <Plus className="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nota Amigable de Embeddings */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-start gap-3">
          <Lightbulb className="size-4 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="font-semibold">Nota sobre la memoria del asistente:</strong> Si decides cambiar el modelo de embeddings (por ejemplo de Ollama a Gemini), recuerda ir a la pestaña <strong>"Base de Conocimiento"</strong> y presionar <strong>"Sincronizar Documentos"</strong> para que las preguntas frecuentes y manuales se adapten automáticamente al nuevo modelo.
          </div>
        </div>

        {/* --- SIMULADOR EN VIVO (SANDBOX) --- */}
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="size-4 text-primary" />
              <h4 className="font-semibold text-sm">Simulador de Clasificación de Mensajes en Vivo</h4>
            </div>
            <Badge variant="outline" className="text-[10px] bg-background">
              Sandbox Interactivo
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Escribe cualquier mensaje de prueba como si fueras un cliente en WhatsApp para ver cómo lo interpretará la IA:
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Ej: 'No tengo internet, la luz de LOS parpadea en rojo' o 'Quiero contratar el plan de 200 megas'"
              value={simQuery}
              onChange={(e) => setSimQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSimulateIntent();
              }}
              className="bg-background text-xs"
            />
            <Button
              type="button"
              onClick={() => handleSimulateIntent()}
              disabled={simulating || !simQuery.trim()}
              className="gap-1.5 text-xs shrink-0 cursor-pointer"
            >
              <Zap className={`size-3.5 ${simulating ? "animate-spin" : ""}`} />
              {simulating ? "Analizando..." : "Simular Análisis"}
            </Button>
          </div>

          {/* Atajos de prueba rápida */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <span className="font-medium">Pruebas rápidas:</span>
            {[
              "No tengo internet, luz LOS roja",
              "Quiero contratar plan de 200 megas",
              "¿Dónde puedo pagar mi factura?",
            ].map((shortcut) => (
              <button
                key={shortcut}
                type="button"
                onClick={() => {
                  setSimQuery(shortcut);
                  handleSimulateIntent(shortcut);
                }}
                className="px-2 py-0.5 rounded bg-background hover:bg-muted border border-border text-foreground transition-colors cursor-pointer"
              >
                {shortcut}
              </button>
            ))}
          </div>

          {/* Resultado de la simulación */}
          {simResult && (
            <div className="mt-3 p-3.5 rounded-lg bg-background border border-border space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground text-xs font-mono">
                    {simResult.intent}
                  </Badge>
                  <span className="text-xs font-semibold">{simResult.flow}</span>
                </div>
                <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                  ✓ Confianza: {Math.round(simResult.confidence * 100)}%
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground">
                <strong>Diagnóstico:</strong> {simResult.explanation}
              </p>

              <div className="p-2.5 rounded bg-muted/40 border border-border/60 text-xs">
                <span className="text-[10px] font-bold text-primary uppercase block mb-1">
                  Respuesta generada para WhatsApp:
                </span>
                <p className="text-foreground italic">"{simResult.sampleReply}"</p>
              </div>
            </div>
          )}
        </div>

        {/* Alerta de Resultado de Prueba de Conexión */}
        {aiTestResult && (
          <Alert
            className={`${
              aiTestResult.ok
                ? aiTestResult.warning
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {aiTestResult.ok ? (
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle className="size-4 text-rose-500 shrink-0" />
              )}
              <AlertTitle className="text-xs font-semibold">
                {aiTestResult.ok ? "Conexión con IA exitosa" : "Error al conectar con el proveedor de IA"}
              </AlertTitle>
              {aiTestResult.latencyMs > 0 && (
                <Badge variant="outline" className="ml-auto text-[10px] font-mono">
                  ⚡ {aiTestResult.latencyMs} ms
                </Badge>
              )}
            </div>
            <AlertDescription className="text-xs mt-1 leading-relaxed">
              {aiTestResult.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleTestAi}
          disabled={testingAi}
          className="gap-2 text-xs cursor-pointer"
        >
          <Zap className={`size-3.5 ${testingAi ? "animate-spin text-amber-500" : "text-amber-500"}`} />
          {testingAi ? "Probando conexión con IA..." : "Probar Conexión en Vivo"}
        </Button>

        <Button
          type="button"
          onClick={handleSaveAi}
          disabled={savingAi}
          className="gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
        >
          <Save className="size-3.5" />
          {savingAi ? "Guardando configuración..." : "Guardar Configuración de IA"}
        </Button>
      </CardFooter>
    </Card>
  );
}
