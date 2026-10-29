import { useSession } from "@/modules/identity/application/use-session";
import { isSupportManager } from "@/modules/identity/domain/session";
import { useState, useEffect } from "react";
import {
  MessageSquare,
  Server,
  Bot,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  Save,
  ExternalLink,
  MapPin,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ZernioSyncCard } from "./ZernioSyncCard";
import { WhatsAppChannelsCard } from "./WhatsAppChannelsCard";
import { AISettingsCard } from "./AISettingsCard";
import { CoverageSettingsCard } from "./CoverageSettingsCard";
import { NetworkSettingsCard } from "./NetworkSettingsCard";
import { settingsApi } from "../infrastructure/settings.api";
import type {
  WhatsAppChannelSettings,
  AiProviderSettings,
  SystemSetupStatus,
  TestConnectionResult,
  AiModelInfo,
  ListAiModelsResult,
} from "../domain/settings.types";
import { toast } from "sonner";

const DEFAULT_GEMINI_MODELS: ListAiModelsResult = {
  provider: "gemini",
  inferenceModels: [
    {
      id: "gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      provider: "gemini",
      type: "inference",
      tier: "balanced",
      tierLabel: "Recomendado (Rápido y Óptimo)",
      recommended: true,
      costTier: 2,
    },
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      provider: "gemini",
      type: "inference",
      tier: "balanced",
      tierLabel: "Rápido y Económico",
      costTier: 2,
    },
    {
      id: "gemini-2.0-flash-lite",
      name: "Gemini 2.0 Flash Lite",
      provider: "gemini",
      type: "inference",
      tier: "economy",
      tierLabel: "Ultra Económico (Más Barato)",
      costTier: 1,
    },
    {
      id: "gemini-1.5-flash",
      name: "Gemini 1.5 Flash",
      provider: "gemini",
      type: "inference",
      tier: "economy",
      tierLabel: "Económico (Generación anterior)",
      costTier: 1,
    },
    {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      provider: "gemini",
      type: "inference",
      tier: "performance",
      tierLabel: "Más Potente (Máximo Razonamiento)",
      costTier: 3,
    },
    {
      id: "gemini-1.5-pro",
      name: "Gemini 1.5 Pro",
      provider: "gemini",
      type: "inference",
      tier: "performance",
      tierLabel: "Alta Capacidad Analítica",
      costTier: 3,
    },
  ],
  embeddingModels: [
    {
      id: "text-embedding-004",
      name: "Text Embedding 004",
      provider: "gemini",
      type: "embedding",
      tier: "balanced",
      tierLabel: "Estándar Google (768 dims, Recomendado)",
      recommended: true,
      costTier: 1,
      defaultDimension: 768,
    },
    {
      id: "gemini-embedding-2",
      name: "Gemini Embedding 2",
      provider: "gemini",
      type: "embedding",
      tier: "specialized",
      tierLabel: "Compatibilidad (768 dims)",
      costTier: 1,
      defaultDimension: 768,
    },
    {
      id: "gemini-embedding-exp",
      name: "Gemini Embedding Exp",
      provider: "gemini",
      type: "embedding",
      tier: "specialized",
      tierLabel: "Experimental (768 dims)",
      costTier: 1,
      defaultDimension: 768,
    },
  ],
};

const DEFAULT_OLLAMA_MODELS: ListAiModelsResult = {
  provider: "ollama",
  inferenceModels: [
    {
      id: "qwen3.5:9b",
      name: "qwen3.5:9b",
      provider: "ollama",
      type: "inference",
      tier: "balanced",
      tierLabel: "Equilibrado (9.7B)",
      recommended: true,
      costTier: 2,
    },
    {
      id: "gemma4:e4b",
      name: "gemma4:e4b",
      provider: "ollama",
      type: "inference",
      tier: "balanced",
      tierLabel: "Equilibrado (7.5B)",
      costTier: 2,
    },
    {
      id: "qwen3-vl:8b",
      name: "qwen3-vl:8b",
      provider: "ollama",
      type: "inference",
      tier: "balanced",
      tierLabel: "Equilibrado (8.8B)",
      costTier: 2,
    },
  ],
  embeddingModels: [
    {
      id: "qwen3-embedding:4b",
      name: "qwen3-embedding:4b",
      provider: "ollama",
      type: "embedding",
      tier: "balanced",
      tierLabel: "Embeddings Local (2560 dims)",
      recommended: true,
      costTier: 1,
      defaultDimension: 2560,
    },
  ],
};

export function SettingsView() {
  const { session } = useSession();
  const isAdmin = session?.role === "admin";
  const defaultTab = isAdmin ? "channels" : "network";
  const [loading, setLoading] = useState(true);
  const [savingChannels, setSavingChannels] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [testingChannels, setTestingChannels] = useState(false);
  const [testingAi, setTestingAi] = useState(false);

  const [channels, setChannels] = useState<WhatsAppChannelSettings>({
    provider: "meta",
    phoneNumberId: "",
    wabaId: "",
    accessToken: "",
    appSecret: "",
    verifyToken: "",
    zernioApiKey: "",
    zernioAccountId: "",
    zernioWebhookSecret: "",
    zernioBaseUrl: "https://zernio.com/api/v1",
    messageDebounceMs: 4500,
  });

  const [ai, setAi] = useState<AiProviderSettings>({
    provider: "gemini",
    geminiApiKey: "",
    geminiModel: "gemini-2.5-flash",
    geminiEmbeddingModel: "text-embedding-004",
    geminiEmbeddingDimension: 768,
    ollamaBaseUrl: "http://localhost:11434",
    ollamaModel: "qwen3.5:4b",
    ollamaEmbeddingModel: "qwen3-embedding:4b",
    ollamaEmbeddingDimension: 2560,
    aiCallTimeoutMs: 45000,
    aiQualityTimeoutMs: 600000,
  });

  const [setupStatus, setSetupStatus] = useState<SystemSetupStatus | null>(null);
  const [channelTestResult, setChannelTestResult] = useState<TestConnectionResult | null>(null);
  const [aiTestResult, setAiTestResult] = useState<TestConnectionResult | null>(null);
  const [geminiModels, setGeminiModels] = useState<ListAiModelsResult>(DEFAULT_GEMINI_MODELS);
  const [ollamaModels, setOllamaModels] = useState<ListAiModelsResult>(DEFAULT_OLLAMA_MODELS);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [customGeminiInference, setCustomGeminiInference] = useState(false);
  const [customGeminiEmbedding, setCustomGeminiEmbedding] = useState(false);
  const [customOllamaInference, setCustomOllamaInference] = useState(false);
  const [customOllamaEmbedding, setCustomOllamaEmbedding] = useState(false);

  const selectedGeminiInference =
    geminiModels.inferenceModels.find((m: AiModelInfo) => m.id === ai.geminiModel) ||
    DEFAULT_GEMINI_MODELS.inferenceModels.find((m: AiModelInfo) => m.id === ai.geminiModel);

  const selectedOllamaInference =
    ollamaModels.inferenceModels.find((m: AiModelInfo) => m.id === ai.ollamaModel) ||
    DEFAULT_OLLAMA_MODELS.inferenceModels.find((m: AiModelInfo) => m.id === ai.ollamaModel);

  const [showMetaToken, setShowMetaToken] = useState(false);
  const [showMetaSecret, setShowMetaSecret] = useState(false);
  const [showZernioKey, setShowZernioKey] = useState(false);
  const [showZernioSecret, setShowZernioSecret] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, statusData] = await Promise.all([
        settingsApi.getSettings(),
        settingsApi.getSetupStatus(),
      ]);
      setChannels(settingsData.channels);
      setAi(settingsData.ai);
      setSetupStatus(statusData);
      if (settingsData.ai.geminiApiKey) {
        void settingsApi
          .listAiModels({ provider: "gemini", apiKey: settingsData.ai.geminiApiKey })
          .then((res) => setGeminiModels(res))
          .catch(() => {});
      }
      void settingsApi
        .listAiModels({ provider: "ollama", baseUrl: settingsData.ai.ollamaBaseUrl })
        .then((res) => setOllamaModels(res))
        .catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar configuración del sistema");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSaveChannels = async () => {
    setSavingChannels(true);
    try {
      const updated = await settingsApi.updateChannels(channels);
      setChannels(updated);
      toast.success("Configuración de canales guardada exitosamente");
      const statusData = await settingsApi.getSetupStatus();
      setSetupStatus(statusData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar canales");
    } finally {
      setSavingChannels(false);
    }
  };

  const handleSaveAi = async () => {
    setSavingAi(true);
    try {
      const updated = await settingsApi.updateAi(ai);
      setAi(updated);
      toast.success("Configuración de IA guardada exitosamente");
      const statusData = await settingsApi.getSetupStatus();
      setSetupStatus(statusData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar configuración de IA");
    } finally {
      setSavingAi(false);
    }
  };

  const handleTestChannels = async () => {
    setTestingChannels(true);
    setChannelTestResult(null);
    try {
      const res = await settingsApi.testChannels(channels);
      setChannelTestResult(res);
      if (res.ok) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fallo la prueba de conexión");
    } finally {
      setTestingChannels(false);
    }
  };

  const handleFetchAiModels = async () => {
    setFetchingModels(true);
    try {
      if (ai.provider === "gemini") {
        const res = await settingsApi.listAiModels({
          provider: "gemini",
          apiKey: ai.geminiApiKey,
        });
        setGeminiModels(res);
        toast.success(
          `Modelos de Gemini actualizados: ${res.inferenceModels.length} de inferencia y ${res.embeddingModels.length} de embeddings.`,
        );
      } else {
        const res = await settingsApi.listAiModels({
          provider: "ollama",
          baseUrl: ai.ollamaBaseUrl,
        });
        setOllamaModels(res);
        toast.success(`Modelos de Ollama detectados: ${res.inferenceModels.length} instalados.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al consultar modelos compatibles");
    } finally {
      setFetchingModels(false);
    }
  };

  const handleTestAi = async () => {
    setTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await settingsApi.testAi(ai);
      setAiTestResult(res);
      if (res.ok) {
        if (res.warning) {
          toast.warning(res.message);
        } else {
          toast.success(res.message);
        }
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fallo la prueba de IA");
    } finally {
      setTestingAi(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <RefreshCw className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando configuración del sistema...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Resumen de Estado */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Canal Activo</p>
              <h4 className="text-sm font-bold uppercase tracking-wider mt-0.5">
                {channels.provider === "meta" ? "Meta Cloud API" : "Zernio Coexistence"}
              </h4>
            </div>
            <Badge variant={setupStatus?.isChannelConfigured ? "default" : "destructive"}>
              {setupStatus?.isChannelConfigured ? "Conectado" : "Pendiente"}
            </Badge>
          </div>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Proveedor IA</p>
              <h4 className="text-sm font-bold uppercase tracking-wider mt-0.5">
                {ai.provider === "gemini" ? "Google Gemini" : "Ollama Local"}
              </h4>
            </div>
            <Badge variant={setupStatus?.isAiConfigured ? "default" : "destructive"}>
              {setupStatus?.isAiConfigured ? "Listo" : "Incompleto"}
            </Badge>
          </div>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Modelo Principal</p>
              <h4 className="text-sm font-mono font-medium truncate max-w-[140px] mt-0.5">
                {ai.provider === "gemini" ? ai.geminiModel : ai.ollamaModel}
              </h4>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {ai.provider === "gemini" ? "Cloud" : "Local"}
            </Badge>
          </div>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Estado General</p>
              <h4 className="text-sm font-bold mt-0.5">
                {setupStatus?.isInitialSetupComplete ? "Operativo 100%" : "Setup Parcial"}
              </h4>
            </div>
            <div className="flex items-center">
              {setupStatus?.isInitialSetupComplete ? (
                <CheckCircle2 className="size-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="size-5 text-amber-500" />
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs Principales de Configuración */}
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className={`grid max-w-2xl ${isAdmin ? "grid-cols-4" : "grid-cols-2"}`}>
          {isAdmin && (
            <TabsTrigger value="channels" className="gap-2">
              <MessageSquare className="size-4" />
              Canales de Mensajería
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="ai" className="gap-2">
              <Bot className="size-4" />
              Inteligencia Artificial
            </TabsTrigger>
          )}
          <TabsTrigger value="network" className="gap-2">
            <Server className="size-4" />
            Routers y OLTs
          </TabsTrigger>
          <TabsTrigger value="coverage" className="gap-2">
            <MapPin className="size-4" />
            Cobertura KML
          </TabsTrigger>
        </TabsList>

        {/* --- Pestaña: Canales de Mensajería --- */}
        <TabsContent value="channels" className="space-y-6">
          <WhatsAppChannelsCard
            channels={channels}
            setChannels={setChannels}
            handleSaveChannels={handleSaveChannels}
            savingChannels={savingChannels}
            handleTestChannels={handleTestChannels}
            testingChannels={testingChannels}
            channelTestResult={channelTestResult}
          />

          {/* Sincronización de Historial de Zernio si está activo */}
          {channels.provider === "zernio" && <ZernioSyncCard />}
        </TabsContent>

        {/* --- Pestaña: Inteligencia Artificial --- */}
        <TabsContent value="ai" className="space-y-6">
          <AISettingsCard
            ai={ai}
            setAi={setAi}
            handleSaveAi={handleSaveAi}
            savingAi={savingAi}
            handleTestAi={handleTestAi}
            testingAi={testingAi}
            aiTestResult={aiTestResult}
            geminiModels={geminiModels}
            ollamaModels={ollamaModels}
            handleFetchAiModels={handleFetchAiModels}
            fetchingModels={fetchingModels}
          />
        </TabsContent>

        {/* --- Pestaña: Infraestructura de Red (Routers y OLTs) --- */}
        <TabsContent value="network" className="space-y-6">
          <NetworkSettingsCard />
        </TabsContent>

        {/* --- Pestaña: Cobertura Geográfica (KML) --- */}
        <TabsContent value="coverage" className="space-y-6">
          <CoverageSettingsCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
