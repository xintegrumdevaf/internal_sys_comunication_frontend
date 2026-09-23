import { useState } from "react";
import {
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  Clock,
  Code,
  Terminal,
  Play,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  History,
  Sliders,
  FileCode,
  Layers,
  Bot,
  User,
  Info,
  HelpCircle,
  Tag,
  ChevronRight,
} from "lucide-react";
import type { usePrompts } from "../application/use-prompts";
import { toast } from "sonner";

type PromptsHook = ReturnType<typeof usePrompts>;

interface Props {
  hook: PromptsHook;
}

export function PromptEditorSplitView({ hook }: Props) {
  const {
    selectedPrompt,
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
    updateTestVariable,
    simulating,
    simulationResult,
    simulationError,
    saving,
    publishing,
    rollingBack,
    selectVersion,
    saveVersion,
    publishCurrentVersion,
    rollback,
    simulate,
    insertVariable,
  } = hook;

  const [activeTabResult, setActiveTabResult] = useState<"response" | "interpolated">("response");
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [jsonMode, setJsonMode] = useState(false);
  const [rawJsonVariables, setRawJsonVariables] = useState("");

  if (!selectedPrompt) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border border-border rounded-xl bg-card">
        <Sparkles className="size-10 mb-3 text-muted-foreground/40" />
        <p className="font-semibold text-foreground">Selecciona una plantilla del catálogo</p>
        <p className="text-xs">
          Elige una plantilla del panel izquierdo para inspeccionar sus instrucciones y simularla.
        </p>
      </div>
    );
  }

  const promptTitle = selectedPrompt.name || selectedPrompt.slug;
  const promptDescription =
    selectedPrompt.description ||
    "Esta plantilla define las instrucciones y formato que utiliza la inteligencia artificial para esta tarea.";

  const isCurrentVersionActive =
    selectedVersion && selectedPrompt.activeVersion
      ? selectedVersion.id === selectedPrompt.activeVersion.id
      : selectedVersion?.versionNumber === selectedPrompt.activeVersion?.versionNumber;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedResponse(true);
    toast.success("Copiado al portapapeles");
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const handleToggleJsonMode = (enable: boolean) => {
    setJsonMode(enable);
    if (enable) {
      setRawJsonVariables(JSON.stringify(testVariables, null, 2));
    } else {
      try {
        const parsed = JSON.parse(rawJsonVariables);
        if (typeof parsed === "object" && parsed !== null) {
          Object.entries(parsed).forEach(([k, v]) => {
            updateTestVariable(k, String(v));
          });
        }
      } catch {
        toast.error("JSON de variables inválido");
      }
    }
  };

  const handleRawJsonChange = (val: string) => {
    setRawJsonVariables(val);
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === "object" && parsed !== null) {
        Object.entries(parsed).forEach(([k, v]) => {
          updateTestVariable(k, String(v));
        });
      }
    } catch {
      // Ignorar sintaxis parcial mientras escribe
    }
  };

  return (
    <div className="space-y-4">
      {/* ======================================================== */}
      {/* BANNER PRINCIPAL: Título, Descripción y Variables        */}
      {/* ======================================================== */}
      <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-foreground">{promptTitle}</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border font-semibold">
                {selectedPrompt.slug}
              </span>
            </div>
            {/* Descripción en tipografía clara */}
            <p className="text-xs text-foreground/80 mt-1 max-w-3xl leading-relaxed">
              {promptDescription}
            </p>
          </div>

          {/* Control de Versiones */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <History className="size-4 text-muted-foreground" />
            <select
              value={selectedVersion?.id || ""}
              onChange={(e) => {
                const targetVer = selectedPrompt.versions?.find((v) => v.id === e.target.value);
                if (targetVer) selectVersion(targetVer);
              }}
              className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary/50"
            >
              {selectedPrompt.versions && selectedPrompt.versions.length > 0 ? (
                selectedPrompt.versions.map((ver) => (
                  <option key={ver.id} value={ver.id}>
                    v{ver.versionNumber}{" "}
                    {ver.id === selectedPrompt.activeVersion?.id ? "— (Activa)" : "— (Histórica)"}
                  </option>
                ))
              ) : (
                <option value="">v1 (Inicial)</option>
              )}
            </select>

            {isCurrentVersionActive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                <CheckCircle2 className="size-3" />v{selectedVersion?.versionNumber || 1} Activa
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                v{selectedVersion?.versionNumber} Histórica
              </span>
            )}
          </div>
        </div>

        {/* Guía de Variables Permitidas con inserción de 1 clic */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mr-1">
              <Code className="size-3.5 text-primary" /> Variables Permitidas:
            </span>
            {selectedPrompt.allowedVariables && selectedPrompt.allowedVariables.length > 0 ? (
              selectedPrompt.allowedVariables.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(v, "user")}
                  title={`Clic para insertar {{${v}}} en el template`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-all cursor-pointer shadow-2xs"
                >
                  <span>{`{{${v}}}`}</span>
                </button>
              ))
            ) : (
              <span className="text-[11px] text-muted-foreground italic">
                Sin variables declaradas
              </span>
            )}
          </div>

          <span className="text-[11px] text-muted-foreground hidden md:inline">
            💡 Haz clic en una variable para insertarla en la plantilla
          </span>
        </div>

        {/* Alerta si visualiza versión histórica */}
        {!isCurrentVersionActive && selectedVersion && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-between gap-3 text-xs font-medium">
            <div className="flex items-center gap-2">
              <Info className="size-4 shrink-0" />
              <span>
                Estás visualizando la versión histórica{" "}
                <strong>v{selectedVersion.versionNumber}</strong>. Puedes reactivarla o usarla como
                base para una nueva versión.
              </span>
            </div>
            <button
              type="button"
              disabled={publishing}
              onClick={() => void publishCurrentVersion(selectedVersion.id)}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-2xs shrink-0 cursor-pointer"
            >
              Activar Esta Versión
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* VISTA DIVIDIDA (SPLIT SCREEN): Editor Izq. / Playground Der. */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* PANEL IZQUIERDO: Editor (7 cols) */}
        <div className="xl:col-span-7 space-y-4">
          {/* Editor: System Prompt */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Bot className="size-4 text-primary" />
                System Prompt (Instrucción Base del Asistente)
              </label>
              <span className="text-[10px] font-mono text-muted-foreground">
                {systemPrompt.length} caracteres
              </span>
            </div>
            <textarea
              rows={8}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Instrucción de sistema para el modelo de lenguaje..."
              className="w-full p-3 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed resize-y"
            />
          </div>

          {/* Editor: User Template */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <User className="size-4 text-emerald-400" />
                User Template (Plantilla de Mensaje de Usuario)
              </label>
              <span className="text-[10px] font-mono text-muted-foreground">
                {userTemplate.length} caracteres
              </span>
            </div>
            <textarea
              rows={6}
              value={userTemplate}
              onChange={(e) => setUserTemplate(e.target.value)}
              placeholder="Plantilla con variables, ej: Mensaje entrante: {{message}}"
              className="w-full p-3 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed resize-y"
            />
          </div>

          {/* Configuración del Modelo y Notas */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Sliders className="size-3.5 text-primary" />
                  Temperatura
                </label>
                <span className="text-xs font-mono font-bold text-primary">
                  {temperature.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <p className="text-[10px] text-muted-foreground">
                0.0 = Determinismo y precisión; 0.7+ = Creatividad y variabilidad.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Notas del Cambio (Opcional)
              </label>
              <input
                type="text"
                value={changeNotes}
                onChange={(e) => setChangeNotes(e.target.value)}
                placeholder="Ej: Ajuste en clasificación de soporte"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Barra de Acciones */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={rollingBack || !selectedPrompt.slug}
                onClick={() => {
                  if (
                    confirm("¿Confirmas que deseas revertir a la versión anterior de este prompt?")
                  ) {
                    void rollback();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                title="Rollback automático a la versión inmediata anterior"
              >
                <RotateCcw className="size-3.5" />
                Rollback (1 Clic)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveVersion(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg border border-border bg-background hover:bg-muted/20 text-foreground transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save className="size-3.5" />
                Guardar Borrador
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => void saveVersion(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                Guardar y Publicar
              </button>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: Playground de Simulación en Vivo (5 cols) */}
        <div className="xl:col-span-5 space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Terminal className="size-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground">Playground de Simulación</h4>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-semibold bg-muted p-1 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => handleToggleJsonMode(false)}
                  className={`px-2 py-0.5 rounded ${
                    !jsonMode ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  Campos
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleJsonMode(true)}
                  className={`px-2 py-0.5 rounded ${
                    jsonMode ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Variables de Prueba */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Valores de Prueba para Variables
              </label>

              {!jsonMode ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {/* Si la plantilla tiene definiciones amigables, las usamos; si no, fallback a la variable cruda */}
                  {selectedPrompt.variableDefinitions &&
                  selectedPrompt.variableDefinitions.length > 0 ? (
                    selectedPrompt.variableDefinitions.map((v) => (
                      <div
                        key={v.key}
                        className="space-y-1.5 p-3 rounded-xl border border-border/80 bg-background/60 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Tag className="size-3 text-primary shrink-0" />
                            {v.label}
                            {v.required && (
                              <span className="text-rose-500 font-bold" title="Requerido">
                                *
                              </span>
                            )}
                          </label>
                          <span className="text-[11px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded border border-border/60">
                            {"{{" + v.key + "}}"}
                          </span>
                        </div>
                        {v.description && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {v.description}
                          </p>
                        )}
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/60"
                          placeholder={
                            v.placeholder ||
                            (v.example ? `Ej: ${v.example}` : `Valor para ${v.key}...`)
                          }
                          value={testVariables[v.key] || ""}
                          onChange={(e) => updateTestVariable(v.key, e.target.value)}
                        />
                      </div>
                    ))
                  ) : selectedPrompt.allowedVariables &&
                    selectedPrompt.allowedVariables.length > 0 ? (
                    selectedPrompt.allowedVariables.map((v) => (
                      <div key={v} className="space-y-1">
                        <label className="text-[11px] font-mono text-muted-foreground font-semibold flex items-center gap-1">
                          <Tag className="size-3 text-primary" /> {`{{${v}}}`}
                        </label>
                        <input
                          type="text"
                          value={testVariables[v] || ""}
                          onChange={(e) => updateTestVariable(v, e.target.value)}
                          placeholder={`Escribe un valor de prueba para ${v}...`}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary/50"
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Esta plantilla no declara variables predefinidas.
                    </p>
                  )}
                </div>
              ) : (
                <textarea
                  rows={8}
                  value={rawJsonVariables}
                  onChange={(e) => handleRawJsonChange(e.target.value)}
                  placeholder='{\n  "message": "Quiero cancelar mi servicio"\n}'
                  className="w-full p-2.5 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary/50"
                />
              )}
            </div>

            {/* Botón Ejecutar Simulación */}
            <button
              type="button"
              disabled={simulating}
              onClick={() => void simulate()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {simulating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Ejecutando Simulación con IA...
                </>
              ) : (
                <>
                  <Play className="size-4 fill-current" />
                  Probar Simulación en Vivo
                </>
              )}
            </button>
          </div>

          {/* Panel de Resultados */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileCode className="size-4 text-primary" />
                Resultado de la Ejecución
              </h4>

              {simulationResult && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                    <Clock className="size-3" />
                    {simulationResult.durationMs}ms
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      simulationResult.isValidJson
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    <CheckCircle2 className="size-3" />
                    {simulationResult.isValidJson ? "JSON Válido" : "Texto Plano"}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        simulationResult.parsedResponse
                          ? JSON.stringify(simulationResult.parsedResponse, null, 2)
                          : simulationResult.rawResponse,
                      )
                    }
                    className="p-1 text-muted-foreground hover:text-foreground rounded"
                    title="Copiar respuesta"
                  >
                    {copiedResponse ? (
                      <Check className="size-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Sub-tabs: Respuesta vs Prompts Interpolados */}
            {simulationResult && (
              <div className="flex gap-2 border-b border-border pb-1">
                <button
                  type="button"
                  onClick={() => setActiveTabResult("response")}
                  className={`text-xs font-bold pb-1 transition-colors border-b-2 ${
                    activeTabResult === "response"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Respuesta Generada
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabResult("interpolated")}
                  className={`text-xs font-bold pb-1 transition-colors border-b-2 ${
                    activeTabResult === "interpolated"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Prompts Interpolados
                </button>
              </div>
            )}

            {/* Contenido del Resultado */}
            {simulationError ? (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{simulationError}</span>
              </div>
            ) : simulationResult ? (
              activeTabResult === "interpolated" ? (
                <div className="space-y-3 max-h-[420px] overflow-y-auto">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">
                      System Prompt Final:
                    </p>
                    <pre className="p-2.5 rounded-lg bg-background border border-border text-xs font-mono text-foreground whitespace-pre-wrap">
                      {simulationResult.interpolatedSystem}
                    </pre>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">
                      User Message Final:
                    </p>
                    <pre className="p-2.5 rounded-lg bg-background border border-border text-xs font-mono text-foreground whitespace-pre-wrap">
                      {simulationResult.interpolatedUser}
                    </pre>
                  </div>
                </div>
              ) : simulationResult.businessInterpretation ? (
                <div className="space-y-4">
                  {/* 1. Encabezado con Diagnóstico Claro */}
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-600 text-white shadow-2xs">
                        {simulationResult.businessInterpretation.actionBadge.label}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Certeza: {simulationResult.businessInterpretation.confidencePercent}% (
                        {simulationResult.businessInterpretation.confidenceBadge})
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-foreground">
                      {simulationResult.businessInterpretation.intentTitle}
                    </h3>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Área responsable: {simulationResult.businessInterpretation.departmentName}
                    </p>
                  </div>

                  {/* 2. Qué hará el sistema */}
                  <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      ¿Qué hará el sistema ante este mensaje?
                    </div>
                    <div className="font-bold text-foreground text-sm flex items-center gap-2">
                      {simulationResult.businessInterpretation.resolutionPath}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {simulationResult.businessInterpretation.summary}
                    </p>

                    {/* Entidades extraídas si existen */}
                    {simulationResult.businessInterpretation.extractedDetails &&
                      simulationResult.businessInterpretation.extractedDetails.length > 0 && (
                        <div className="pt-2.5 mt-2 border-t border-border flex flex-wrap gap-1.5">
                          {simulationResult.businessInterpretation.extractedDetails.map(
                            (det, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-background border border-border text-foreground"
                              >
                                <strong className="text-muted-foreground">{det.label}:</strong>{" "}
                                {det.value}
                              </span>
                            ),
                          )}
                        </div>
                      )}
                  </div>

                  {/* 3. Pestaña o Acordeón colapsable con el JSON técnico */}
                  <details className="mt-2 text-xs text-muted-foreground group">
                    <summary className="cursor-pointer font-semibold hover:text-foreground transition-colors list-none flex items-center gap-1.5 py-1">
                      <ChevronRight className="size-3.5 transition-transform group-open:rotate-90 text-primary" />
                      Ver JSON técnico para programadores
                    </summary>
                    <pre className="p-3 mt-2 bg-slate-950 text-emerald-400 rounded-lg overflow-x-auto font-mono text-xs border border-slate-800 leading-relaxed max-h-[300px]">
                      {JSON.stringify(
                        simulationResult.parsedResponse || simulationResult.rawResponse,
                        null,
                        2,
                      )}
                    </pre>
                  </details>
                </div>
              ) : (
                <pre className="p-3 bg-slate-950 text-slate-100 rounded-lg text-xs font-mono border border-slate-800 overflow-x-auto max-h-[350px] whitespace-pre-wrap leading-relaxed">
                  {simulationResult.parsedResponse
                    ? JSON.stringify(simulationResult.parsedResponse, null, 2)
                    : simulationResult.rawResponse}
                </pre>
              )
            ) : (
              <div className="py-12 text-center text-muted-foreground text-xs space-y-1">
                <Layers className="size-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="font-semibold text-foreground">Sin simulación reciente</p>
                <p>Completa las variables de prueba y presiona "Probar Simulación en Vivo".</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
