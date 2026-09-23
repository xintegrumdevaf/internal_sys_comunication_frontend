import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { promptService } from "../infrastructure/prompt.service";
import type { PromptDto, PromptVersionDto, SimulatePromptResponse } from "../domain/prompt.types";

const DEFAULT_BASELINE_PROMPTS: Record<
  string,
  { systemPrompt: string; userTemplate: string; temperature: number }
> = {
  interpret_message: {
    systemPrompt: `Eres un módulo de interpretación de lenguaje para el sistema de atención automatizada de un proveedor de internet (ISP) en Ecuador. Tu ÚNICA función es analizar el mensaje del cliente y devolver una interpretación estructurada.

NO decides qué hacer. NO ejecutas ninguna acción. NO inventas datos que el cliente no mencionó explícitamente. NO decides si un proceso terminó, si hay deuda, ni ninguna otra decisión de negocio.

Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto adicional antes o después, sin explicaciones, sin markdown, con exactamente esta forma:

{
  "type": "NEW_INTENT" | "CONTINUE" | "ANSWER" | "CHANGE_TOPIC" | "CONFIRM" | "DENY" | "CANCEL" | "REQUEST_HUMAN" | "UNCLEAR",
  "intent": "general.inquiry | sales.packages | sales.upgrade | support.internet | billing.balance | billing.record_payment | unknown",
  "entities": { ... },
  "confidence": 0.0
}`,
    userTemplate: `Texto: {{text}}\nHistorial reciente: {{recentMessages}}\nCaso activo: {{activeCase}}\nPregunta pendiente: {{pendingQuestion}}`,
    temperature: 0.1,
  },
  compose_reply: {
    systemPrompt: `Eres el redactor de respuestas de WhatsApp de una empresa de internet en Ecuador. Tu trabajo es tomar un resultado YA DECIDIDO por el sistema y convertirlo en un mensaje natural, breve y amable para el cliente. Tú NO decides qué decir — solo cómo decirlo.

Reglas estrictas:
- NUNCA menciones nombres de procesos internos ni códigos técnicos.
- NUNCA te delates como bot o IA.
- PROHIBICIÓN ESTRICTA DE ESCALAMIENTO FANTASMA: Si no indica ESCALATED, no prometas atención humana.
- Responde ÚNICAMENTE con el texto del mensaje final.`,
    userTemplate: `Resultado: {{stepOutcome}}\nPlantilla base: {{templateHint}}\nCampos faltantes: {{missingFields}}\nTipo de workflow: {{workflowType}}\nCliente: {{clientName}}`,
    temperature: 0.2,
  },
  refine_tone: {
    systemPrompt: `Eres un asistente experto en redacción para agentes de soporte y atención al cliente. Tu único trabajo es pulir el tono del borrador recibido para que sea cordial, empático y profesional, respetando de forma estricta su intención, estructura y longitud.`,
    userTemplate: `Borrador a refinar:\n"""\n{{originalText}}\n"""\nContexto adicional: {{contextHint}}`,
    temperature: 0.3,
  },
};

export function usePrompts(initialSlug?: string) {
  const [prompts, setPrompts] = useState<PromptDto[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string>(initialSlug || "");
  const [selectedPrompt, setSelectedPrompt] = useState<PromptDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const selectedSlugRef = useRef(selectedSlug);
  selectedSlugRef.current = selectedSlug;

  // Versión en inspección / edición
  const [selectedVersion, setSelectedVersion] = useState<PromptVersionDto | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [userTemplate, setUserTemplate] = useState<string>("");
  const [changeNotes, setChangeNotes] = useState<string>("");
  const [temperature, setTemperature] = useState<number>(0.1);

  // Variables de prueba para el Playground
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});

  // Simulación
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulatePromptResponse | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // Operaciones
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  // Cargar lista de prompts
  const loadPrompts = useCallback(async (slugToSelect?: string) => {
    setLoadingPrompts(true);
    try {
      const list = await promptService.listPrompts();
      setPrompts(list);

      const targetSlug =
        slugToSelect || selectedSlugRef.current || (list.length > 0 ? list[0].slug : "");
      if (targetSlug) {
        setSelectedSlug(targetSlug);
        const found = list.find((p) => p.slug === targetSlug);
        if (found) {
          setSelectedPrompt(found);
          const activeVer = found.activeVersion || (found.versions && found.versions[0]) || null;
          setSelectedVersion(activeVer);
          if (activeVer) {
            setSystemPrompt(activeVer.systemPrompt || "");
            setUserTemplate(activeVer.userTemplate || "");
            setTemperature(
              typeof activeVer.modelConfig?.temperature === "number"
                ? activeVer.modelConfig.temperature
                : 0.1,
            );
          }
          const varsMap: Record<string, string> = {};
          if (found.variableDefinitions && found.variableDefinitions.length > 0) {
            found.variableDefinitions.forEach((vd) => {
              varsMap[vd.key] = vd.example || "";
            });
          } else if (found.allowedVariables) {
            found.allowedVariables.forEach((v) => {
              varsMap[v] = "";
            });
          }
          setTestVariables(varsMap);
        }
      }
    } catch (e) {
      toast.error("Error al cargar la lista de plantillas de prompts");
    } finally {
      setLoadingPrompts(false);
    }
  }, []);

  const promptsRef = useRef(prompts);
  promptsRef.current = prompts;

  // Cargar detalle del prompt seleccionado
  const loadPromptDetails = useCallback(async (slug: string) => {
    if (!slug) return;
    setLoadingDetail(true);
    try {
      const detail = await promptService.getPromptBySlug(slug);
      const fallback = promptsRef.current.find((p) => p.slug === slug);

      let versions: PromptVersionDto[] = [];
      let templateData: Partial<PromptDto> = {};
      let activeVer: PromptVersionDto | null = null;

      if (detail && typeof detail === "object" && "template" in detail) {
        const envelope = detail as unknown as {
          template: PromptDto;
          activeVersion: PromptVersionDto | null;
          versions: PromptVersionDto[];
        };
        templateData = envelope.template || {};
        versions = envelope.versions || [];
        activeVer = envelope.activeVersion || (versions.length > 0 ? versions[0] : null);
      } else if (Array.isArray(detail)) {
        versions = detail;
        activeVer = versions.length > 0 ? versions[0] : null;
      } else if (detail && typeof detail === "object") {
        templateData = detail as PromptDto;
        versions = (detail as PromptDto).versions || [];
        activeVer =
          (detail as PromptDto).activeVersion || (versions.length > 0 ? versions[0] : null);
      }

      const baseline = DEFAULT_BASELINE_PROMPTS[slug];

      const merged: PromptDto = {
        id: templateData.id || fallback?.id || slug,
        slug,
        name: templateData.name || fallback?.name || slug,
        description: templateData.description || fallback?.description || "",
        allowedVariables: templateData.allowedVariables || fallback?.allowedVariables || [],
        variableDefinitions: templateData.variableDefinitions || fallback?.variableDefinitions,
        activeVersion: activeVer || fallback?.activeVersion || null,
        versionsCount: versions.length || fallback?.versionsCount || (activeVer ? 1 : 0),
        versions,
      };

      const targetVer =
        activeVer || merged.activeVersion || (versions.length > 0 ? versions[0] : null);

      setSelectedPrompt(merged);
      setSelectedVersion(targetVer);

      if (targetVer) {
        setSystemPrompt(targetVer.systemPrompt || "");
        setUserTemplate(targetVer.userTemplate || "");
        setTemperature(
          typeof targetVer.modelConfig?.temperature === "number"
            ? targetVer.modelConfig.temperature
            : 0.1,
        );
      } else if (baseline) {
        setSystemPrompt(baseline.systemPrompt);
        setUserTemplate(baseline.userTemplate);
        setTemperature(baseline.temperature);
      }

      const varsMap: Record<string, string> = {};
      if (merged.variableDefinitions && merged.variableDefinitions.length > 0) {
        merged.variableDefinitions.forEach((vd) => {
          varsMap[vd.key] = vd.example || "";
        });
      } else if (merged.allowedVariables) {
        merged.allowedVariables.forEach((v) => {
          varsMap[v] = "";
        });
      }
      setTestVariables((prevVars) => ({ ...varsMap, ...prevVars }));

      setChangeNotes("");
      setSimulationResult(null);
      setSimulationError(null);
    } catch (e) {
      console.error(`Error al cargar el detalle del prompt "${slug}":`, e);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const filteredPrompts = useMemo(() => {
    if (!searchQuery.trim()) return prompts;
    const q = searchQuery.toLowerCase();
    return prompts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)),
    );
  }, [prompts, searchQuery]);

  useEffect(() => {
    void loadPrompts();
  }, [loadPrompts]);

  useEffect(() => {
    if (selectedSlug) {
      void loadPromptDetails(selectedSlug);
    }
  }, [selectedSlug, loadPromptDetails]);

  const selectPrompt = (slug: string) => {
    setSelectedSlug(slug);
    const found = prompts.find((p) => p.slug === slug);
    if (found) {
      setSelectedPrompt(found);
      const activeVer = found.activeVersion || (found.versions && found.versions[0]) || null;
      setSelectedVersion(activeVer);
      if (activeVer) {
        setSystemPrompt(activeVer.systemPrompt || "");
        setUserTemplate(activeVer.userTemplate || "");
        setTemperature(
          typeof activeVer.modelConfig?.temperature === "number"
            ? activeVer.modelConfig.temperature
            : 0.1,
        );
      }
      const varsMap: Record<string, string> = {};
      if (found.variableDefinitions && found.variableDefinitions.length > 0) {
        found.variableDefinitions.forEach((vd) => {
          varsMap[vd.key] = vd.example || "";
        });
      } else if (found.allowedVariables) {
        found.allowedVariables.forEach((v) => {
          varsMap[v] = "";
        });
      }
      setTestVariables(varsMap);
    }
  };

  const selectVersion = (version: PromptVersionDto) => {
    setSelectedVersion(version);
    setSystemPrompt(version.systemPrompt || "");
    setUserTemplate(version.userTemplate || "");
    setTemperature(
      typeof version.modelConfig?.temperature === "number" ? version.modelConfig.temperature : 0.1,
    );
    setChangeNotes("");
  };

  const updateTestVariable = (key: string, value: string) => {
    setTestVariables((prev) => ({ ...prev, [key]: value }));
  };

  // Guardar nueva versión
  const saveVersion = async (publishImmediately: boolean): Promise<boolean> => {
    const targetSlug = selectedSlug || selectedPrompt?.slug;
    if (!targetSlug) return false;
    setSaving(true);
    try {
      await promptService.createVersion(targetSlug, {
        systemPrompt,
        userTemplate,
        changeNotes: changeNotes.trim() || undefined,
        modelConfig: { temperature },
        publishImmediately,
      });

      toast.success(
        publishImmediately
          ? "Nueva versión guardada y publicada exitosamente"
          : "Nueva versión guardada como borrador",
      );
      await loadPromptDetails(targetSlug);
      await loadPrompts(targetSlug);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar la nueva versión");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Publicar versión específica
  const publishCurrentVersion = async (versionId?: string): Promise<boolean> => {
    const targetSlug = selectedSlug || selectedPrompt?.slug;
    const targetId = versionId || selectedVersion?.id;
    if (!targetSlug || !targetId) return false;
    setPublishing(true);
    try {
      await promptService.publishVersion(targetSlug, targetId);
      toast.success("Versión activada exitosamente");
      await loadPromptDetails(targetSlug);
      await loadPrompts(targetSlug);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al activar la versión");
      return false;
    } finally {
      setPublishing(false);
    }
  };

  // Rollback en 1 clic
  const rollback = async (targetVersionId?: string): Promise<boolean> => {
    const targetSlug = selectedSlug || selectedPrompt?.slug;
    if (!targetSlug) return false;
    setRollingBack(true);
    try {
      await promptService.rollbackVersion(targetSlug, targetVersionId);
      toast.success("Rollback completado con éxito");
      await loadPromptDetails(targetSlug);
      await loadPrompts(targetSlug);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al ejecutar el rollback");
      return false;
    } finally {
      setRollingBack(false);
    }
  };

  // Simulación en vivo
  const simulate = async () => {
    const targetSlug = selectedSlug || selectedPrompt?.slug;
    if (!targetSlug) return;
    setSimulating(true);
    setSimulationError(null);
    try {
      const result = await promptService.simulatePrompt(targetSlug, {
        systemPrompt,
        userTemplate,
        testVariables,
        modelConfig: { temperature },
      });
      setSimulationResult(result);
      toast.success(`Simulación completada en ${result.durationMs}ms`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error durante la simulación del prompt";
      setSimulationError(msg);
      toast.error(msg);
    } finally {
      setSimulating(false);
    }
  };

  // Inserción de variable en el cursor o textarea
  const insertVariable = (varName: string, target: "system" | "user" = "user") => {
    const placeholder = `{{${varName}}}`;
    if (target === "system") {
      setSystemPrompt((prev) => `${prev} ${placeholder}`.trim());
    } else {
      setUserTemplate((prev) => `${prev} ${placeholder}`.trim());
    }
    toast.info(`Variable ${placeholder} insertada en la plantilla`);
  };

  return {
    prompts,
    filteredPrompts,
    searchQuery,
    setSearchQuery,
    loadingPrompts,
    selectedSlug,
    selectedPrompt,
    loadingDetail,
    selectedVersion,
    systemPrompt,
    setSystemPrompt,
    userTemplate,
    setUserTemplate,
    changeNotes,
    setChangeNotes,
    temperature,
    setTemperature,
    testVariables,
    setTestVariables,
    updateTestVariable,
    simulating,
    simulationResult,
    simulationError,
    saving,
    publishing,
    rollingBack,
    selectPrompt,
    selectVersion,
    saveVersion,
    publishCurrentVersion,
    rollback,
    simulate,
    insertVariable,
    reload: () => loadPromptDetails(selectedSlug),
  };
}
