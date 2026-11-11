import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  TelegramAlertRuleConfig,
  TelegramSettings,
  TelegramTopicConfig,
  TestTelegramResult,
} from "../domain/settings.types";
import {
  buildNewTelegramAlertRule,
  buildNewTelegramTopic,
  DEFAULT_TELEGRAM_ALERT_RULES,
  DEFAULT_TELEGRAM_SETTINGS,
  DEFAULT_TELEGRAM_TOPICS,
  extractCleanBotToken,
  normalizeTelegramSettings,
  validateDigestHourInput,
} from "../domain/telegram-settings.defaults";
import { settingsApi } from "../infrastructure/settings.api";

export function useTelegramSettings() {
  const [settings, setSettings] = useState<TelegramSettings>(DEFAULT_TELEGRAM_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<TelegramSettings>(DEFAULT_TELEGRAM_SETTINGS);
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
  const [testingTopicId, setTestingTopicId] = useState<string | null>(null);
  const [testingAlertCategory, setTestingAlertCategory] = useState<string | null>(null);

  useEffect(() => {
    void loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsApi.getTelegramSettings();
      if (data) {
        const normalized = normalizeTelegramSettings(data);
        setSettings(normalized);
        setSavedSettings(normalized);
        if (!data.botToken || data.botToken.trim() === "") {
          setShowGuide(true);
        }
      } else {
        setSettings(DEFAULT_TELEGRAM_SETTINGS);
        setSavedSettings(DEFAULT_TELEGRAM_SETTINGS);
        setShowGuide(true);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al cargar configuración de Telegram");
    } finally {
      setLoading(false);
    }
  };

  const isDirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSettings),
    [settings, savedSettings],
  );

  const getCleanBotToken = () => extractCleanBotToken(settings.botToken);

  const applyMigratedChatId = (
    newChatId: string | number | null | undefined,
    successMsg: string,
  ) => {
    if (newChatId) {
      const newId = String(newChatId);
      setSettings((prev) => ({ ...prev, defaultChatId: newId }));
      setSavedSettings((prev) => ({ ...prev, defaultChatId: newId }));
    }
    toast.success(successMsg);
  };

  const handleFieldChange = <K extends keyof TelegramSettings>(
    key: K,
    value: TelegramSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleDiscard = () => {
    setSettings(savedSettings);
    toast.info("Cambios descartados. Se restauró la última configuración guardada.");
  };

  const handleDetectChatId = async () => {
    if (!settings.botToken.trim()) {
      toast.error("Por favor ingresá primero el Bot Token antes de detectar grupos");
      return;
    }
    setDetectingChat(true);
    try {
      const res = await settingsApi.detectTelegramChats({ botToken: getCleanBotToken() });
      if (res.chats && res.chats.length > 0) {
        const found = res.chats[0];
        setSettings((prev) => ({ ...prev, defaultChatId: found.id }));
        toast.success(`¡Grupo detectado!: "${found.title}" (${found.id})`);
      } else {
        toast.info(
          "No se detectaron mensajes recientes. Asegurate de haber sumado tu bot al grupo con 'Añadir miembros' y escribir cualquier mensaje (ej. 'hola') en el grupo.",
          { duration: 8000 },
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al detectar grupos del bot");
    } finally {
      setDetectingChat(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await settingsApi.updateTelegramSettings(settings);
      const normalized = normalizeTelegramSettings(updated);
      setSettings(normalized);
      setSavedSettings(normalized);
      toast.success("Configuración de Telegram guardada y aplicada exitosamente");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al guardar configuración");
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
        botToken: getCleanBotToken(),
        chatId: settings.defaultChatId || undefined,
        sendSampleMessage: sendSampleOnTest && Boolean(settings.defaultChatId),
      });
      setTestResult(res);
      if (res.ok) {
        const msg = res.migratedToChatId
          ? `¡Conexión exitosa! Tu grupo se convirtió en Supergrupo. Se actualizó el Chat ID a ${res.migratedToChatId} automáticamente.`
          : `Conexión exitosa con el bot @${res.bot?.username || res.bot?.first_name}`;
        applyMigratedChatId(res.migratedToChatId, msg);
      } else {
        toast.error(res.error || "Fallo en la prueba de conexión con Telegram");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al contactar api.telegram.org");
    } finally {
      setTesting(false);
    }
  };

  const handleCheckAlertsNow = async () => {
    setTestingAlerts(true);
    try {
      const res = await settingsApi.checkTelegramAlerts();
      if (res.dispatchedCount > 0) {
        toast.success(
          `Evaluación completada: se despacharon ${res.dispatchedCount} alertas a Telegram`,
        );
      } else {
        toast.info("Evaluación completada: sin alertas críticas pendientes en este momento");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al evaluar alertas");
    } finally {
      setTestingAlerts(false);
    }
  };

  const handleSendDigestNow = async () => {
    if (!settings.defaultChatId?.trim()) {
      toast.warning("Cargá o detectá primero el Chat ID antes de enviar la prueba de pulso.");
      return;
    }
    setSendingDigest(true);
    try {
      const res = await settingsApi.sendTelegramDigest({
        chatId: settings.defaultChatId.trim(),
        botToken: getCleanBotToken(),
      });
      if (res?.ok) {
        const msg = res.migratedToChatId
          ? `¡Pulso emitido! Tu grupo se convirtió en Supergrupo. Se actualizó el Chat ID a ${res.migratedToChatId} automáticamente.`
          : "Pulso operativo ejecutivo enviado a Telegram exitosamente";
        applyMigratedChatId(res.migratedToChatId, msg);
      } else {
        toast.warning(
          "El pulso no se emitió (revisá que el Chat ID sea válido y el bot sea administrador)",
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al emitir el digest");
    } finally {
      setSendingDigest(false);
    }
  };

  const handleTestTopic = async (topic: TelegramTopicConfig) => {
    if (!settings.defaultChatId?.trim()) {
      toast.warning("Ingresá o detectá primero el Chat ID del grupo antes de probar el hilo.");
      return;
    }
    setTestingTopicId(topic.id);
    try {
      const res = await settingsApi.testTelegramTopic({
        threadId: topic.threadId,
        topicName: topic.name,
        chatId: settings.defaultChatId.trim(),
        botToken: getCleanBotToken(),
      });
      if (res?.ok) {
        const msg = res.migratedToChatId
          ? `¡Mensaje enviado al hilo "${topic.name}"! Se actualizó el Chat ID a ${res.migratedToChatId} automáticamente.`
          : `Mensaje de prueba enviado exitosamente al hilo "${topic.name}" (ID: ${topic.threadId})`;
        applyMigratedChatId(res.migratedToChatId, msg);
      } else {
        toast.warning(
          `No se pudo enviar al hilo "${topic.name}". Verificá si el ID del hilo existe en tu supergrupo.`,
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al enviar mensaje al hilo");
    } finally {
      setTestingTopicId(null);
    }
  };

  const handleTestAlert = async (category: "SLA" | "INFRASTRUCTURE" | "QUEUE") => {
    if (!settings.defaultChatId?.trim()) {
      toast.warning("Ingresá o detectá primero el Chat ID del grupo antes de simular alertas.");
      return;
    }
    setTestingAlertCategory(category);
    try {
      const res = await settingsApi.testTelegramAlert({
        category,
        chatId: settings.defaultChatId.trim(),
        botToken: getCleanBotToken(),
      });
      if (res?.ok) {
        const catLabel =
          category === "SLA"
            ? "SLA"
            : category === "INFRASTRUCTURE"
              ? "Corte OLT"
              : "Saturación de Cola";
        const msg = res.migratedToChatId
          ? `¡Alerta (${catLabel}) enviada! Se actualizó el Chat ID a ${res.migratedToChatId} automáticamente.`
          : `Alerta reactiva simulada (${catLabel}) enviada exitosamente a Telegram`;
        applyMigratedChatId(res.migratedToChatId, msg);
      } else {
        toast.warning(
          "No se pudo entregar la alerta de prueba. Verificá los permisos del bot en el grupo.",
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al simular alerta");
    } finally {
      setTestingAlertCategory(null);
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
      toast.error(err instanceof Error ? err.message : "Error al registrar webhook");
    } finally {
      setSyncingWebhook(false);
    }
  };

  const handleAddDigestHour = () => {
    const { hour, error, info } = validateDigestHourInput(newHourInput, settings.digestHours);
    if (error) {
      toast.error(error);
      return;
    }
    if (info) {
      toast.info(info);
      return;
    }
    if (hour) {
      setSettings((prev) => ({ ...prev, digestHours: [...prev.digestHours, hour].sort() }));
      setNewHourInput("");
    }
  };

  const handleAddTopic = () => {
    handleFieldChange("topics", [...(settings.topics || []), buildNewTelegramTopic()]);
  };

  const handleUpdateTopic = (id: string, updates: Partial<TelegramTopicConfig>) => {
    handleFieldChange(
      "topics",
      (settings.topics || []).map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  };

  const handleDeleteTopic = (id: string) => {
    handleFieldChange(
      "topics",
      (settings.topics || []).filter((t) => t.id !== id),
    );
  };

  const handleResetTopics = () => {
    handleFieldChange("topics", DEFAULT_TELEGRAM_TOPICS);
    toast.info("Temas restablecidos a los valores recomendados");
  };

  const handleAddRule = () => {
    handleFieldChange("alertRules", [...(settings.alertRules || []), buildNewTelegramAlertRule()]);
  };

  const handleUpdateRule = (id: string, updates: Partial<TelegramAlertRuleConfig>) => {
    handleFieldChange(
      "alertRules",
      (settings.alertRules || []).map((r) => (r.id === id ? { ...r, ...updates } : r)),
    );
  };

  const handleDeleteRule = (id: string) => {
    handleFieldChange(
      "alertRules",
      (settings.alertRules || []).filter((r) => r.id !== id),
    );
  };

  const handleResetRules = () => {
    handleFieldChange("alertRules", DEFAULT_TELEGRAM_ALERT_RULES);
    toast.info("Reglas restablecidas a los valores recomendados");
  };

  return {
    settings,
    loading,
    saving,
    testing,
    testResult,
    testingAlerts,
    sendingDigest,
    syncingWebhook,
    showToken,
    sendSampleOnTest,
    newHourInput,
    showGuide,
    detectingChat,
    testingTopicId,
    testingAlertCategory,
    isDirty,
    setShowToken,
    setSendSampleOnTest,
    setNewHourInput,
    setShowGuide,
    handleFieldChange,
    handleDiscard,
    handleDetectChatId,
    handleSave,
    handleTestConnection,
    handleCheckAlertsNow,
    handleSendDigestNow,
    handleTestTopic,
    handleTestAlert,
    handleSyncWebhook,
    handleAddDigestHour,
    handleAddTopic,
    handleUpdateTopic,
    handleDeleteTopic,
    handleResetTopics,
    handleAddRule,
    handleUpdateRule,
    handleDeleteRule,
    handleResetRules,
  };
}
