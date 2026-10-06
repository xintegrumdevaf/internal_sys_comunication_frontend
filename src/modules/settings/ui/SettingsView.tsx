import { useState, useEffect } from "react";
import {
  MessageSquare,
  Bot,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  Save,
  ExternalLink,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ZernioSyncCard } from "./ZernioSyncCard";
import { settingsApi } from "../infrastructure/settings.api";
import type {
  WhatsAppChannelSettings,
  AiProviderSettings,
  SystemSetupStatus,
  TestConnectionResult,
} from "../domain/settings.types";
import { toast } from "sonner";

export function SettingsView() {
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
      <Tabs defaultValue="channels" className="space-y-6">
        <TabsList className="grid grid-cols-2 max-w-md">
          <TabsTrigger value="channels" className="gap-2">
            <MessageSquare className="size-4" />
            Canales de Mensajería
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Bot className="size-4" />
            Inteligencia Artificial
          </TabsTrigger>
        </TabsList>

        {/* --- Pestaña: Canales de Mensajería --- */}
        <TabsContent value="channels" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Configuración de Canal de WhatsApp</CardTitle>
                  <CardDescription>
                    Seleccioná y configurá el proveedor para la recepción y emisión de mensajes en
                    tiempo real.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={channels.provider === "meta" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChannels({ ...channels, provider: "meta" })}
                  >
                    Meta Cloud API Directo
                  </Button>
                  <Button
                    type="button"
                    variant={channels.provider === "zernio" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChannels({ ...channels, provider: "zernio" })}
                  >
                    Zernio (Coexistencia)
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {channels.provider === "meta" ? (
                <div className="space-y-4">
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-xs text-muted-foreground flex items-center justify-between">
                    <span>
                      Conexión directa con la API oficial de WhatsApp Business Cloud (sin
                      intermediarios).
                    </span>
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      Meta Developer Portal <ExternalLink className="size-3" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="meta-phone-id">Phone Number ID</Label>
                      <Input
                        id="meta-phone-id"
                        placeholder="Ej: 109876543210987"
                        value={channels.phoneNumberId}
                        onChange={(e) =>
                          setChannels({ ...channels, phoneNumberId: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="meta-waba-id">WABA ID (WhatsApp Business Account ID)</Label>
                      <Input
                        id="meta-waba-id"
                        placeholder="Ej: 987654321098765"
                        value={channels.wabaId}
                        onChange={(e) => setChannels({ ...channels, wabaId: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="meta-token">Access Token de Sistema (Permanente)</Label>
                    <div className="relative">
                      <Input
                        id="meta-token"
                        type={showMetaToken ? "text" : "password"}
                        placeholder="EAAG..."
                        value={channels.accessToken}
                        onChange={(e) => setChannels({ ...channels, accessToken: e.target.value })}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMetaToken(!showMetaToken)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showMetaToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="meta-secret">
                        App Secret (para firma sha256 de webhooks)
                      </Label>
                      <div className="relative">
                        <Input
                          id="meta-secret"
                          type={showMetaSecret ? "text" : "password"}
                          placeholder="••••••••"
                          value={channels.appSecret}
                          onChange={(e) => setChannels({ ...channels, appSecret: e.target.value })}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowMetaSecret(!showMetaSecret)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                          {showMetaSecret ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="meta-verify">Verify Token de Webhook</Label>
                      <Input
                        id="meta-verify"
                        placeholder="Token personalizado de verificación"
                        value={channels.verifyToken}
                        onChange={(e) => setChannels({ ...channels, verifyToken: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-xs text-muted-foreground flex items-center justify-between">
                    <span>
                      Conexión mediante Zernio con soporte de coexistencia móvil y webhooks en vivo.
                    </span>
                    <a
                      href="https://zernio.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      Consola Zernio <ExternalLink className="size-3" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="zernio-account-id">Zernio Account ID</Label>
                      <Input
                        id="zernio-account-id"
                        placeholder="Ej: 6a9ec34a77555aae01ec0fde"
                        value={channels.zernioAccountId}
                        onChange={(e) =>
                          setChannels({ ...channels, zernioAccountId: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="zernio-base-url">Zernio API Base URL</Label>
                      <Input
                        id="zernio-base-url"
                        placeholder="https://zernio.com/api/v1"
                        value={channels.zernioBaseUrl}
                        onChange={(e) =>
                          setChannels({ ...channels, zernioBaseUrl: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="zernio-key">Zernio API Key</Label>
                    <div className="relative">
                      <Input
                        id="zernio-key"
                        type={showZernioKey ? "text" : "password"}
                        placeholder="••••••••"
                        value={channels.zernioApiKey}
                        onChange={(e) => setChannels({ ...channels, zernioApiKey: e.target.value })}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowZernioKey(!showZernioKey)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showZernioKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="zernio-secret">Zernio Webhook Secret</Label>
                    <div className="relative">
                      <Input
                        id="zernio-secret"
                        type={showZernioSecret ? "text" : "password"}
                        placeholder="••••••••"
                        value={channels.zernioWebhookSecret}
                        onChange={(e) =>
                          setChannels({ ...channels, zernioWebhookSecret: e.target.value })
                        }
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowZernioSecret(!showZernioSecret)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showZernioSecret ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Parámetros Operativos del Buffer / Debounce */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="message-debounce" className="text-sm font-semibold">
                      Tiempo de Espera para Agrupación de Mensajes (Debounce)
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tiempo que espera el sistema tras recibir un mensaje para consolidar ráfagas
                      consecutivas antes de responder.
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {((channels.messageDebounceMs ?? 4500) / 1000).toFixed(1)}s
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="md:col-span-2 flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono">3s</span>
                    <input
                      id="message-debounce-slider"
                      type="range"
                      min={3000}
                      max={30000}
                      step={500}
                      value={channels.messageDebounceMs ?? 4500}
                      onChange={(e) =>
                        setChannels({ ...channels, messageDebounceMs: Number(e.target.value) })
                      }
                      className="w-full accent-primary h-2 bg-secondary rounded-lg cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground font-mono">30s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id="message-debounce"
                      type="number"
                      min={1}
                      max={60}
                      step={0.5}
                      value={Number(((channels.messageDebounceMs ?? 4500) / 1000).toFixed(1))}
                      onChange={(e) => {
                        const valSec = parseFloat(e.target.value);
                        if (!Number.isNaN(valSec)) {
                          setChannels({
                            ...channels,
                            messageDebounceMs: Math.round(valSec * 1000),
                          });
                        }
                      }}
                      className="w-24 text-right font-mono text-xs"
                    />
                    <span className="text-xs text-muted-foreground">segundos</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground italic">
                  💡 Rango recomendado: 5 a 15 segundos. Evita responder dos veces cuando el cliente
                  envía varias líneas seguidas para explicar su caso.
                </p>
              </div>

              {/* Resultado de prueba de conexión */}
              {channelTestResult && (
                <Alert variant={channelTestResult.ok ? "default" : "destructive"}>
                  <div className="flex items-center gap-2">
                    {channelTestResult.ok ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="size-4 text-red-500" />
                    )}
                    <AlertTitle className="text-sm font-semibold">
                      {channelTestResult.ok ? "Prueba exitosa" : "Error de verificación"}
                    </AlertTitle>
                  </div>
                  <AlertDescription className="text-xs mt-1">
                    {channelTestResult.message} ({channelTestResult.latencyMs}ms)
                    {Boolean(channelTestResult.details?.displayPhoneNumber) && (
                      <div className="mt-1 font-mono text-[11px]">
                        Línea: {String(channelTestResult.details?.displayPhoneNumber)} | Nombre:{" "}
                        {String(channelTestResult.details?.verifiedName || "N/A")} | Calidad:{" "}
                        {String(channelTestResult.details?.qualityRating || "N/A")}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestChannels}
                disabled={testingChannels}
                className="gap-2 text-xs"
              >
                <Zap
                  className={`size-3.5 ${testingChannels ? "animate-spin text-amber-500" : "text-amber-500"}`}
                />
                {testingChannels ? "Verificando conexión..." : "Probar Conexión en Vivo"}
              </Button>
              <Button
                type="button"
                onClick={handleSaveChannels}
                disabled={savingChannels}
                className="gap-2 text-xs"
              >
                <Save className="size-3.5" />
                {savingChannels ? "Guardando..." : "Guardar Configuración de Canales"}
              </Button>
            </CardFooter>
          </Card>

          {/* Sincronización de Historial de Zernio si está activo */}
          {channels.provider === "zernio" && <ZernioSyncCard />}
        </TabsContent>

        {/* --- Pestaña: Inteligencia Artificial --- */}
        <TabsContent value="ai" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Configuración de Proveedor de IA</CardTitle>
                  <CardDescription>
                    Definí el motor de inferencia NLU para clasificación de intenciones, respuestas
                    automáticas y embeddings vectoriales.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={ai.provider === "gemini" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAi({ ...ai, provider: "gemini" })}
                  >
                    Google Gemini (Cloud)
                  </Button>
                  <Button
                    type="button"
                    variant={ai.provider === "ollama" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAi({ ...ai, provider: "ollama" })}
                  >
                    Ollama (Local / On-Premise)
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {ai.provider === "gemini" ? (
                <div className="space-y-4">
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-xs text-muted-foreground flex items-center justify-between">
                    <span>
                      Inferencia de alta velocidad mediante Google Gemini API con latencias
                      sub-segundo.
                    </span>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      Google AI Studio <ExternalLink className="size-3" />
                    </a>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gemini-key">Gemini API Key</Label>
                    <div className="relative">
                      <Input
                        id="gemini-key"
                        type={showGeminiKey ? "text" : "password"}
                        placeholder="AIzaSy..."
                        value={ai.geminiApiKey}
                        onChange={(e) => setAi({ ...ai, geminiApiKey: e.target.value })}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showGeminiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="gemini-model">Modelo de Inferencia / NLU</Label>
                      <Input
                        id="gemini-model"
                        placeholder="gemini-2.5-flash"
                        value={ai.geminiModel}
                        onChange={(e) => setAi({ ...ai, geminiModel: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gemini-emb-model">Modelo de Embeddings</Label>
                      <Input
                        id="gemini-emb-model"
                        placeholder="text-embedding-004"
                        value={ai.geminiEmbeddingModel}
                        onChange={(e) => setAi({ ...ai, geminiEmbeddingModel: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gemini-emb-dim">Dimensión de Vectores</Label>
                      <Input
                        id="gemini-emb-dim"
                        type="number"
                        placeholder="768"
                        value={ai.geminiEmbeddingDimension}
                        onChange={(e) =>
                          setAi({ ...ai, geminiEmbeddingDimension: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-xs text-muted-foreground flex items-center justify-between">
                    <span>
                      Ejecución local privada de modelos open-source (Qwen, Llama) sin costos por
                      token.
                    </span>
                    <a
                      href="https://ollama.com/library"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      Catálogo Ollama <ExternalLink className="size-3" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="ollama-url">Ollama Base URL</Label>
                      <Input
                        id="ollama-url"
                        placeholder="http://localhost:11434"
                        value={ai.ollamaBaseUrl}
                        onChange={(e) => setAi({ ...ai, ollamaBaseUrl: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ollama-model">Modelo de Inferencia / NLU</Label>
                      <Input
                        id="ollama-model"
                        placeholder="qwen3.5:4b"
                        value={ai.ollamaModel}
                        onChange={(e) => setAi({ ...ai, ollamaModel: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="ollama-emb-model">Modelo de Embeddings</Label>
                      <Input
                        id="ollama-emb-model"
                        placeholder="qwen3-embedding:4b"
                        value={ai.ollamaEmbeddingModel}
                        onChange={(e) => setAi({ ...ai, ollamaEmbeddingModel: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ollama-emb-dim">Dimensión de Vectores</Label>
                      <Input
                        id="ollama-emb-dim"
                        type="number"
                        placeholder="2560"
                        value={ai.ollamaEmbeddingDimension}
                        onChange={(e) =>
                          setAi({ ...ai, ollamaEmbeddingDimension: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Timeouts y Parámetros Operativos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div className="space-y-1.5">
                  <Label htmlFor="ai-timeout">Timeout Inferencia NLU (ms)</Label>
                  <Input
                    id="ai-timeout"
                    type="number"
                    value={ai.aiCallTimeoutMs}
                    onChange={(e) => setAi({ ...ai, aiCallTimeoutMs: Number(e.target.value) })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Recomendado: 45000ms para llamadas complejas
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quality-timeout">Timeout Supervisión de Calidad (ms)</Label>
                  <Input
                    id="quality-timeout"
                    type="number"
                    value={ai.aiQualityTimeoutMs}
                    onChange={(e) => setAi({ ...ai, aiQualityTimeoutMs: Number(e.target.value) })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Recomendado: 600000ms (10 min en cola batch)
                  </p>
                </div>
              </div>

              {/* Advertencia de Tradeoff en Embeddings */}
              <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-4" />
                <AlertTitle className="text-xs font-semibold">
                  Regla Crítica de Vectores de Conocimiento
                </AlertTitle>
                <AlertDescription className="text-xs mt-0.5">
                  Si cambiás el proveedor o modelo de embeddings (por ejemplo de Ollama 2560 dims a
                  Gemini 768 dims), los documentos y FAQs guardados previamente en{" "}
                  <code>n8n_vectors</code> deben volver a indexarse desde la sección{" "}
                  <strong>Base de Conocimiento</strong> para que las búsquedas RAG coincidan en
                  dimensión y espacio latente.
                </AlertDescription>
              </Alert>

              {/* Resultado de prueba de IA */}
              {aiTestResult && (
                <Alert
                  variant={
                    aiTestResult.ok ? (aiTestResult.warning ? "default" : "default") : "destructive"
                  }
                >
                  <div className="flex items-center gap-2">
                    {aiTestResult.ok ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="size-4 text-red-500" />
                    )}
                    <AlertTitle className="text-sm font-semibold">
                      {aiTestResult.ok
                        ? "Verificación de IA exitosa"
                        : "Error de verificación de IA"}
                    </AlertTitle>
                  </div>
                  <AlertDescription className="text-xs mt-1">
                    {aiTestResult.message} ({aiTestResult.latencyMs}ms)
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestAi}
                disabled={testingAi}
                className="gap-2 text-xs"
              >
                <Zap
                  className={`size-3.5 ${testingAi ? "animate-spin text-amber-500" : "text-amber-500"}`}
                />
                {testingAi ? "Probando conexión con IA..." : "Probar Conexión en Vivo"}
              </Button>
              <Button
                type="button"
                onClick={handleSaveAi}
                disabled={savingAi}
                className="gap-2 text-xs"
              >
                <Save className="size-3.5" />
                {savingAi ? "Guardando..." : "Guardar Configuración de IA"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
