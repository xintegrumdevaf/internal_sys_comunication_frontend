import { useState, useMemo } from "react";
import { X, Upload, Send, DollarSign, Users, AlertCircle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import type { WhatsAppTemplate } from "../domain/template";
import { extractTemplateVariables } from "../domain/template";
import { buildCampaignRecipients, estimateCampaignCost, parseCsvText } from "../domain/campaign";
import { WhatsAppBubblePreview } from "./WhatsAppBubblePreview";
import type { CreateCampaignPayload } from "../infrastructure/campaigns.gateway";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  approvedTemplates: WhatsAppTemplate[];
  onSubmit: (payload: CreateCampaignPayload) => Promise<unknown>;
};

export function CampaignLaunchModal({ isOpen, onClose, approvedTemplates, onSubmit }: Props) {
  const [campaignName, setCampaignName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [area, setArea] = useState("Cartera");
  const [inputMode, setInputMode] = useState<"csv" | "manual">("csv");

  // CSV State
  const [csvContent, setCsvContent] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [phoneColumn, setPhoneColumn] = useState("");
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Manual input state
  const [manualInput, setManualInput] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const selectedTemplate = useMemo(() => {
    return approvedTemplates.find((t) => t.id === selectedTemplateId) || null;
  }, [approvedTemplates, selectedTemplateId]);

  const templateVariables = useMemo(() => {
    if (!selectedTemplate) return [];
    return extractTemplateVariables(selectedTemplate.components.body.text);
  }, [selectedTemplate]);

  // Manejador de archivo CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);

      const { headers, rows } = parseCsvText(text);
      setCsvHeaders(headers);
      setCsvRows(rows);

      if (headers.length > 0) {
        // Auto-seleccionar columna de teléfono si contiene 'tel', 'phone', 'movil'
        const foundPhone = headers.find((h) => /tel|phone|cel|movil|numero/i.test(h));
        setPhoneColumn(foundPhone || headers[0]);

        // Auto-mapear variables si coinciden
        const autoMap: Record<string, string> = {};
        templateVariables.forEach((v, idx) => {
          const matchedHeader = headers[idx + 1] || headers[idx] || "";
          autoMap[v] = matchedHeader;
        });
        setColumnMapping(autoMap);
      }
    };
    reader.readAsText(file);
  };

  // Parsear destinatarios finales según modo
  const parsedRecipientsResult = useMemo(() => {
    if (inputMode === "csv") {
      if (csvRows.length === 0 || !phoneColumn) {
        return { recipients: [], invalidRows: 0 };
      }
      return buildCampaignRecipients(csvRows, phoneColumn, columnMapping);
    } else {
      // Manual input
      if (!manualInput.trim()) return { recipients: [], invalidRows: 0 };
      const lines = manualInput.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const rows: Record<string, string>[] = lines.map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        const row: Record<string, string> = { phone: parts[0] || "" };
        templateVariables.forEach((v, idx) => {
          row[`var_${v}`] = parts[idx + 1] || "";
        });
        return row;
      });

      const manualMapping: Record<string, string> = {};
      templateVariables.forEach((v) => {
        manualMapping[v] = `var_${v}`;
      });

      return buildCampaignRecipients(rows, "phone", manualMapping);
    }
  }, [inputMode, csvRows, phoneColumn, columnMapping, manualInput, templateVariables]);

  const estimatedCost = useMemo(() => {
    return estimateCampaignCost(parsedRecipientsResult.recipients.length);
  }, [parsedRecipientsResult.recipients]);

  // Variables para la primera fila de vista previa
  const sampleVariablesForPreview = useMemo(() => {
    if (parsedRecipientsResult.recipients.length === 0) return {};
    return parsedRecipientsResult.recipients[0].variables;
  }, [parsedRecipientsResult.recipients]);

  if (!isOpen) return null;

  const handlePrepareSend = () => {
    if (!campaignName.trim()) {
      toast.error("Ingresa un nombre para la campaña");
      return;
    }
    if (!selectedTemplateId) {
      toast.error("Selecciona una plantilla aprobada");
      return;
    }
    if (parsedRecipientsResult.recipients.length === 0) {
      toast.error("Debes cargar al menos un destinatario válido");
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmSend = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        name: campaignName,
        templateId: selectedTemplateId,
        area,
        recipients: parsedRecipientsResult.recipients,
      });
      onClose();
    } catch {
      // Error manejado en hook
    } finally {
      setSubmitting(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="size-4 text-primary" />
            <h3 className="text-sm font-extrabold">Crear Nueva Campaña Masiva</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-lg hover:bg-foreground/10 grid place-items-center text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Formulario Principal */}
            <div className="md:col-span-7 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Nombre de la Campaña
                  </label>
                  <input
                    type="text"
                    placeholder="ej. recordatorio_pago_agosto"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background font-mono focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Área / Departamento
                  </label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background font-semibold"
                  >
                    <option value="Cartera">Cartera</option>
                    <option value="Soporte">Soporte Técnico</option>
                    <option value="UTGA">UTGA</option>
                    <option value="Administración">Administración</option>
                  </select>
                </div>
              </div>

              {/* Selector de plantilla (solo aprobadas) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Plantilla de WhatsApp (Solo Aprobadas Meta)
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background font-bold text-primary"
                >
                  <option value="">-- Seleccionar Plantilla --</option>
                  {approvedTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category} · {t.variables.length} vars)
                    </option>
                  ))}
                </select>
                {approvedTemplates.length === 0 && (
                  <p className="text-[11px] text-warning mt-1 flex items-center gap-1 font-semibold">
                    <AlertCircle className="size-3" /> No hay plantillas aprobadas. Crea o
                    sincroniza una primero.
                  </p>
                )}
              </div>

              {/* Carga de destinatarios */}
              <div className="border border-border rounded-xl p-4 bg-background space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Users className="size-3.5 text-primary" /> Destinatarios (
                    {parsedRecipientsResult.recipients.length})
                  </h4>
                  <div className="flex bg-card p-0.5 rounded-lg border border-border text-[11px]">
                    <button
                      type="button"
                      onClick={() => setInputMode("csv")}
                      className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                        inputMode === "csv"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      Archivo CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode("manual")}
                      className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                        inputMode === "manual"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      Entrada Manual
                    </button>
                  </div>
                </div>

                {inputMode === "csv" ? (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-4 text-center cursor-pointer bg-card/40 relative">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <FileSpreadsheet className="size-6 text-primary mx-auto mb-1" />
                      <p className="text-xs font-bold">Haz clic o arrastra un archivo .CSV</p>
                      <p className="text-[10px] text-muted-foreground">
                        Formato: Teléfono, Nombre, Variable2...
                      </p>
                    </div>

                    {/* Mapeador de columnas */}
                    {csvHeaders.length > 0 && (
                      <div className="p-3 bg-card border border-border rounded-lg space-y-2 text-xs">
                        <div className="flex justify-between items-center border-b border-border pb-1">
                          <span className="font-bold uppercase text-[10px] text-muted-foreground">
                            Mapeo de Columnas CSV
                          </span>
                          <span className="font-mono text-[10px] text-emerald-400">
                            {csvRows.length} filas detectadas
                          </span>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground mb-0.5">
                            Columna de Teléfono:
                          </label>
                          <select
                            value={phoneColumn}
                            onChange={(e) => setPhoneColumn(e.target.value)}
                            className="w-full px-2 py-1 text-xs rounded border border-border bg-background font-mono"
                          >
                            {csvHeaders.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>

                        {templateVariables.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <p className="text-[10px] font-bold text-muted-foreground">
                              Variables de la plantilla:
                            </p>
                            {templateVariables.map((v) => (
                              <div key={v} className="flex items-center gap-2 font-mono">
                                <span className="w-12 text-primary font-bold">{`{{${v}}}`}:</span>
                                <select
                                  value={columnMapping[v] || ""}
                                  onChange={(e) =>
                                    setColumnMapping({ ...columnMapping, [v]: e.target.value })
                                  }
                                  className="flex-1 px-2 py-1 text-xs rounded border border-border bg-background"
                                >
                                  <option value="">-- Sin mapear --</option>
                                  {csvHeaders.map((h) => (
                                    <option key={h} value={h}>
                                      {h}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      rows={5}
                      placeholder={`+573001234567, Carlos, $50.000\n+573009876543, Ana, $120.000`}
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      className="w-full p-2.5 text-xs font-mono rounded-lg border border-border bg-card outline-none"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Una fila por contacto. Separado por comas: Teléfono, Variable1, Variable2...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview interactivo del mensaje #1 */}
            <div className="md:col-span-5 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Vista Previa de Contacto #1
              </h4>

              {selectedTemplate ? (
                <WhatsAppBubblePreview
                  components={selectedTemplate.components}
                  sampleVariables={sampleVariablesForPreview}
                />
              ) : (
                <div className="h-64 rounded-2xl border border-dashed border-border grid place-items-center text-center p-4 text-muted-foreground text-xs">
                  Selecciona una plantilla aprobada para visualizar el mensaje de muestra.
                </div>
              )}

              {/* Resumen de costos */}
              <div className="p-3 bg-background border border-border rounded-xl space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Destinatarios válidos:</span>
                  <span className="font-bold text-foreground">
                    {parsedRecipientsResult.recipients.length}
                  </span>
                </div>
                {parsedRecipientsResult.invalidRows > 0 && (
                  <div className="flex justify-between items-center text-warning">
                    <span>Filas omitidas (inválidas):</span>
                    <span className="font-bold">{parsedRecipientsResult.invalidRows}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-border pt-1.5 font-bold">
                  <span className="flex items-center gap-1 text-primary">
                    <DollarSign className="size-3.5" /> Costo Estimado:
                  </span>
                  <span className="text-sm">${estimatedCost.toFixed(2)} USD</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Overlay */}
        {showConfirmation && (
          <div className="p-4 bg-warning/15 border-t border-warning/30 flex items-center justify-between text-xs font-semibold animate-fade-in">
            <div className="flex items-center gap-2 text-amber-300">
              <AlertCircle className="size-5 shrink-0" />
              <span>
                ¿Confirmas el envío de <strong>{parsedRecipientsResult.recipients.length}</strong>{" "}
                mensajes de WhatsApp a través de la API de Meta Cloud?
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="px-3 py-1.5 rounded border border-border bg-card text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleConfirmSend()}
                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase flex items-center gap-1"
              >
                <Send className="size-3.5" /> {submitting ? "Enviando..." : "Confirmar y Enviar"}
              </button>
            </div>
          </div>
        )}

        {/* Footer controls */}
        {!showConfirmation && (
          <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-xs font-bold uppercase"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={parsedRecipientsResult.recipients.length === 0 || !selectedTemplateId}
              onClick={handlePrepareSend}
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-extrabold uppercase disabled:opacity-40 shadow-lg flex items-center gap-1.5"
            >
              <Upload className="size-4" /> Continuar a Confirmación
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
