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
  Trash2,
  Activity,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Info,
  Sparkles,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { settingsApi } from "../infrastructure/settings.api";
import type {
  TelegramSettings,
  TelegramTopicConfig,
  TelegramAlertRuleConfig,
  TelegramTopicCategory,
  TelegramAlertRuleCategory,
  TestTelegramResult,
} from "../domain/settings.types";
import { toast } from "sonner";

export const DEFAULT_TELEGRAM_TOPICS: TelegramTopicConfig[] = [
  { id: "topic-sla", name: "Alertas de SLA & Demoras", category: "SLA", threadId: 10, enabled: true },
  { id: "topic-infra", name: "Infraestructura & Fibra / OLT", category: "INFRASTRUCTURE", threadId: 20, enabled: true },
  { id: "topic-digests", name: "Pulso Operativo Ejecutivo", category: "DIGEST", threadId: 30, enabled: true },
];

export const DEFAULT_TELEGRAM_ALERT_RULES: TelegramAlertRuleConfig[] = [
  {
    id: "rule-sla-delay",
    name: "Demora Crítica en Atención Humana",
    category: "SLA",
    threshold: 15,
    unit: "minutos",
    severity: "CRITICAL",
    enabled: true,
    description: "Alerta roja si un cliente asignado a un asesor supera este tiempo sin respuesta.",
  },
  {
    id: "rule-infra-outage",
    name: "Corte Masivo o Falla de Sector (OLT)",
    category: "INFRASTRUCTURE",
    threshold: 3,
    unit: "reclamos",
    severity: "CRITICAL",
    enabled: true,
    description: "Dispara aviso urgente si varios clientes del mismo sector reportan fallas en los últimos 30m.",
  },
  {
    id: "rule-queue-overflow",
    name: "Saturación de Cola de Espera",
    category: "QUEUE",
    threshold: 10,
    unit: "casos en cola",
    severity: "WARNING",
    enabled: true,
    description: "Avisa si la cola de espera de cualquier departamento supera este volumen sin agentes libres.",
  },
];

const DEFAULT_TELEGRAM_SETTINGS: TelegramSettings = {
  enabled: false,
  botToken: "",
  defaultChatId: "",
  topics: DEFAULT_TELEGRAM_TOPICS,
  slaTopicId: 10,
  infraTopicId: 20,
  digestsTopicId: 30,
  digestsEnabled: true,
  digestHours: ["09:00", "14:00", "19:00"],
  timeZone: "America/Guayaquil",
  alertRules: DEFAULT_TELEGRAM_ALERT_RULES,
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
  const [showGuide, setShowGuide] = useState(false);
  const [detectingChat, setDetectingChat] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsApi.getTelegramSettings();
      if (data) {
        setSettings({
          ...data,
          topics: data.topics && data.topics.length > 0 ? data.topics : DEFAULT_TELEGRAM_TOPICS,
          alertRules: data.alertRules && data.alertRules.length > 0 ? data.alertRules : DEFAULT_TELEGRAM_ALERT_RULES,
        });
        // Si no hay token configurado, abrir la guía explicativa automáticamente
        if (!data.botToken || data.botToken.trim() === "") {
          setShowGuide(true);
        }
      } else {
        setSettings(DEFAULT_TELEGRAM_SETTINGS);
        setShowGuide(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al cargar configuración de Telegram";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectChatId = async () => {
    if (!settings.botToken.trim()) {
      toast.error("Por favor ingresá primero el Bot Token antes de detectar grupos");
      return;
    }
    setDetectingChat(true);
    try {
      const res = await settingsApi.detectTelegramChats({ botToken: settings.botToken });
      if (res.chats && res.chats.length > 0) {
        const found = res.chats[0];
        setSettings((prev) => ({ ...prev, defaultChatId: found.id }));
        toast.success(`¡Grupo detectado!: "${found.title}" (${found.id})`);
      } else {
        toast.info(
          "No se detectaron mensajes recientes. Asegurate de haber sumado tu bot al grupo con 'Añadir miembros' y escribir cualquier mensaje (ej. 'hola') en el grupo.",
          { duration: 8000 }
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al detectar grupos del bot";
      toast.error(message);
    } finally {
      setDetectingChat(false);
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

  // --- GESTIÓN DINÁMICA DE TEMAS (TOPICS) ---
  const handleAddTopic = () => {
    const newTopic: TelegramTopicConfig = {
      id: `topic-${Date.now()}`,
      name: "Nuevo Tema",
      category: "GENERAL",
      threadId: 1,
      enabled: true,
    };
    setSettings((prev) => ({
      ...prev,
      topics: [...(prev.topics || []), newTopic],
    }));
  };

  const handleUpdateTopic = (id: string, updates: Partial<TelegramTopicConfig>) => {
    setSettings((prev) => ({
      ...prev,
      topics: (prev.topics || []).map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const handleDeleteTopic = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      topics: (prev.topics || []).filter((t) => t.id !== id),
    }));
  };

  const handleResetTopics = () => {
    setSettings((prev) => ({
      ...prev,
      topics: DEFAULT_TELEGRAM_TOPICS,
    }));
    toast.info("Temas restablecidos a los valores recomendados");
  };

  // --- GESTIÓN DINÁMICA DE REGLAS DE CENTINELA ---
  const handleAddRule = () => {
    const newRule: TelegramAlertRuleConfig = {
      id: `rule-${Date.now()}`,
      name: "Nueva Regla de Alerta",
      category: "SLA",
      threshold: 15,
      unit: "minutos",
      severity: "CRITICAL",
      enabled: true,
      description: "Descripción de la condición que dispara este aviso.",
    };
    setSettings((prev) => ({
      ...prev,
      alertRules: [...(prev.alertRules || []), newRule],
    }));
  };

  const handleUpdateRule = (id: string, updates: Partial<TelegramAlertRuleConfig>) => {
    setSettings((prev) => ({
      ...prev,
      alertRules: (prev.alertRules || []).map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  };

  const handleDeleteRule = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      alertRules: (prev.alertRules || []).filter((r) => r.id !== id),
    }));
  };

  const handleResetRules = () => {
    setSettings((prev) => ({
      ...prev,
      alertRules: DEFAULT_TELEGRAM_ALERT_RULES,
    }));
    toast.info("Reglas restablecidas a los valores recomendados");
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
        {/* GUÍA EXPLICATIVA PLEGABLE: CÓMO OBTENER TOKEN Y CHAT ID */}
        <div className="border border-sky-200 dark:border-sky-900/60 rounded-xl overflow-hidden bg-sky-50/40 dark:bg-sky-950/20 shadow-xs">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-sky-50/80 dark:hover:bg-sky-950/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 rounded-lg">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  Guía Rápida: ¿Cómo obtener el Token, Chat ID y testear Telegram?
                  <Badge variant="outline" className="text-[10px] bg-background text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800">
                    Paso a Paso
                  </Badge>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Hacé clic para ver el tutorial directo: crear el bot en @BotFather, vincular el grupo directivo y probar la conexión.
                </p>
              </div>
            </div>
            {showGuide ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>

          {showGuide && (
            <div className="p-4 pt-2 border-t border-sky-100 dark:border-sky-900/40 bg-background/80 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PASO 1 */}
                <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white text-[10px] font-bold">
                      1
                    </span>
                    <h5 className="font-semibold text-foreground">Crear el Bot (@BotFather)</h5>
                  </div>
                  <ol className="list-disc list-inside space-y-1.5 text-muted-foreground text-[11px] leading-relaxed">
                    <li>
                      Abrí Telegram y buscá a{" "}
                      <a
                        href="https://t.me/BotFather"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 font-semibold hover:underline inline-flex items-center gap-0.5"
                      >
                        @BotFather <ExternalLink className="h-3 w-3" />
                      </a>
                      .
                    </li>
                    <li>Escribile el comando <code>/newbot</code>.</li>
                    <li>Elegí un nombre visible (ej: <code>Centinela ISP</code>) y luego un username único que termine en <code>bot</code> (ej: <code>CentinelaIsp_bot</code>).</li>
                    <li>BotFather te responderá con el <b>Token HTTP API</b> (ej: <code>7123456789:AAEj_...</code>). Copialo y pegalo en el campo <b>Bot Token</b> abajo.</li>
                  </ol>
                </div>

                {/* PASO 2 */}
                <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white text-[10px] font-bold">
                      2
                    </span>
                    <h5 className="font-semibold text-foreground">Crear Grupo y obtener Chat ID</h5>
                  </div>
                  <ol className="list-disc list-inside space-y-1.5 text-muted-foreground text-[11px] leading-relaxed">
                    <li>
                      Creá un grupo en Telegram con tus gerentes/admins.
                    </li>
                    <li>
                      <b>Sumá a tu propio bot al grupo:</b> Tocá el botón <b>"Añadir miembros"</b> arriba en el chat (o tocá el nombre del grupo arriba $\rightarrow$ <i>Añadir participantes</i>). <b>Buscá el username de tu bot</b>, seleccionalo y dale al tilde de confirmación. Luego dalé permisos de administrador.
                    </li>
                    <li>
                      <b>Cómo obtener el Chat ID (3 formas):</b>
                      <ul className="list-circle list-inside pl-2 pt-0.5 space-y-1">
                        <li>
                          <b>Detección Automática (Recomendado):</b> Escribí cualquier mensaje en el grupo (ej. <code>hola</code>) y presioná el botón <b>"Detectar Grupo"</b> abajo. ¡El sistema lo rellena solo!
                        </li>
                        <li>
                          <b>Vía Telegram Web:</b> Abrí el grupo en <a href="https://web.telegram.org" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">web.telegram.org</a>; la URL del navegador termina en <code>#-1002345678901</code>.
                        </li>
                        <li>
                          <b>Vía bot auxiliar:</b> Buscá a <code>@myidbot</code>, sumalo al grupo y enviá <code>/getgroupid</code> (no uses RawDataBot ya que tiene bloqueada la entrada a grupos).
                        </li>
                      </ul>
                    </li>
                  </ol>
                </div>

                {/* PASO 3 */}
                <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white text-[10px] font-bold">
                      3
                    </span>
                    <h5 className="font-semibold text-foreground">Testear la Integración en Vivo</h5>
                  </div>
                  <ol className="list-disc list-inside space-y-1.5 text-muted-foreground text-[11px] leading-relaxed">
                    <li>Activá el switch superior <b>"Integración Habilitada"</b>.</li>
                    <li>Dejá encendido el switch <b>"Enviar mensaje de muestra al chat"</b>.</li>
                    <li>
                      Hacé clic en el botón amarillo <b>"Probar Bot (getMe)"</b>:
                      el backend validará las credenciales y el bot enviará un mensaje de bienvenida real a tu grupo de Telegram.
                    </li>
                    <li>Al confirmar que llegó el mensaje, hacé clic en <b>"Guardar Configuración de Telegram"</b> abajo a la derecha.</li>
                  </ol>
                </div>

                {/* PASO 4 */}
                <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white text-[10px] font-bold">
                      4
                    </span>
                    <h5 className="font-semibold text-foreground">Temas (Forum Topics) Opcionales</h5>
                  </div>
                  <ol className="list-disc list-inside space-y-1.5 text-muted-foreground text-[11px] leading-relaxed">
                    <li>Si en tu grupo activaste la opción <b>Temas</b> (Foros) para separar alertas:</li>
                    <li>
                      Para saber el <code>thread_id</code> de un tema: hacé clic derecho en cualquier mensaje de ese tema $\rightarrow$ <b>Copiar enlace del mensaje</b>. El enlace es <code>t.me/c/12345/<b>15</b>/20</code>; el número del medio (<code>15</code>) es el <b>ID del Hilo</b>.
                    </li>
                    <li>Podés crear un tema para SLA, otro para Caídas OLT y otro para Pulso Diario. Si no usás temas, dejalo vacío y todo irá al chat general.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

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
                  className="text-xs text-sky-600 hover:underline inline-flex items-center gap-1 font-medium"
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
                Token HTTP API entregado por @BotFather. Se almacena seguro en el backend y se presenta enmascarado.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="default-chat-id" className="text-sm font-medium">
                  Chat ID Directivo (Supergrupo o Canal)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDetectChatId}
                  disabled={detectingChat || !settings.botToken.trim()}
                  className="h-6 text-[11px] gap-1 px-2 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950 font-normal"
                  title="Detecta automáticamente el grupo donde añadiste a tu bot"
                >
                  {detectingChat ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3 text-amber-500" />
                  )}
                  Detectar Grupo
                </Button>
              </div>
              <Input
                id="default-chat-id"
                placeholder="-1001234567890 o @MiCanalDirectivo"
                value={settings.defaultChatId}
                onChange={(e) => setSettings((prev) => ({ ...prev, defaultChatId: e.target.value }))}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                ID numérico del grupo de gerencia (los supergrupos suelen comenzar con <code>-100</code>). ¡Sumá tu bot al grupo y hacé clic en <b>Detectar Grupo</b> para completarlo solo!
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

              {!settings.botToken.trim() && (
                <span className="text-[11px] text-muted-foreground italic pl-1">
                  (Cargá el Bot Token arriba para habilitar la prueba)
                </span>
              )}

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

        {/* SECCIÓN 2: ORGANIZACIÓN POR TEMAS (FORUM TOPICS DINÁMICOS) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
                Enrutamiento por Temas (Supergrupo con Foros)
              </h3>
              <Badge variant="outline" className="text-xs font-normal">Dinámico</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTopic}
                className="gap-1.5 h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar Tema
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Si utilizás un Supergrupo con <b>Temas (Topics)</b> activados en Telegram, podés dirigir cada categoría de aviso a su propio hilo ingresando el <code>message_thread_id</code>. Podés añadir, editar, activar/silenciar o eliminar los temas que desees. Si una alerta no coincide con ningún tema activo, se dirigirá al chat general.
          </p>

          <div className="space-y-2.5">
            {settings.topics && settings.topics.length > 0 ? (
              settings.topics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-3 shrink-0">
                    <Switch
                      id={`topic-switch-${topic.id}`}
                      checked={topic.enabled}
                      onCheckedChange={(checked) => handleUpdateTopic(topic.id, { enabled: checked })}
                    />
                    <Badge
                      variant={topic.enabled ? "default" : "secondary"}
                      className="text-[11px] font-normal"
                    >
                      {topic.enabled ? "Activo" : "Silenciado"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-medium">
                        Nombre del Tema
                      </Label>
                      <Input
                        value={topic.name}
                        onChange={(e) => handleUpdateTopic(topic.id, { name: e.target.value })}
                        placeholder="Ej. Alertas de SLA"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-medium">
                        Categoría de Avisos
                      </Label>
                      <Select
                        value={topic.category}
                        onValueChange={(val) =>
                          handleUpdateTopic(topic.id, { category: val as TelegramTopicCategory })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SLA">Alertas de SLA & Esperas</SelectItem>
                          <SelectItem value="INFRASTRUCTURE">Infraestructura & Fibra / OLT</SelectItem>
                          <SelectItem value="DIGEST">Pulso Operativo (Digests)</SelectItem>
                          <SelectItem value="QUEUE">Desborde de Cola</SelectItem>
                          <SelectItem value="QUALITY">Supervisión de Calidad IA</SelectItem>
                          <SelectItem value="GENERAL">Avisos Generales</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-medium">
                        ID del Hilo (thread_id)
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={topic.threadId || ""}
                        onChange={(e) =>
                          handleUpdateTopic(topic.id, {
                            threadId: Number(e.target.value) || 1,
                          })
                        }
                        placeholder="Ej. 12"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTopic(topic.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 self-end md:self-center"
                    title="Eliminar tema"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 border border-dashed rounded-lg bg-muted/10 space-y-2">
                <p className="text-xs text-muted-foreground">
                  No hay temas configurados. Todos los avisos se despacharán al chat general.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetTopics}
                  className="text-xs h-8"
                >
                  Restablecer temas recomendados
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN 3: PULSO EJECUTIVO Y REPORTES PROGRAMADOS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
              Pulso Operativo Ejecutivo (Digests Programados)
            </h3>
          </div>

          {/* Banner explicativo con switch explícito para eliminar cualquier ambigüedad */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-muted/20 gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="digests-enabled" className="text-sm font-semibold cursor-pointer">
                  Envío Automático de Pulso Programado
                </Label>
                <Badge
                  variant={settings.digestsEnabled ? "default" : "secondary"}
                  className="text-xs"
                >
                  {settings.digestsEnabled ? "Activo" : "Pausado"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Cuando está activo, el sistema genera y despacha automáticamente el reporte ejecutivo del ISP en los horarios configurados a continuación.
              </p>
            </div>
            <Switch
              id="digests-enabled"
              checked={settings.digestsEnabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, digestsEnabled: checked }))
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
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

        {/* SECCIÓN 4: UMBRALES DE ALERTAS REACTIVAS (CENTINELA DINÁMICO) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
                Umbrales del Centinela Reactivo
              </h3>
              <Badge variant="outline" className="text-xs font-normal">Configurable</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRule}
                className="gap-1.5 h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar Regla
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCheckAlertsNow}
                disabled={testingAlerts || !settings.defaultChatId}
                className="gap-1.5 h-8 text-xs"
              >
                {testingAlerts ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Bell className="h-3.5 w-3.5 text-rose-500" />
                )}
                Evaluar Alertas Ahora
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            El Centinela supervisa continuamente casos desatendidos, colas de espera y caídas de infraestructura. Podés añadir nuevas reglas, ajustar umbrales, pausar o eliminar alertas según los requerimientos operativos.
          </p>

          <div className="space-y-3">
            {settings.alertRules && settings.alertRules.length > 0 ? (
              settings.alertRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-lg border bg-card hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-3 shrink-0">
                    <Switch
                      id={`rule-switch-${rule.id}`}
                      checked={rule.enabled}
                      onCheckedChange={(checked) => handleUpdateRule(rule.id, { enabled: checked })}
                    />
                    <Badge
                      variant={rule.enabled ? (rule.severity === "CRITICAL" ? "destructive" : "default") : "secondary"}
                      className="text-[11px] font-normal"
                    >
                      {rule.enabled ? rule.severity : "Pausada"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 flex-1">
                    <div className="sm:col-span-4 space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-medium">
                        Nombre de la Regla
                      </Label>
                      <Input
                        value={rule.name}
                        onChange={(e) => handleUpdateRule(rule.id, { name: e.target.value })}
                        placeholder="Ej. Demora Crítica de SLA"
                        className="h-8 text-xs font-medium"
                      />
                      {rule.description && (
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{rule.description}</p>
                      )}
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-medium">
                        Tipo de Alerta
                      </Label>
                      <Select
                        value={rule.category}
                        onValueChange={(val) =>
                          handleUpdateRule(rule.id, { category: val as TelegramAlertRuleCategory })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SLA">Demoras en SLA (Asesor)</SelectItem>
                          <SelectItem value="INFRASTRUCTURE">Corte Masivo / OLT</SelectItem>
                          <SelectItem value="QUEUE">Saturación de Cola</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-medium">
                        Umbral & Unidad
                      </Label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={1}
                          value={rule.threshold}
                          onChange={(e) =>
                            handleUpdateRule(rule.id, {
                              threshold: Number(e.target.value) || 1,
                            })
                          }
                          className="h-8 w-20 text-xs font-mono"
                        />
                        <Input
                          value={rule.unit}
                          onChange={(e) => handleUpdateRule(rule.id, { unit: e.target.value })}
                          placeholder="minutos"
                          className="h-8 text-xs flex-1"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-medium">
                        Severidad
                      </Label>
                      <Select
                        value={rule.severity}
                        onValueChange={(val) =>
                          handleUpdateRule(rule.id, { severity: val as "CRITICAL" | "WARNING" | "INFO" })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CRITICAL">🚨 Crítico</SelectItem>
                          <SelectItem value="WARNING">⚠️ Alerta</SelectItem>
                          <SelectItem value="INFO">ℹ️ Info</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 self-end md:self-center"
                    title="Eliminar regla"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 border border-dashed rounded-lg bg-muted/10 space-y-2">
                <p className="text-xs text-muted-foreground">
                  No hay reglas de alerta configuradas. El Centinela no evaluará anomalías reactivas.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetRules}
                  className="text-xs h-8"
                >
                  Restablecer reglas recomendadas
                </Button>
              </div>
            )}
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
