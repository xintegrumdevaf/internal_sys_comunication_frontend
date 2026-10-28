import { useState } from "react";
import {
  MessageSquare,
  Smartphone,
  Cloud,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  ExternalLink,
  HelpCircle,
  Clock,
  Sparkles,
  Save,
  Check,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
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
import type { WhatsAppChannelSettings, TestConnectionResult } from "../domain/settings.types";

export interface WhatsAppChannelsCardProps {
  channels: WhatsAppChannelSettings;
  setChannels: React.Dispatch<React.SetStateAction<WhatsAppChannelSettings>>;
  handleSaveChannels: () => Promise<void>;
  savingChannels: boolean;
  handleTestChannels: () => Promise<void>;
  testingChannels: boolean;
  channelTestResult: TestConnectionResult | null;
}

export function WhatsAppChannelsCard({
  channels,
  setChannels,
  handleSaveChannels,
  savingChannels,
  handleTestChannels,
  testingChannels,
  channelTestResult,
}: WhatsAppChannelsCardProps) {
  // Visibilidad de contraseñas y secretos
  const [showMetaToken, setShowMetaToken] = useState(false);
  const [showMetaSecret, setShowMetaSecret] = useState(false);
  const [showZernioKey, setShowZernioKey] = useState(false);
  const [showZernioSecret, setShowZernioSecret] = useState(false);

  // Guía de ayuda desplegable
  const [showGuide, setShowGuide] = useState(false);

  // Debounce en segundos
  const currentSeconds = Math.max(
    2,
    Math.min(30, Math.round((channels.messageDebounceMs ?? 4500) / 1000)),
  );

  const debouncePresets = [
    {
      seconds: 4,
      title: "Rápido (4s)",
      badge: "Respuestas veloces",
      description: "Ideal si tus clientes suelen enviar todo su mensaje en un solo párrafo.",
      icon: Zap,
    },
    {
      seconds: 7,
      title: "Recomendado (7s)",
      badge: "Más Popular",
      recommended: true,
      description:
        "El balance ideal. Da tiempo para 2 o 3 líneas consecutivas sin que el bot interrumpa.",
      icon: Sparkles,
    },
    {
      seconds: 12,
      title: "Pausado (12s)",
      badge: "Más paciente",
      description: "Perfecto si tus clientes escriben palabra por palabra o con pausas frecuentes.",
      icon: Clock,
    },
  ];

  const updateSeconds = (sec: number) => {
    const clamped = Math.max(2, Math.min(30, sec));
    setChannels((prev) => ({
      ...prev,
      messageDebounceMs: clamped * 1000,
    }));
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-primary" />
            <CardTitle className="text-xl">Canal de Atención WhatsApp</CardTitle>
          </div>
          <CardDescription className="text-sm mt-1">
            Configura cómo se conecta tu asistente con WhatsApp y cómo agrupa los mensajes de los
            clientes antes de responder.
          </CardDescription>
        </div>

        {/* Selector Visual de Proveedor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Opción 1: Zernio Coexistencia */}
          <div
            onClick={() => setChannels({ ...channels, provider: "zernio" })}
            className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3 relative ${
              channels.provider === "zernio"
                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                : "border-border hover:border-border/80 hover:bg-muted/30"
            }`}
          >
            <div
              className={`p-2.5 rounded-lg shrink-0 ${
                channels.provider === "zernio"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Smartphone className="size-5" />
            </div>
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Zernio (Modo Coexistencia)</span>
                <Badge
                  variant="secondary"
                  className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                >
                  Recomendado
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tus agentes humanos pueden usar WhatsApp normalmente en sus celulares mientras el
                asistente de IA responde en simultáneo sin desconectar a nadie.
              </p>
            </div>
            {channels.provider === "zernio" && (
              <div className="absolute right-3 top-3 bg-primary text-primary-foreground rounded-full p-0.5">
                <Check className="size-3.5" />
              </div>
            )}
          </div>

          {/* Opción 2: Meta Cloud API Directo */}
          <div
            onClick={() => setChannels({ ...channels, provider: "meta" })}
            className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3 relative ${
              channels.provider === "meta"
                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                : "border-border hover:border-border/80 hover:bg-muted/30"
            }`}
          >
            <div
              className={`p-2.5 rounded-lg shrink-0 ${
                channels.provider === "meta"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Cloud className="size-5" />
            </div>
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Meta Cloud API Directo</span>
                <Badge variant="outline" className="text-[10px]">
                  Oficial de Meta
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Conexión oficial directa mediante Meta for Developers. Requiere una línea telefónica
                dedicada que no esté registrada en la app móvil de WhatsApp.
              </p>
            </div>
            {channels.provider === "meta" && (
              <div className="absolute right-3 top-3 bg-primary text-primary-foreground rounded-full p-0.5">
                <Check className="size-3.5" />
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ========================================================================= */}
        {/* CASO: ZERNIO COEXISTENCIA                                                 */}
        {/* ========================================================================= */}
        {channels.provider === "zernio" && (
          <div className="space-y-6">
            {/* Banner Destacado para Probar Conexión */}
            <div className="p-4 rounded-xl border bg-gradient-to-r from-muted/60 via-card to-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">Validación en Vivo de Zernio</h4>
                  <Badge
                    variant={channelTestResult?.ok ? "default" : "outline"}
                    className="text-xs"
                  >
                    {testingChannels
                      ? "Verificando..."
                      : channelTestResult?.ok
                        ? "Conectado"
                        : channelTestResult
                          ? "Error de Conexión"
                          : "Sin probar aún"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Comprueba si tu cuenta de Zernio responde y las credenciales son válidas antes de
                  guardar.
                </p>
              </div>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleTestChannels}
                disabled={testingChannels}
                className="gap-2 shrink-0 shadow-sm"
              >
                <Zap
                  className={`size-4 ${testingChannels ? "animate-spin text-amber-300" : "text-amber-300"}`}
                />
                {testingChannels
                  ? "Verificando con Zernio..."
                  : "⚡ Probar Conexión con Zernio Ahora"}
              </Button>
            </div>

            {/* Resultado de la Prueba en Vivo (si se ejecutó) */}
            {channelTestResult && (
              <Alert
                variant={channelTestResult.ok ? "default" : "destructive"}
                className={`transition-all animate-in fade-in-50 duration-200 ${
                  channelTestResult.ok
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
                    : "border-destructive/30 bg-destructive/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  {channelTestResult.ok ? (
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <AlertTitle className="text-sm font-semibold">
                      {channelTestResult.ok
                        ? "¡Credenciales de Zernio Válidas y Operativas!"
                        : "No pudimos conectar con Zernio"}
                    </AlertTitle>
                    <AlertDescription className="text-xs opacity-90">
                      {channelTestResult.message}
                      {channelTestResult.latencyMs > 0 && (
                        <span className="ml-2 font-mono text-[11px] opacity-75">
                          (Tiempo de respuesta: {channelTestResult.latencyMs} ms)
                        </span>
                      )}
                    </AlertDescription>
                    {channelTestResult.details && (
                      <div className="mt-2 text-[11px] font-mono bg-background/50 p-2 rounded border border-border/50">
                        {Boolean(channelTestResult.details.accountId) && (
                          <p>Cuenta confirmada: {String(channelTestResult.details.accountId)}</p>
                        )}
                        {Boolean(channelTestResult.details.platform) && (
                          <p>Plataforma: {String(channelTestResult.details.platform)}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            )}

            {/* Guía Explicativa Plegable */}
            <div className="border border-border/80 rounded-xl overflow-hidden bg-muted/20">
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <HelpCircle className="size-4 text-primary" />
                  <span>¿Dónde encuentro estos datos en mi consola de Zernio?</span>
                </div>
                {showGuide ? (
                  <ChevronUp className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
                )}
              </button>
              {showGuide && (
                <div className="p-4 pt-1 border-t border-border/60 text-xs text-muted-foreground space-y-2 bg-background/60">
                  <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                    <li>
                      Inicia sesión en tu cuenta en{" "}
                      <a
                        href="https://zernio.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline font-medium inline-flex items-center gap-0.5"
                      >
                        zernio.com <ExternalLink className="size-3" />
                      </a>
                      .
                    </li>
                    <li>
                      En la sección <strong>Canales / Cuentas</strong>, asegúrate de haber vinculado
                      el número de WhatsApp de la empresa (escaneando el QR con tu app de WhatsApp).
                    </li>
                    <li>
                      Copia el <strong>Account ID</strong> de tu canal conectado y pégalo abajo.
                    </li>
                    <li>
                      En <strong>Configuración de Desarrollador / API</strong>, genera tu{" "}
                      <strong>API Key</strong> y copia el <strong>Webhook Secret</strong>.
                    </li>
                    <li>
                      Pégalos en los campos siguientes y haz clic en{" "}
                      <strong>"Probar Conexión con Zernio Ahora"</strong> para validar que todo
                      funcione antes de guardar.
                    </li>
                  </ol>
                </div>
              )}
            </div>

            {/* Formulario de Campos de Zernio */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account ID */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="zernio-account-id" className="text-xs font-semibold">
                      Zernio Account ID
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      ID del número vinculado
                    </span>
                  </div>
                  <Input
                    id="zernio-account-id"
                    placeholder="Ej: 6aa406ff5cba6170ddf8e03de"
                    value={channels.zernioAccountId}
                    onChange={(e) =>
                      setChannels((prev) => ({ ...prev, zernioAccountId: e.target.value }))
                    }
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Identificador de tu línea de WhatsApp en el panel de Zernio.
                  </p>
                </div>

                {/* API Base URL */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="zernio-base-url" className="text-xs font-semibold">
                      URL del Servidor Zernio
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Normalmente no cambia</span>
                  </div>
                  <Input
                    id="zernio-base-url"
                    placeholder="https://zernio.com/api/v1"
                    value={channels.zernioBaseUrl}
                    onChange={(e) =>
                      setChannels((prev) => ({ ...prev, zernioBaseUrl: e.target.value }))
                    }
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Dirección del servicio Zernio (por defecto: https://zernio.com/api/v1).
                  </p>
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="zernio-key" className="text-xs font-semibold">
                    Zernio API Key
                  </Label>
                  <span className="text-[11px] text-muted-foreground">Llave secreta de envío</span>
                </div>
                <div className="relative">
                  <Input
                    id="zernio-key"
                    type={showZernioKey ? "text" : "password"}
                    placeholder="••••••••••••••••••••••••••••••••"
                    value={channels.zernioApiKey}
                    onChange={(e) =>
                      setChannels((prev) => ({ ...prev, zernioApiKey: e.target.value }))
                    }
                    className="pr-10 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowZernioKey(!showZernioKey)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showZernioKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Autoriza a nuestro sistema para despachar mensajes hacia WhatsApp a través de
                  Zernio.
                </p>
              </div>

              {/* Webhook Secret */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="zernio-secret" className="text-xs font-semibold">
                    Zernio Webhook Secret
                  </Label>
                  <span className="text-[11px] text-muted-foreground">Firma de seguridad</span>
                </div>
                <div className="relative">
                  <Input
                    id="zernio-secret"
                    type={showZernioSecret ? "text" : "password"}
                    placeholder="••••••••••••••••••••••••••••••••"
                    value={channels.zernioWebhookSecret}
                    onChange={(e) =>
                      setChannels((prev) => ({ ...prev, zernioWebhookSecret: e.target.value }))
                    }
                    className="pr-10 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowZernioSecret(!showZernioSecret)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showZernioSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Garantiza que los mensajes entrantes que recibimos provienen auténticamente de
                  Zernio.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CASO: META CLOUD API DIRECTO                                              */}
        {/* ========================================================================= */}
        {channels.provider === "meta" && (
          <div className="space-y-6">
            {/* Banner Destacado para Probar Conexión Meta */}
            <div className="p-4 rounded-xl border bg-gradient-to-r from-muted/60 via-card to-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">Validación en Vivo de Meta Cloud API</h4>
                  <Badge
                    variant={channelTestResult?.ok ? "default" : "outline"}
                    className="text-xs"
                  >
                    {testingChannels
                      ? "Verificando..."
                      : channelTestResult?.ok
                        ? "Conectado"
                        : channelTestResult
                          ? "Error de Conexión"
                          : "Sin probar aún"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Verifica que tu Access Token y Phone Number ID sean válidos en Meta Graph API.
                </p>
              </div>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleTestChannels}
                disabled={testingChannels}
                className="gap-2 shrink-0 shadow-sm"
              >
                <Zap
                  className={`size-4 ${testingChannels ? "animate-spin text-amber-300" : "text-amber-300"}`}
                />
                {testingChannels ? "Verificando con Meta..." : "⚡ Probar Conexión con Meta Ahora"}
              </Button>
            </div>

            {/* Resultado Meta */}
            {channelTestResult && (
              <Alert
                variant={channelTestResult.ok ? "default" : "destructive"}
                className={`transition-all animate-in fade-in-50 duration-200 ${
                  channelTestResult.ok
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
                    : "border-destructive/30 bg-destructive/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  {channelTestResult.ok ? (
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <AlertTitle className="text-sm font-semibold">
                      {channelTestResult.ok
                        ? "¡Conexión con Meta Cloud API Exitosa!"
                        : "Error al conectar con Meta"}
                    </AlertTitle>
                    <AlertDescription className="text-xs opacity-90">
                      {channelTestResult.message}
                      {channelTestResult.latencyMs > 0 && (
                        <span className="ml-2 font-mono text-[11px] opacity-75">
                          ({channelTestResult.latencyMs} ms)
                        </span>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}

            {/* Campos Meta */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="meta-phone-id" className="text-xs font-semibold">
                    Phone Number ID
                  </Label>
                  <Input
                    id="meta-phone-id"
                    placeholder="Ej: 104593829102938"
                    value={channels.phoneNumberId}
                    onChange={(e) =>
                      setChannels((prev) => ({ ...prev, phoneNumberId: e.target.value }))
                    }
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="meta-waba-id" className="text-xs font-semibold">
                    WhatsApp Business Account ID (WABA ID)
                  </Label>
                  <Input
                    id="meta-waba-id"
                    placeholder="Ej: 994827104928172"
                    value={channels.wabaId}
                    onChange={(e) => setChannels((prev) => ({ ...prev, wabaId: e.target.value }))}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="meta-token" className="text-xs font-semibold">
                  Access Token de Sistema (Permanente)
                </Label>
                <div className="relative">
                  <Input
                    id="meta-token"
                    type={showMetaToken ? "text" : "password"}
                    placeholder="EAAG..."
                    value={channels.accessToken}
                    onChange={(e) =>
                      setChannels((prev) => ({ ...prev, accessToken: e.target.value }))
                    }
                    className="pr-10 font-mono text-xs"
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
                  <Label htmlFor="meta-secret" className="text-xs font-semibold">
                    App Secret (Firma sha256 de webhooks)
                  </Label>
                  <div className="relative">
                    <Input
                      id="meta-secret"
                      type={showMetaSecret ? "text" : "password"}
                      placeholder="••••••••••••••••"
                      value={channels.appSecret}
                      onChange={(e) =>
                        setChannels((prev) => ({ ...prev, appSecret: e.target.value }))
                      }
                      className="pr-10 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMetaSecret(!showMetaSecret)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showMetaSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="meta-verify" className="text-xs font-semibold">
                    Verify Token de Webhook
                  </Label>
                  <Input
                    id="meta-verify"
                    placeholder="Token personalizado de verificación"
                    value={channels.verifyToken}
                    onChange={(e) =>
                      setChannels((prev) => ({ ...prev, verifyToken: e.target.value }))
                    }
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PARTE 2: AGRUPACIÓN INTELIGENTE DE MENSAJES (REEMPLAZO DEL SLIDER)        */}
        {/* ========================================================================= */}
        <div className="pt-6 border-t border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <h4 className="text-sm font-semibold">Agrupación Inteligente de Mensajes</h4>
                <Badge variant="outline" className="font-mono text-xs bg-primary/5 text-primary">
                  {currentSeconds} segundos de espera
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                Cuando un cliente escribe en ráfaga (ej: <em>"Hola"</em> ➡️{" "}
                <em>"Tengo una duda"</em> ➡️ <em>"Sobre mi internet"</em>), el sistema espera este
                tiempo tras el último mensaje para responder a todo junto de manera natural.
              </p>
            </div>
          </div>

          {/* Tarjetas de Selección Rápida (Presets) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {debouncePresets.map((preset) => {
              const isSelected = currentSeconds === preset.seconds;
              const Icon = preset.icon;
              return (
                <div
                  key={preset.seconds}
                  onClick={() => updateSeconds(preset.seconds)}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/40"
                      : "border-border hover:border-border/80 hover:bg-muted/40"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon
                          className={`size-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                        />
                        <span className="font-semibold text-xs">{preset.title}</span>
                      </div>
                      <Badge
                        variant={isSelected ? "default" : "outline"}
                        className="text-[10px] py-0 px-1.5"
                      >
                        {preset.badge}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {preset.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="mt-2 pt-2 border-t border-primary/20 flex items-center justify-between text-[11px] font-medium text-primary">
                      <span>Seleccionado</span>
                      <Check className="size-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Ajuste Fino / Personalizado con Botones Limpios (Sin Sliders) */}
          <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-foreground">
                ¿Prefieres un tiempo específico?
              </span>
              <p className="text-[11px] text-muted-foreground">
                Ajusta segundo a segundo con los botones o escribe el valor exacto.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => updateSeconds(currentSeconds - 1)}
                disabled={currentSeconds <= 2}
              >
                <Minus className="size-3.5" />
              </Button>

              <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-3 py-1">
                <span className="font-mono text-sm font-bold w-6 text-center">
                  {currentSeconds}
                </span>
                <span className="text-xs text-muted-foreground">segundos</span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => updateSeconds(currentSeconds + 1)}
                disabled={currentSeconds >= 30}
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Simulación Visual de Chat en Vivo */}
          <div className="p-4 rounded-xl border border-border/80 bg-gradient-to-br from-muted/30 to-background space-y-2.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                Simulación: Así responderá tu asistente
              </span>
              <span className="text-[11px]">Espera configurada: {currentSeconds}s</span>
            </div>

            <div className="space-y-2 pt-1 font-sans text-xs">
              {/* Mensaje 1 del cliente */}
              <div className="flex justify-start">
                <div className="bg-muted px-3 py-1.5 rounded-2xl rounded-tl-sm max-w-[80%] text-foreground">
                  <p>Hola buenas tardes</p>
                  <span className="text-[9px] text-muted-foreground block text-right">
                    10:00 AM
                  </span>
                </div>
              </div>

              {/* Mensaje 2 del cliente */}
              <div className="flex justify-start">
                <div className="bg-muted px-3 py-1.5 rounded-2xl rounded-tl-sm max-w-[80%] text-foreground">
                  <p>Quiero saber qué planes de internet tienen</p>
                  <span className="text-[9px] text-muted-foreground block text-right">
                    10:00 AM (+1s)
                  </span>
                </div>
              </div>

              {/* Indicador de espera del bot */}
              <div className="flex items-center gap-2 py-1 px-2 text-[11px] text-muted-foreground italic">
                <Clock className="size-3 text-primary animate-pulse" />
                <span>
                  El sistema espera <strong>{currentSeconds} segundos</strong> desde el último
                  mensaje para consolidar...
                </span>
              </div>

              {/* Respuesta unificada del asistente */}
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground px-3.5 py-2 rounded-2xl rounded-tr-sm max-w-[85%] space-y-1">
                  <div className="flex items-center gap-1 font-semibold text-[10px] opacity-90">
                    <Sparkles className="size-3" /> Asistente de IA
                  </div>
                  <p className="leading-snug">
                    ¡Hola! Con gusto te ayudo. Disponemos de planes de fibra óptica de 100, 300 y
                    500 Mbps con instalación incluida. ¿Para qué sector lo necesitas?
                  </p>
                  <span className="text-[9px] opacity-75 block text-right">
                    10:00 AM (+{currentSeconds + 1}s)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row items-center justify-between border-t border-border pt-4 gap-3">
        <p className="text-xs text-muted-foreground">
          Recuerda guardar los cambios para que se apliquen en tiempo real a las nuevas
          conversaciones.
        </p>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            onClick={handleSaveChannels}
            disabled={savingChannels}
            className="gap-2 text-xs w-full sm:w-auto min-w-[180px]"
          >
            <Save className="size-4" />
            {savingChannels ? "Guardando..." : "Guardar Configuración de Canales"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
