import { useState, useMemo, useEffect } from "react";
import { X, Plus, Trash2, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type {
  WhatsAppTemplate,
  TemplateCategory,
  HeaderType,
  ButtonType,
  TemplateButton,
} from "../domain/template";
import { extractTemplateVariables, validateMetaTemplateName } from "../domain/template";
import { WhatsAppBubblePreview } from "./WhatsAppBubblePreview";
import type { CreateTemplatePayload } from "../infrastructure/templates.gateway";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTemplatePayload) => Promise<unknown>;
  initialData?: WhatsAppTemplate | null;
};

export function TemplateWizardModal({ isOpen, onClose, onSubmit, initialData }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Paso 1: Datos generales
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("UTILITY");
  const [language, setLanguage] = useState("es");

  // Paso 2: Componentes
  const [headerType, setHeaderType] = useState<HeaderType>("NONE");
  const [headerText, setHeaderText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [buttons, setButtons] = useState<TemplateButton[]>([]);

  // Paso 3: Variables de prueba para la previsualización
  const [sampleVars, setSampleVars] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Pre-poblar si se pasa initialData (ej. Duplicar para corregir plantilla rechazada)
  useEffect(() => {
    if (initialData) {
      setName(`${initialData.name}_v2`);
      setCategory(initialData.category);
      setLanguage(initialData.language || "es");
      setHeaderType(initialData.components.header?.type || "NONE");
      setHeaderText(initialData.components.header?.text || "");
      setBodyText(initialData.components.body?.text || "");
      setFooterText(initialData.components.footer?.text || "");
      setButtons(initialData.components.buttons || []);
    } else {
      setName("");
      setCategory("UTILITY");
      setLanguage("es");
      setHeaderType("NONE");
      setHeaderText("");
      setBodyText("");
      setFooterText("");
      setButtons([]);
    }
    setStep(1);
  }, [initialData, isOpen]);

  // Detector de variables en el body
  const detectedVariables = useMemo(() => {
    return extractTemplateVariables(bodyText);
  }, [bodyText]);

  // Actualizar sampleVars cuando cambien las variables detectadas
  useEffect(() => {
    const updated: Record<string, string> = { ...sampleVars };
    detectedVariables.forEach((v) => {
      if (!updated[v]) {
        updated[v] = v === "1" ? "Carlos" : v === "2" ? "$50,000" : `Valor_${v}`;
      }
    });
    setSampleVars(updated);
  }, [detectedVariables]);

  const nameValidation = useMemo(() => validateMetaTemplateName(name), [name]);

  if (!isOpen) return null;

  const handleInsertVariable = () => {
    const nextNum = detectedVariables.length + 1;
    setBodyText((prev) => `${prev} {{${nextNum}}}`);
  };

  const handleAddButton = (type: ButtonType) => {
    if (buttons.length >= 3) {
      toast.error("Meta permite un máximo de 3 botones por plantilla.");
      return;
    }
    setButtons((prev) => [
      ...prev,
      {
        type,
        text: type === "QUICK_REPLY" ? "Respuesta rápida" : "Ver sitio web",
        ctaType: type === "CALL_TO_ACTION" ? "URL" : undefined,
        url: type === "CALL_TO_ACTION" ? "https://netops.io" : undefined,
      },
    ]);
  };

  const handleRemoveButton = (index: number) => {
    setButtons((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (submitStatus: "draft" | "pending") => {
    if (!nameValidation.valid) {
      toast.error(nameValidation.error);
      setStep(1);
      return;
    }

    if (!bodyText.trim()) {
      toast.error("El cuerpo del mensaje es obligatorio.");
      setStep(2);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name,
        category,
        language,
        status: submitStatus,
        components: {
          header: headerType !== "NONE" ? { type: headerType, text: headerText } : undefined,
          body: { text: bodyText },
          footer: footerText.trim() ? { text: footerText } : undefined,
          buttons: buttons.length > 0 ? buttons : undefined,
        },
      });
      onClose();
    } catch {
      // Manejado en hook
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header modal */}
        <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              {initialData ? "Duplicar / Corregir Plantilla de WhatsApp" : "Nueva Plantilla de WhatsApp"}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Paso {step} de 3 — {step === 1 ? "Información Meta" : step === 2 ? "Diseño de Mensaje" : "Previsualización y Envío"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-lg hover:bg-foreground/10 grid place-items-center text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Stepper bar */}
        <div className="px-6 py-2 bg-background border-b border-border flex items-center gap-2 text-xs font-semibold">
          <div className={`flex items-center gap-1.5 ${step === 1 ? "text-primary font-bold" : "text-muted-foreground"}`}>
            <span className="size-5 rounded-full bg-primary/20 grid place-items-center text-[10px]">1</span>
            Nombre e Idioma
          </div>
          <span className="text-muted-foreground">/</span>
          <div className={`flex items-center gap-1.5 ${step === 2 ? "text-primary font-bold" : "text-muted-foreground"}`}>
            <span className="size-5 rounded-full bg-primary/20 grid place-items-center text-[10px]">2</span>
            Constructor de Componentes
          </div>
          <span className="text-muted-foreground">/</span>
          <div className={`flex items-center gap-1.5 ${step === 3 ? "text-primary font-bold" : "text-muted-foreground"}`}>
            <span className="size-5 rounded-full bg-primary/20 grid place-items-center text-[10px]">3</span>
            Preview & Meta Submit
          </div>
        </div>

        {/* Body Wizard Steps */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* PASO 1 */}
          {step === 1 && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Nombre de la Plantilla (Meta API) <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ej. recordatorio_pago_v2"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background font-mono focus:ring-2 focus:ring-primary outline-none"
                />
                {!nameValidation.valid && name.length > 0 && (
                  <p className="text-[11px] text-danger mt-1 flex items-center gap-1 font-semibold">
                    <AlertCircle className="size-3 shrink-0" />
                    {nameValidation.error}
                  </p>
                )}
                {nameValidation.valid && name.length > 0 && (
                  <p className="text-[11px] text-emerald-500 mt-1 flex items-center gap-1 font-semibold">
                    <CheckCircle className="size-3 shrink-0" /> Nombre válido según especificaciones de Meta.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background font-semibold"
                  >
                    <option value="UTILITY">Servicio / Utilidad (UTILITY)</option>
                    <option value="MARKETING">Promocional / Marketing (MARKETING)</option>
                    <option value="AUTHENTICATION">Autenticación / OTP (AUTHENTICATION)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Idioma Principal
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background font-semibold"
                  >
                    <option value="es">Español (es)</option>
                    <option value="en">Inglés (en)</option>
                    <option value="pt_BR">Portugués Brasil (pt_BR)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2 */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Header section */}
              <div className="p-4 border border-border rounded-xl bg-background space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                    1. Encabezado (Header) — Opcional
                  </h4>
                  <select
                    value={headerType}
                    onChange={(e) => setHeaderType(e.target.value as HeaderType)}
                    className="px-2.5 py-1 text-xs rounded border border-border bg-card font-semibold"
                  >
                    <option value="NONE">Sin encabezado</option>
                    <option value="TEXT">Texto</option>
                    <option value="IMAGE">Imagen</option>
                    <option value="VIDEO">Video</option>
                  </select>
                </div>

                {headerType === "TEXT" && (
                  <input
                    type="text"
                    placeholder="Texto del encabezado (ej. Aviso de servicio)"
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-border bg-card"
                  />
                )}
              </div>

              {/* Body Section */}
              <div className="p-4 border border-border rounded-xl bg-background space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-foreground flex items-center gap-1.5">
                    2. Cuerpo del Mensaje (Body) <span className="text-danger">*</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono font-bold">
                      {detectedVariables.length} variable(s) detectadas
                    </span>
                    <button
                      type="button"
                      onClick={handleInsertVariable}
                      className="px-2.5 py-1 rounded bg-primary/15 hover:bg-primary/25 text-primary text-[11px] font-bold flex items-center gap-1"
                    >
                      <Plus className="size-3" /> Insertar variable
                    </button>
                  </div>
                </div>

                <textarea
                  rows={4}
                  placeholder="Escribe el mensaje. Puedes usar variables dinámicas como {{1}}, {{2}}..."
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full p-3 text-xs font-mono rounded-lg border border-border bg-card leading-relaxed outline-none focus:ring-2 focus:ring-primary"
                />

                {detectedVariables.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                    <span>Variables encontradas:</span>
                    {detectedVariables.map((v) => (
                      <span key={v} className="px-1.5 py-0.5 rounded bg-card border border-border text-foreground font-bold">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Section */}
              <div className="p-4 border border-border rounded-xl bg-background space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                  3. Pie de página (Footer) — Opcional
                </h4>
                <input
                  type="text"
                  maxLength={60}
                  placeholder="Texto pequeño en la parte inferior (máx 60 caracteres)"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-border bg-card"
                />
              </div>

              {/* Buttons Section */}
              <div className="p-4 border border-border rounded-xl bg-background space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                    4. Botones interactivos — Máximo 3
                  </h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddButton("QUICK_REPLY")}
                      className="px-2.5 py-1 rounded border border-border hover:bg-card text-[10px] font-bold"
                    >
                      + Respuesta rápida
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddButton("CALL_TO_ACTION")}
                      className="px-2.5 py-1 rounded border border-border hover:bg-card text-[10px] font-bold text-primary"
                    >
                      + Call to Action (URL)
                    </button>
                  </div>
                </div>

                {buttons.length > 0 ? (
                  <div className="space-y-2">
                    {buttons.map((btn, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg text-xs">
                        <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
                          {btn.type}
                        </span>
                        <input
                          type="text"
                          value={btn.text}
                          onChange={(e) => {
                            const updated = [...buttons];
                            updated[idx].text = e.target.value;
                            setButtons(updated);
                          }}
                          placeholder="Texto del botón"
                          className="flex-1 px-2 py-1 text-xs rounded border border-border bg-background"
                        />
                        {btn.type === "CALL_TO_ACTION" && (
                          <input
                            type="text"
                            value={btn.url || ""}
                            onChange={(e) => {
                              const updated = [...buttons];
                              updated[idx].url = e.target.value;
                              setButtons(updated);
                            }}
                            placeholder="https://..."
                            className="w-48 px-2 py-1 text-xs font-mono rounded border border-border bg-background"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveButton(idx)}
                          className="p-1 rounded text-danger hover:bg-danger/10"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">Sin botones configurados.</p>
                )}
              </div>
            </div>
          )}

          {/* PASO 3 */}
          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-6 space-y-4">
                <div className="bg-background border border-border rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    Resumen de Configuración
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Nombre Meta:</p>
                      <p className="font-bold text-primary">{name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Categoría / Idioma:</p>
                      <p className="font-bold">{category} / {language}</p>
                    </div>
                  </div>
                </div>

                {detectedVariables.length > 0 && (
                  <div className="bg-background border border-border rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Probar Variables de Previsualización
                    </h4>
                    <div className="space-y-2">
                      {detectedVariables.map((v) => (
                        <div key={v} className="flex items-center gap-2 text-xs font-mono">
                          <span className="w-12 font-bold text-primary">{`{{${v}}}`}:</span>
                          <input
                            type="text"
                            value={sampleVars[v] || ""}
                            onChange={(e) =>
                              setSampleVars({ ...sampleVars, [v]: e.target.value })
                            }
                            className="flex-1 px-2.5 py-1 rounded border border-border bg-card"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-6">
                <WhatsAppBubblePreview
                  components={{
                    header: headerType !== "NONE" ? { type: headerType, text: headerText } : undefined,
                    body: { text: bodyText },
                    footer: footerText ? { text: footerText } : undefined,
                    buttons,
                  }}
                  sampleVariables={sampleVars}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="px-4 py-2 rounded-lg border border-border text-xs font-bold uppercase flex items-center gap-1.5 hover:bg-background"
              >
                <ArrowLeft className="size-3.5" /> Anterior
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step < 3 ? (
              <button
                type="button"
                disabled={step === 1 && !nameValidation.valid}
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-extrabold uppercase flex items-center gap-1.5 disabled:opacity-40 shadow-md"
              >
                Siguiente <ArrowRight className="size-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSave("draft")}
                  className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-background text-xs font-extrabold uppercase disabled:opacity-40"
                >
                  Guardar Borrador
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSave("pending")}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold uppercase disabled:opacity-40 shadow-lg flex items-center gap-1.5"
                >
                  <CheckCircle className="size-4" /> Enviar a Meta (Pending)
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
