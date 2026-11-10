import { useState, useEffect } from "react";
import {
  Send,
  Bot,
  Bell,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  Save,
  Plus,
  X,
  HelpCircle,
  Activity,
  Cpu,
  Layers,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { settingsApi } from "../infrastructure/settings.api";
import type { TelegramSettings, TestTelegramResult } from "../domain/settings.types";
import { toast } from "sonner";

const DEFAULT_TELEGRAM_SETTINGS: TelegramSettings = {
  enabled: false,
  botToken: "",
  defaultChatId: "",
  slaTopicId: null,
  infraTopicId: null,
  digestsTopicId: null,
  digestsEnabled: true,
  digestHours: ["09:00", "14:00", "19:00"],
  timeZone: "America/Guayaquil",
  slaThresholdMinutes: 15,
  infraAlertMinCases: 3,
  queueSaturationThreshold: 10,
  webhookSecret: "",
  commandsEnabled: true,
  aiCopilotEnabled: false,
};

export function TelegramSettingsCard() {
  const [settings, setSettings] = useState<TelegramSettings>(DEFAULT_TELEGRAM_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestTelegramResult | null>(null);
  const [testingAlerts, setTestingAlerts] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);
  const [syncingWebhook, setSyncingWebhook] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [sendSampleOnTest, setSendSampleOnTest] = useState(true);
  const [newHourInput, setNewHourInput] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsApi.getTelegramSettings();
      setSettings(data || DEFAULT_TELEGRAM_SETTINGS);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al cargar configuración de Telegram";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await settingsApi.updateTelegramSettings(settings);
      setSettings(updated);
      toast.success("Configuración de Telegram guardada exitosamente");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al guardar configuración";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.botToken.trim()) {
      toast.error("Por favor ingresá un token de bot antes de probar");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await settingsApi.testTelegram({
        botToken: settings.botToken,
        chatId: settings.defaultChatId || undefined,
        sendSampleMessage: sendSampleOnTest && Boolean(settings.defaultChatId),
      });
      setTestResult(res);
      if (res.ok) {
        toast.success(`Conexión exitosa con el bot @${res.bot?.username || res.bot?.first_name}`);
      } else {
        toast.error(res.error || "Fallo en la prueba de conexión con Telegram");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al contactar api.telegram.org";
      toast.error(message);
    } finally {
      setTesting(false);
    }
  };

  const handleCheckAlertsNow = async () => {
    setTestingAlerts(true);
    try {
      const res = await settingsApi.checkTelegramAlerts();
      if (res.dispatchedCount > 0) {
        toast.success(`Evaluación completada: se despacharon ${res.dispatchedCount} alertas a Telegram`);
      } else {
        toast.info("Evaluación completada: sin alertas críticas pendientes en este momento");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al evaluar alertas";
      toast.error(message);
    } finally {
      setTestingAlerts(false);
    }
  };

  const handleSendDigestNow = async () => {
    setSendingDigest(true);
    try {
      const res = await settingsApi.sendTelegramDigest();
      if (res.ok) {
        toast.success("Pulso operativo ejecutivo enviado a Telegram exitosamente");
      } else {
        toast.warning("El pulso no se emitió (revisá que la integración y el chatId estén activos)");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al emitir el digest";
      toast.error(message);
    } finally {
      setSendingDigest(false);
    }
  };

  const handleSyncWebhook = async () => {
    setSyncingWebhook(true);
    try {
      const res = await settingsApi.setTelegramWebhook();
      if (res.registered) {
        toast.success(`Webhook registrado con éxito en Telegram (${res.webhookUrl})`);
      } else {
        toast.warning("No se pudo registrar el webhook");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al registrar webhook";
      toast.error(message);
    } finally {
      setSyncingWebhook(false);
    }
  };

  const handleAddDigestHour = () => {
    const trimmed = newHourInput.trim();
    if (!/^\d{2}:\d{2}$/.test(trimmed)) {
      toast.error("El formato debe ser HH:mm en 24 horas (ej. 08:30 o 18:00)");
      return;
    }
    const [h, m] = trimmed.split(":").map(Number);
    if (h === undefined || m === undefined || h < 0 || h > 23 || m < 0 || m > 59) {
      toast.error("Hora inválida");
      return;
    }
    if (settings.digestHours.includes(trimmed)) {
      toast.info("Ese horario ya está en la lista");
      return;
    }
    const updated = [...settings.digestHours, trimmed].sort();
    setSettings((prev) => ({ ...prev, digestHours: updated }));
    setNewHourInput("");
  };

  const handleRemoveDigestHour = (hourToRemove: string) => {
    setSettings((prev) => ({
      ...prev,
      digestHours: prev.digestHours.filter((h) => h !== hourToRemove),
    }));
  };

  if (loading) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mr-3" />
          <span className="text-sm text-muted-foreground">Cargando configuración de Telegram...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-lg">
                <Send className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl">Centinela & Ops de Telegram</CardTitle>
              {settings.enabled ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400">
                  Activo
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Inactivo
                </Badge>
              )}
            </div>
            <CardDescription>
              Canal ejecutivo de supervisión para gerentes y directores: alertas reactivas de SLA y OLT, pulso periódico automático y copilot interactivo con IA.
            </CardDescription>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto bg-muted/40 p-2 rounded-lg border">
            <Switch
              id="telegram-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enabled: checked }))}
            />
            <Label htmlFor="telegram-enabled" className="text-sm font-medium cursor-pointer">
              {settings.enabled ? "Integración Habilitada" : "Integración Pausada"}
            </Label>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* SECCIÓN 1: CREDENCIALES DEL BOT Y CHAT DIRECTIVO */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Bot className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
              Credenciales de Telegram Bot API
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bot-token" className="text-sm font-medium">
                  Bot Token (de @BotFather)
                </Label>
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-600 hover:underline inline-flex items-center gap-1"
                >
                  Abrir BotFather <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="relative">
                <Input
                  id="bot-token"
                  type={showToken ? "text" : "password"}
                  placeholder="123456789:AAEj_abcdef123456789..."
                  value={settings.botToken}
                  onChange={(e) => setSettings((prev) => ({ ...prev, botToken: e.target.value }))}
                  className="pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                El token se almacena seguro en el backend y se presenta enmascarado.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-chat-id" className="text-sm font-medium">
                Chat ID Directivo (Supergrupo o Canal)
              </Label>
              <Input
                id="default-chat-id"
                placeholder="-1001234567890 o @MiCanalDirectivo"
                value={settings.defaultChatId}
                onChange={(e) => setSettings((prev) => ({ ...prev, defaultChatId: e.target.value }))}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                ID numérico del grupo de gerencia (los supergrupos suelen comenzar con <code>-100</code>).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 bg-muted/20 p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={testing || !settings.botToken.trim()}
                className="gap-2"
              >
                {testing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 text-amber-500" />
                )}
                Probar Bot (getMe)
              </Button>

              <div className="flex items-center space-x-2 pl-2">
                <Switch
                  id="sample-msg-test"
                  checked={sendSampleOnTest}
                  onCheckedChange={setSendSampleOnTest}
                  disabled={!settings.defaultChatId}
                />
                <Label htmlFor="sample-msg-test" className="text-xs text-muted-foreground cursor-pointer">
                  Enviar mensaje de muestra al chat
                </Label>
              </div>
            </div>

            {testResult && testResult.ok && testResult.bot && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-900">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  Bot autenticado: <b>@{testResult.bot.username || testResult.bot.first_name}</b> (ID: {testResult.bot.id})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN 2: ORGANIZACIÓN POR TEMAS (FORUM TOPICS) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Layers className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
              Enrutamiento por Temas (Supergrupo con Foros)
            </h3>
            <Badge variant="outline" className="text-xs font-normal">Opcional</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Si utilizás un Supergrupo con <b>Temas (Topics)</b> activados en Telegram, podés dirigir cada tipo de evento a su propio hilo ingresando el <code>message_thread_id</code> correspondiente. Si los dejás vacíos, todos los avisos llegarán al chat general.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sla-topic" className="text-xs font-medium">
                Tema de Alertas SLA
              </Label>
              <Input
                id="sla-topic"
                type="number"
                placeholder="Ej. 12"
                value={settings.slaTopicId ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    slaTopicId: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="infra-topic" className="text-xs font-medium">
                Tema de Infraestructura / OLT
              </Label>
              <Input
                id="infra-topic"
                type="number"
                placeholder="Ej. 18"
                value={settings.infraTopicId ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    infraTopicId: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="digests-topic" className="text-xs font-medium">
                Tema de Pulso Diario (Digests)
              </Label>
              <Input
                id="digests-topic"
                type="number"
                placeholder="Ej. 24"
                value={settings.digestsTopicId ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    digestsTopicId: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: PULSO EJECUTIVO Y REPORTES PROGRAMADOS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
                Pulso Operativo Ejecutivo (Digests Programados)
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="digests-enabled"
                checked={settings.digestsEnabled}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, digestsEnabled: checked }))
                }
              />
              <Label htmlFor="digests-enabled" className="text-xs text-muted-foreground cursor-pointer">
                Habilitado
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Horarios de Envío Automático (Formato 24h)
              </Label>
              <div className="flex flex-wrap gap-2 min-h-10 items-center p-2 rounded-lg border bg-muted/20">
                {settings.digestHours.map((hour) => (
                  <Badge
                    key={hour}
                    variant="secondary"
                    className="gap-1.5 pl-2.5 pr-1.5 py-1 text-sm bg-background border shadow-xs"
                  >
                    <span>{hour}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDigestHour(hour)}
                      className="hover:text-destructive rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {settings.digestHours.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">
                    Sin horarios programados.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Ej. 08:30"
                  value={newHourInput}
                  onChange={(e) => setNewHourInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddDigestHour();
                    }
                  }}
                  className="w-32 text-sm font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddDigestHour}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Agregar Horario
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-sm font-medium">
                  Zona Horaria del Sistema
                </Label>
                <Input
                  id="timezone"
                  value={settings.timeZone}
                  onChange={(e) => setSettings((prev) => ({ ...prev, timeZone: e.target.value }))}
                  placeholder="America/Guayaquil"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Garantiza que los cortes se disparen en la hora local exacta del ISP.
                </p>
              </div>

              <div className="pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleSendDigestNow}
                  disabled={sendingDigest || !settings.defaultChatId}
                  className="gap-2 w-full sm:w-auto"
                >
                  {sendingDigest ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Disparar Pulso Ahora (Prueba en Vivo)
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: UMBRALES DE ALERTAS REACTIVAS (CENTINELA) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
                Umbrales del Centinela Reactivo
              </h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCheckAlertsNow}
              disabled={testingAlerts || !settings.defaultChatId}
              className="gap-2"
            >
              {testingAlerts ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 text-rose-500" />
              )}
              Evaluar Alertas Ahora
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sla-threshold" className="text-xs font-medium">
                Demora Crítica de SLA (minutos)
              </Label>
              <Input
                id="sla-threshold"
                type="number"
                min={5}
                max={120}
                value={settings.slaThresholdMinutes}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, slaThresholdMinutes: Number(e.target.value) || 15 }))
                }
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Alerta roja si un cliente en atención humana espera más de este tiempo.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="infra-threshold" className="text-xs font-medium">
                Corte Masivo OLT (mínimo reclamos)
              </Label>
              <Input
                id="infra-threshold"
                type="number"
                min={2}
                max={20}
                value={settings.infraAlertMinCases}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, infraAlertMinCases: Number(e.target.value) || 3 }))
                }
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Reclamos simultáneos en el mismo sector para emitir alerta de caída de fibra.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="queue-threshold" className="text-xs font-medium">
                Saturación de Cola (casos en espera)
              </Label>
              <Input
                id="queue-threshold"
                type="number"
                min={3}
                max={50}
                value={settings.queueSaturationThreshold}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, queueSaturationThreshold: Number(e.target.value) || 10 }))
                }
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Dispara aviso si una cola departamental excede esta cantidad sin agentes libres.
              </p>
            </div>
          </div>
        </div>

        {/* SECCIÓN 5: INTERACCIÓN BIDIRECCIONAL Y COPILOT CON IA */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Cpu className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
              Interacción Bidireccional & Copilot con IA
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="commands-enabled" className="text-sm font-medium cursor-pointer">
                    Comandos en Grupo
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Permite enviar <code>/resumen</code>, <code>/sla</code>, <code>/agentes</code>, <code>/infra</code> y botones en línea.
                  </p>
                </div>
                <Switch
                  id="commands-enabled"
                  checked={settings.commandsEnabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, commandsEnabled: checked }))
                  }
                />
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="copilot-enabled" className="text-sm font-medium cursor-pointer">
                    Copilot con IA (Lenguaje Natural)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Responde preguntas libres en el chat con Grounding determinístico sobre métricas reales.
                  </p>
                </div>
                <Switch
                  id="copilot-enabled"
                  checked={settings.aiCopilotEnabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, aiCopilotEnabled: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="bg-sky-50/50 dark:bg-sky-950/20 p-4 rounded-lg border border-sky-100 dark:border-sky-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold text-sky-900 dark:text-sky-300">
                Sincronización de Webhook con Telegram
              </h4>
              <p className="text-xs text-muted-foreground">
                Registra automáticamente la URL pública del backend y un token secreto en <code>api.telegram.org</code>.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSyncWebhook}
              disabled={syncingWebhook || !settings.botToken}
              className="gap-2 shrink-0 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50"
            >
              {syncingWebhook ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              Sincronizar Webhook
            </Button>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t bg-muted/20 py-4">
        <p className="text-xs text-muted-foreground">
          Recordá presionar guardar para aplicar los cambios en el backend.
        </p>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar Configuración de Telegram
        </Button>
      </CardFooter>
    </Card>
  );
}
