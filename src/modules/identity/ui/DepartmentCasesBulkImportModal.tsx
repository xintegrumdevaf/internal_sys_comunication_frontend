import React, { useState, useRef } from "react";
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Bot,
  UserCheck,
  X,
  Plus,
  RefreshCw,
  Layers,
} from "lucide-react";
import type { DepartmentHandlingMode } from "@/types/department";
import {
  downloadDepartmentCasesTemplate,
  parseDepartmentCasesExcel,
  type ParsedDepartmentCase,
} from "../application/department-cases-excel";

export type ImportStrategy = "append" | "replace";

export interface DepartmentCasesBulkImportModalProps {
  open: boolean;
  onClose: () => void;
  departmentName?: string;
  departmentSlug?: string;
  existingCasesCount?: number;
  onImport: (
    cases: Array<{
      label: string;
      description: string;
      handlingMode: DepartmentHandlingMode;
      workflowType?: string;
      active?: boolean;
    }>,
    strategy: ImportStrategy,
  ) => Promise<boolean | void> | boolean | void;
}

export function DepartmentCasesBulkImportModal({
  open,
  onClose,
  departmentName,
  departmentSlug,
  existingCasesCount = 0,
  onImport,
}: DepartmentCasesBulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedCases, setParsedCases] = useState<ParsedDepartmentCase[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<ImportStrategy>("append");

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileProcess = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setErrors([]);
    try {
      const result = await parseDepartmentCasesExcel(selectedFile);
      setParsedCases(result.cases);
      setErrors(result.errors);
    } catch (err) {
      setErrors([
        err instanceof Error
          ? err.message
          : "Error al leer el archivo Excel. Verifica que no esté dañado o protegido con contraseña.",
      ]);
      setParsedCases([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileProcess(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleToggleMode = (index: number) => {
    setParsedCases((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        const nextMode: DepartmentHandlingMode =
          c.handlingMode === "ai_assisted" ? "human_direct" : "ai_assisted";
        return { ...c, handlingMode: nextMode };
      }),
    );
  };

  const handleRemoveRow = (index: number) => {
    setParsedCases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResetFile = () => {
    setFile(null);
    setParsedCases([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirm = async () => {
    if (parsedCases.length === 0) return;
    setIsSubmitting(true);
    try {
      const cleanCases = parsedCases.map((c) => ({
        label: c.label.trim(),
        description: c.description.trim(),
        handlingMode: c.handlingMode,
        workflowType: c.workflowType || "GENERAL_INQUIRY",
        active: true,
      }));

      await onImport(cleanCases, strategy);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const aiCount = parsedCases.filter((c) => c.handlingMode === "ai_assisted").length;
  const humanCount = parsedCases.filter((c) => c.handlingMode === "human_direct").length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-import-modal-title"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center border border-emerald-500/20 shrink-0">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <h3
                id="bulk-import-modal-title"
                className="text-sm font-bold text-foreground flex items-center gap-2"
              >
                Carga Masiva de Motivos y Casos
                {departmentName && (
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                    {departmentName}
                  </span>
                )}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Importa casos en bloque desde un archivo Excel para entrenar el modelo de IA o
                enrutar directamente.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Barra de ayuda y descarga de plantilla */}
          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="size-3.5" />
                Estructura compatible con tu formato Excel
              </div>
              <p className="text-[11px] text-muted-foreground">
                Columnas requeridas:{" "}
                <code className="font-mono text-[10px] bg-muted/60 px-1 py-0.5 rounded">
                  Nombre del caso
                </code>
                ,{" "}
                <code className="font-mono text-[10px] bg-muted/60 px-1 py-0.5 rounded">
                  Tipo de atención
                </code>{" "}
                (IA / Humano),{" "}
                <code className="font-mono text-[10px] bg-muted/60 px-1 py-0.5 rounded">
                  ¿Cómo lo dice el cliente?
                </code>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadDepartmentCasesTemplate(departmentSlug || departmentName)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] uppercase transition-colors shadow-xs cursor-pointer shrink-0"
            >
              <Download className="size-3.5" />
              Descargar Plantilla Excel
            </button>
          </div>

          {/* Zona de Drop / Carga de archivo */}
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 sm:p-8 rounded-xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2 ${
                isDragging
                  ? "border-emerald-500 bg-emerald-500/10 scale-[0.99]"
                  : "border-border hover:border-emerald-500/50 hover:bg-muted/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center mb-1">
                <UploadCloud className="size-6" />
              </div>
              <p className="font-bold text-foreground text-xs">
                Haz clic para seleccionar o arrastra tu archivo Excel aquí
              </p>
              <p className="text-[11px] text-muted-foreground">
                Formatos compatibles: .xlsx, .xls o .csv (máximo 10 MB)
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 truncate">
                <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center shrink-0">
                  <FileSpreadsheet className="size-4" />
                </div>
                <div className="truncate">
                  <div className="font-bold text-foreground text-xs truncate">{file.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB • {parsedCases.length} casos identificados
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetFile}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground text-[11px] font-medium hover:bg-muted transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw className="size-3" />
                Cambiar archivo
              </button>
            </div>
          )}

          {/* Spinner de parsing */}
          {isParsing && (
            <div className="p-6 text-center text-muted-foreground flex items-center justify-center gap-2">
              <div className="size-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <span>Procesando archivo y analizando casos...</span>
            </div>
          )}

          {/* Errores */}
          {errors.length > 0 && (
            <div className="p-3.5 rounded-xl border border-danger/30 bg-danger/10 text-danger text-[11px] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="size-3.5 shrink-0" />
                Advertencias al leer el archivo:
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Opciones y Vista Previa */}
          {parsedCases.length > 0 && (
            <div className="space-y-3 pt-1">
              {/* Resumen de casos encontrados */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">Vista previa de casos:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                    {parsedCases.length} detectados
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px] inline-flex items-center gap-1">
                    <Bot className="size-2.5" /> {aiCount} con IA
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] inline-flex items-center gap-1">
                    <UserCheck className="size-2.5" /> {humanCount} Directo a Humano
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  (Puedes cambiar el tipo de atención haciendo clic en su botón)
                </span>
              </div>

              {/* Selector de estrategia si ya existen casos */}
              {existingCasesCount > 0 && (
                <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-2">
                  <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <Layers className="size-3.5 text-primary" />
                    ¿Cómo deseas aplicar esta carga masiva?
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <label
                      className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                        strategy === "append"
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-border bg-card hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="importStrategy"
                        value="append"
                        checked={strategy === "append"}
                        onChange={() => setStrategy("append")}
                        className="mt-0.5 text-primary focus:ring-primary"
                      />
                      <div className="space-y-0.5">
                        <div className="font-bold text-foreground text-[11px]">
                          Agregar a los existentes
                        </div>
                        <div className="text-[10px] text-muted-foreground leading-tight">
                          Conserva los {existingCasesCount} casos actuales y suma los{" "}
                          {parsedCases.length} nuevos (Total:{" "}
                          {existingCasesCount + parsedCases.length}).
                        </div>
                      </div>
                    </label>

                    <label
                      className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                        strategy === "replace"
                          ? "border-amber-500 bg-amber-500/10 shadow-xs"
                          : "border-border bg-card hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="importStrategy"
                        value="replace"
                        checked={strategy === "replace"}
                        onChange={() => setStrategy("replace")}
                        className="mt-0.5 text-amber-500 focus:ring-amber-500"
                      />
                      <div className="space-y-0.5">
                        <div className="font-bold text-foreground text-[11px]">
                          Reemplazar casos actuales
                        </div>
                        <div className="text-[10px] text-muted-foreground leading-tight">
                          Elimina los {existingCasesCount} casos anteriores y deja únicamente los{" "}
                          {parsedCases.length} del archivo Excel.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Tabla interactiva de filas */}
              <div className="border border-border rounded-xl overflow-hidden shadow-xs">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-muted/50 sticky top-0 border-b border-border z-10">
                      <tr>
                        <th className="py-2 px-3 font-bold text-muted-foreground w-10">#</th>
                        <th className="py-2 px-3 font-bold text-muted-foreground w-1/3">
                          Nombre del Caso
                        </th>
                        <th className="py-2 px-3 font-bold text-muted-foreground w-40">
                          Tipo de Atención
                        </th>
                        <th className="py-2 px-3 font-bold text-muted-foreground">
                          ¿Cómo lo dice el cliente?
                        </th>
                        <th className="py-2 px-2 font-bold text-muted-foreground w-8 text-center">
                          Quitar
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 bg-card">
                      {parsedCases.map((caseItem, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2 px-3 text-muted-foreground font-mono text-[10px]">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-bold text-foreground">{caseItem.label}</span>
                            {caseItem.warning && (
                              <span className="block text-[9px] text-amber-600 dark:text-amber-400">
                                ⚠ {caseItem.warning}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <button
                              type="button"
                              onClick={() => handleToggleMode(idx)}
                              title="Haz clic para alternar tipo de atención"
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                caseItem.handlingMode === "human_direct"
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 border border-amber-500/30"
                                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30"
                              }`}
                            >
                              {caseItem.handlingMode === "human_direct" ? (
                                <>
                                  <UserCheck className="size-2.5" /> Directo
                                </>
                              ) : (
                                <>
                                  <Bot className="size-2.5" /> Asistido IA
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-2 px-3 text-[11px] text-muted-foreground whitespace-pre-line line-clamp-3">
                            {caseItem.description}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="p-1 rounded text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                              title="Excluir este caso de la importación"
                              aria-label={`Excluir caso ${caseItem.label}`}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie del modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/20">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={parsedCases.length === 0 || isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold uppercase transition-colors shadow-xs cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="size-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Importando...</span>
              </>
            ) : (
              <>
                <Plus className="size-3.5" />
                <span>
                  Importar {parsedCases.length} {parsedCases.length === 1 ? "Caso" : "Casos"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
