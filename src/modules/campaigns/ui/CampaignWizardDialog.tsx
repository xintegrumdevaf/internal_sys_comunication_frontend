import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  MessageSquare,
  Users,
  GitBranch,
  Upload,
  Download,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  LayoutTemplate,
  Sparkles,
} from "lucide-react";
import { CampaignPreviewPanel } from "./CampaignPreviewPanel";
import { useCampaignWizard } from "../application/use-campaign-wizard";
import { useCreateCampaign } from "../application/use-campaigns";
import { useMessageTemplates } from "@/modules/message-templates/application/use-message-templates";
import { templateCategoryLabel } from "@/modules/message-templates/domain/message-template";
import { useDepartmentsQuery, useDirectoryUsers } from "@/modules/identity/application/use-session";

type CampaignWizardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCampaignCreated?: () => void;
};

export const CampaignWizardDialog: React.FC<CampaignWizardDialogProps> = ({
  open,
  onOpenChange,
  onCampaignCreated,
}) => {
  const wizard = useCampaignWizard();
  const { createCampaign, isSubmitting } = useCreateCampaign();
  const { templates: availableTemplates, loading: loadingTemplates } = useMessageTemplates();
  const { data: realDepartments, isLoading: loadingDepts } = useDepartmentsQuery();
  const realDirectoryUsers = useDirectoryUsers();

  const approvedTemplates = useMemo(() => {
    return availableTemplates.filter((t) => t.status === "APPROVED");
  }, [availableTemplates]);

  const handleFormSubmit = async () => {
    if (!wizard.canSubmit) return;

    try {
      await createCampaign(
        {
          name: wizard.name,
          messageText: wizard.messageText,
          templateId: wizard.selectedTemplate?.id,
          templateName: wizard.selectedTemplate?.name,
          quickMode: wizard.quickMode,
          intervalSeconds: wizard.intervalSeconds,
          recipients: wizard.importedRecipients,
          routingConfig: wizard.routingConfig,
          variableMapping: wizard.columnMapping,
          contactConfig: {
            tags: [],
            customFields: [],
            forceContactUpdate: false,
          },
        },
        wizard.importedFile,
      );
      toast.success("Campaña creada correctamente");
      wizard.resetWizard();
      onOpenChange(false);
      onCampaignCreated?.();
    } catch (err) {
      console.error("Error creating campaign:", err);
      toast.error(err instanceof Error ? err.message : "Error al crear la campaña");
    }
  };

  const handleDownloadExample = () => {
    const csvContent =
      "number,name,body,city\n+573001234567,Carlos Pérez,Hola Carlos,Bogotá\n+573009876543,Ana Gómez,Hola Ana,Medellín\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "destinatarios_ejemplo.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/20">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Nueva campaña
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configura el mensaje, los destinatarios y el enrutamiento de los chats.
          </p>
        </DialogHeader>

        {/* Wizard Main Grid */}
        <div className="flex min-h-[520px] max-h-[70vh]">
          {/* Navigation Sidebar */}
          <div className="w-56 bg-muted/20 border-r border-border p-3 flex flex-col gap-1.5 shrink-0 select-none">
            <button
              type="button"
              className={cx(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left",
                wizard.activeStep === 1
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "hover:bg-muted/80 text-muted-foreground",
              )}
              onClick={() => wizard.setActiveStep(1)}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Mensaje
              </div>
              {wizard.step1Pending && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              )}
            </button>

            <button
              type="button"
              className={cx(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left",
                wizard.activeStep === 2
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "hover:bg-muted/80 text-muted-foreground",
              )}
              onClick={() => wizard.setActiveStep(2)}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Destinatarios
              </div>
              {wizard.step2Pending && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              )}
            </button>

            <button
              type="button"
              className={cx(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left",
                wizard.activeStep === 3
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "hover:bg-muted/80 text-muted-foreground",
              )}
              onClick={() => wizard.setActiveStep(3)}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Enrutamiento
                </div>
                <span className="text-[9px] uppercase tracking-wider opacity-70 ml-6">
                  AVANZADO
                </span>
              </div>
            </button>
          </div>

          {/* Step Body */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* STEP 1: MENSAJE */}
            {wizard.activeStep === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Nombre de la campaña <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {wizard.name.length}/50
                      </span>
                    </div>
                    <Input
                      placeholder="Ej.: Reactivación de clientes inactivos"
                      value={wizard.name}
                      onChange={(e) => wizard.setName(e.target.value)}
                      maxLength={50}
                      className="text-xs"
                    />
                    {!wizard.nameValidation.valid && wizard.name && (
                      <p className="text-[11px] text-red-500 mt-1">{wizard.nameValidation.error}</p>
                    )}
                  </div>

                  {/* Selector de Plantilla Aprobada Meta */}
                  <div className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-3 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 truncate">
                          <LayoutTemplate className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">Plantilla de WhatsApp (Meta)</span>
                        </label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">
                              Selecciona una plantilla creada y aprobada en el módulo de Plantillas.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      {wizard.selectedTemplate && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1 shrink-0 whitespace-nowrap px-2 py-0.5"
                        >
                          <CheckCircle2 className="w-3 h-3 shrink-0" /> Aprobada por Meta
                        </Badge>
                      )}
                    </div>

                    <Select
                      value={wizard.selectedTemplate?.id || ""}
                      onValueChange={(val) => {
                        const found = availableTemplates.find((t) => t.id === val);
                        if (found) wizard.handleSelectTemplate(found);
                      }}
                    >
                      <SelectTrigger className="w-full text-xs h-9 bg-background min-w-0">
                        <SelectValue
                          placeholder={
                            loadingTemplates
                              ? "Cargando plantillas..."
                              : "Seleccionar plantilla aprobada..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-card text-card-foreground border-border shadow-2xl z-[9999] max-h-80 w-[var(--radix-select-trigger-width)]">
                        {approvedTemplates.length > 0 && (
                          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded my-1">
                            Plantillas Aprobadas por Meta
                          </div>
                        )}
                        {approvedTemplates.map((tpl) => (
                          <SelectItem
                            key={tpl.id}
                            value={tpl.id}
                            className="text-xs cursor-pointer py-2"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-mono text-primary font-bold truncate">
                                {tpl.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate shrink-0">
                                ({templateCategoryLabel(tpl.category)})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                        {availableTemplates.filter((t) => t.status !== "APPROVED").length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/60 rounded my-1">
                              Otras plantillas
                            </div>
                            {availableTemplates
                              .filter((t) => t.status !== "APPROVED")
                              .map((tpl) => (
                                <SelectItem
                                  key={tpl.id}
                                  value={tpl.id}
                                  className="text-xs cursor-pointer py-2"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="font-mono text-muted-foreground truncate">
                                      {tpl.name}
                                    </span>
                                    <span className="text-[10px] opacity-75 shrink-0">
                                      ({tpl.status})
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>

                    {!wizard.selectedTemplate && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                        <span>
                          Es obligatorio seleccionar una plantilla aprobada por Meta para crear una
                          campaña masiva.
                        </span>
                      </div>
                    )}

                    {/* Card de plantilla seleccionada & edición de variables */}
                    {wizard.selectedTemplate && (
                      <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 space-y-2.5 min-w-0">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0 truncate">
                            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="font-bold text-foreground font-mono truncate">
                              {wizard.selectedTemplate.name}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 bg-emerald-500/15 text-emerald-600 border-0 shrink-0"
                            >
                              {templateCategoryLabel(wizard.selectedTemplate.category)}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => wizard.handleClearTemplate()}
                            className="h-6 text-[10px] text-muted-foreground hover:text-primary px-1.5 shrink-0 whitespace-nowrap"
                          >
                            Cambiar plantilla
                          </Button>
                        </div>

                        {wizard.selectedTemplate.variables &&
                          wizard.selectedTemplate.variables.length > 0 && (
                            <div className="pt-2 border-t border-emerald-500/20 space-y-2">
                              <label className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 block">
                                Valores de muestra para variables de plantilla:
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {wizard.selectedTemplate.variables.map((varKey) => (
                                  <div key={varKey} className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold w-12 shrink-0">
                                      {"{{" + varKey + "}}"}:
                                    </span>
                                    <Input
                                      placeholder={`Ej. Valor variable ${varKey}...`}
                                      value={wizard.templateVariableValues[varKey] || ""}
                                      onChange={(e) =>
                                        wizard.handleUpdateVariableValue(varKey, e.target.value)
                                      }
                                      className="h-7 text-xs bg-background/80"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Modo Rápido Switch */}
                  <div className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-semibold cursor-pointer text-foreground">
                          Modo rápido
                        </label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">
                              Determina el tiempo de espera fijo entre el envío de cada mensaje.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Switch checked={wizard.quickMode} onCheckedChange={wizard.setQuickMode} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {wizard.quickMode
                        ? "Envío acelerado activado: Se enviará 1 mensaje cada 7 segundos."
                        : "Modo estándar activado: Se enviará 1 mensaje cada 45 segundos."}
                    </p>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">
                        Tiempo de espera entre mensajes:
                      </span>
                      <Badge
                        variant="secondary"
                        className="font-mono font-bold text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-2.5 py-0.5 shrink-0"
                      >
                        {wizard.quickMode ? "7 segundos" : "45 segundos"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Right Live Preview Panel */}
                <div className="h-full min-h-[340px]">
                  <CampaignPreviewPanel
                    messageText={wizard.messageText}
                    name={wizard.name}
                    selectedTemplate={wizard.selectedTemplate}
                    variableValues={wizard.templateVariableValues}
                  />
                </div>
              </div>
            )}

            {/* STEP 2: DESTINATARIOS */}
            {wizard.activeStep === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                <div className="space-y-4">
                  {/* Cargar Planilla Box (Se muestra SOLO si NO se ha cargado un archivo) */}
                  {wizard.importSummary.total === 0 ? (
                    <div className="p-6 border-2 border-dashed border-border rounded-xl bg-muted/10 text-center hover:bg-muted/20 transition-colors flex flex-col items-center justify-center min-h-[220px]">
                      <FileSpreadsheet className="w-10 h-10 text-primary mb-2 opacity-80" />
                      <h3 className="text-sm font-bold text-foreground">
                        Importa la planilla de contactos
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        Archivo .xlsx o .csv con las columnas{" "}
                        <code className="font-mono text-primary">number</code> (requerida),{" "}
                        <code className="font-mono text-muted-foreground">name</code> y{" "}
                        <code className="font-mono text-muted-foreground">body</code> (opcionales).
                      </p>

                      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                        <label className="cursor-pointer">
                          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity">
                            <Upload className="w-4 h-4" />
                            Importar planilla
                          </span>
                          <input
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) wizard.handleProcessFile(file);
                            }}
                          />
                        </label>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleDownloadExample}
                          className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Descargar archivo de muestra
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Tarjeta de Archivo Cargado (Se muestra cuando YA se cargó la planilla) */
                    <div className="space-y-3">
                      <div
                        className={cx(
                          "p-3.5 rounded-xl border space-y-2 transition-colors",
                          wizard.importSummary.valid === 0
                            ? "border-red-500/40 bg-red-500/5"
                            : "border-emerald-500/30 bg-emerald-500/5",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={cx(
                                "size-9 rounded-lg grid place-items-center shrink-0",
                                wizard.importSummary.valid === 0
                                  ? "bg-red-500/15 text-red-600 dark:text-red-400"
                                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                              )}
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-foreground font-mono truncate">
                                  {wizard.importedFile?.name || "Planilla de contactos cargada"}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className={cx(
                                    "text-[10px] px-1.5 py-0 border-0 shrink-0 font-semibold",
                                    wizard.importSummary.valid === 0
                                      ? "bg-red-500/15 text-red-600 dark:text-red-400"
                                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                                  )}
                                >
                                  {wizard.importSummary.valid} contactos válidos
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                Total de filas procesadas: {wizard.importSummary.total}
                                {wizard.importSummary.invalid > 0 && (
                                  <span className="text-red-500 ml-1">
                                    ({wizard.importSummary.invalid} con errores)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <label className="cursor-pointer shrink-0">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors shadow-xs">
                              <Upload className="w-3.5 h-3.5" />
                              Cambiar archivo
                            </span>
                            <input
                              type="file"
                              accept=".csv, .xlsx, .xls"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) wizard.handleProcessFile(file);
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {wizard.importSummary.total > 0 && wizard.importSummary.valid === 0 && (
                        <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                          <div className="space-y-1">
                            <h5 className="font-bold">Sin contactos válidos para el envío</h5>
                            <p className="text-[11px] opacity-90 leading-normal">
                              El archivo cargado contiene {wizard.importSummary.total} filas, pero
                              ninguna posee un número de teléfono válido (mínimo 8 dígitos). Por
                              favor corrige el archivo antes de continuar.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mapeo de Variables de Plantilla con Columnas de Excel */}
                  {wizard.selectedTemplate?.variables &&
                    wizard.selectedTemplate.variables.length > 0 &&
                    wizard.csvHeaders.length > 0 && (
                      <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                          <h4 className="text-xs font-bold text-foreground">
                            Mapeo de variables con columnas del Excel
                          </h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Asocia cada variable de tu plantilla de Meta con la columna
                          correspondiente de tu archivo:
                        </p>
                        <div className="space-y-2 pt-1">
                          {wizard.selectedTemplate.variables.map((vKey) => (
                            <div
                              key={vKey}
                              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-background border border-border min-w-0"
                            >
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Badge
                                  variant="outline"
                                  className="font-mono font-bold text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-2 py-0.5"
                                >
                                  {"{{" + vKey + "}}"}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
                                  se asocia a:
                                </span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <Select
                                  value={wizard.columnMapping[vKey] || ""}
                                  onValueChange={(header) =>
                                    wizard.handleUpdateColumnMapping(vKey, header)
                                  }
                                >
                                  <SelectTrigger className="h-8 text-xs font-semibold bg-card border-border w-full min-w-0">
                                    <SelectValue placeholder="Seleccionar columna del Excel..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-card text-card-foreground border-border shadow-2xl z-[9999] max-h-60">
                                    {wizard.csvHeaders.map((header) => (
                                      <SelectItem
                                        key={header}
                                        value={header}
                                        className="text-xs cursor-pointer py-2"
                                      >
                                        <div className="flex items-center gap-2 truncate">
                                          <FileSpreadsheet className="w-3.5 h-3.5 text-primary shrink-0 opacity-70" />
                                          <span className="truncate">
                                            Columna:{" "}
                                            <strong className="font-bold text-foreground">
                                              {header}
                                            </strong>
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Preview Table of First Rows */}
                  {(wizard.importedRecipients.length > 0 || wizard.previewRows.length > 0) && (
                    <div>
                      <h4 className="text-xs font-bold mb-2 text-foreground">
                        Vista previa de contactos (primeras filas)
                      </h4>
                      <div className="rounded-lg border border-border overflow-hidden">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px]">
                            <tr>
                              <th className="p-2 font-semibold">Número</th>
                              <th className="p-2 font-semibold">Nombre</th>
                              <th className="p-2 font-semibold">Variables / Mensaje</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {wizard.importedRecipients.length > 0
                              ? wizard.importedRecipients.slice(0, 5).map((r, i) => (
                                  <tr key={i} className="hover:bg-muted/10">
                                    <td className="p-2 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                      {r.number}
                                    </td>
                                    <td className="p-2 font-medium">{r.name || "—"}</td>
                                    <td className="p-2 text-muted-foreground truncate max-w-[180px]">
                                      {r.variables && Object.keys(r.variables).length > 0
                                        ? Object.entries(r.variables)
                                            .map(([k, v]) => `{{${k}}}: ${v}`)
                                            .join(" | ")
                                        : r.body || "—"}
                                    </td>
                                  </tr>
                                ))
                              : wizard.previewRows.slice(0, 5).map((r, i) => {
                                  const phoneVal =
                                    r.number || r.telefono || r.phone || Object.values(r)[0] || "—";
                                  const nameVal = r.name || r.nombre || Object.values(r)[1] || "—";
                                  const bodyVal = r.body || r.mensaje || "—";
                                  return (
                                    <tr key={i} className="hover:bg-muted/10">
                                      <td className="p-2 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                        {phoneVal}
                                      </td>
                                      <td className="p-2 font-medium">{nameVal}</td>
                                      <td className="p-2 text-muted-foreground truncate max-w-[180px]">
                                        {bodyVal}
                                      </td>
                                    </tr>
                                  );
                                })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Live Preview Panel */}
                <div className="h-full min-h-[340px]">
                  <CampaignPreviewPanel
                    messageText={wizard.messageText}
                    name={wizard.name}
                    selectedTemplate={wizard.selectedTemplate}
                    variableValues={wizard.templateVariableValues}
                  />
                </div>
              </div>
            )}

            {/* STEP 3: ENRUTAMIENTO DEL CHAT (AVANZADO) */}
            {wizard.activeStep === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Define cómo se crea el chat de cada contacto. Vale para toda la campaña.
                  </p>

                  {/* Estado del chat al crear */}
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-2">
                      Estado del chat al crear
                    </label>
                    <div className="grid grid-cols-3 gap-2 p-1 rounded-xl border border-border bg-muted/10">
                      <button
                        type="button"
                        onClick={() =>
                          wizard.setRoutingConfig((prev) => ({ ...prev, chatStatus: "open" }))
                        }
                        className={cx(
                          "py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5",
                          wizard.routingConfig.chatStatus === "open"
                            ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                            : "text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Abierto
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          wizard.setRoutingConfig((prev) => ({ ...prev, chatStatus: "pending" }))
                        }
                        className={cx(
                          "py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5",
                          wizard.routingConfig.chatStatus === "pending"
                            ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                            : "text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        En espera
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          wizard.setRoutingConfig((prev) => ({ ...prev, chatStatus: "closed" }))
                        }
                        className={cx(
                          "py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5",
                          wizard.routingConfig.chatStatus === "closed"
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Cerrado
                      </button>
                    </div>
                  </div>

                  {/* Departamento */}
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">
                      Departamento
                    </label>
                    <Select
                      value={wizard.routingConfig.departmentName || "Ninguno"}
                      onValueChange={(val) =>
                        wizard.setRoutingConfig((prev) => ({
                          ...prev,
                          departmentName: val === "Ninguno" ? "" : val,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full text-xs">
                        <SelectValue
                          placeholder={
                            loadingDepts ? "Cargando departamentos..." : "Selecciona departamento"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-card text-card-foreground border-border shadow-2xl z-[9999] max-h-80">
                        <SelectItem value="Ninguno" className="cursor-pointer">
                          <span className="text-muted-foreground italic">Ninguno</span>
                        </SelectItem>
                        {realDepartments && realDepartments.length > 0 ? (
                          realDepartments
                            .filter((d) => d.active !== false)
                            .map((dept) => (
                              <SelectItem
                                key={dept.id}
                                value={dept.name}
                                className="text-xs cursor-pointer py-2"
                              >
                                <span className="font-semibold">{dept.name}</span>
                              </SelectItem>
                            ))
                        ) : (
                          <div className="px-2 py-1 text-xs text-muted-foreground italic">
                            Sin departamentos configurados
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Usuario */}
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">
                      Usuario asignado
                    </label>
                    <Select
                      value={wizard.routingConfig.assignedUserName || "Ninguno"}
                      onValueChange={(val) =>
                        wizard.setRoutingConfig((prev) => ({
                          ...prev,
                          assignedUserName: val === "Ninguno" ? "" : val,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full text-xs">
                        <SelectValue placeholder="Buscar usuario..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card text-card-foreground border-border shadow-2xl z-[9999] max-h-80">
                        <SelectItem value="Ninguno" className="cursor-pointer">
                          <span className="text-muted-foreground italic">Ninguno</span>
                        </SelectItem>
                        {realDirectoryUsers && realDirectoryUsers.length > 0 ? (
                          realDirectoryUsers.map((user) => (
                            <SelectItem
                              key={user.id}
                              value={user.name}
                              className="text-xs cursor-pointer py-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{user.name}</span>
                                {user.departmentName && (
                                  <span className="text-[10px] text-muted-foreground">
                                    ({user.departmentName})
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1 text-xs text-muted-foreground italic">
                            Sin usuarios registrados
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Switches */}
                  <div className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 pr-4">
                        <div className="text-xs font-semibold">Mantener asignado al usuario</div>
                        <div className="text-[11px] text-muted-foreground">
                          Devuelve el chat directamente a la bandeja del usuario cuando el contacto
                          responda, omitiendo el chatbot.
                        </div>
                      </div>
                      <Switch
                        checked={wizard.routingConfig.keepAssigned}
                        onCheckedChange={(val) =>
                          wizard.setRoutingConfig((prev) => ({ ...prev, keepAssigned: val }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="space-y-0.5 pr-4">
                        <div className="text-xs font-semibold">
                          Delegar a motor de IA (NetOps AI)
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          El chat será atendido por el motor de automatización e IA cuando el
                          contacto responda.
                        </div>
                      </div>
                      <Switch
                        checked={wizard.routingConfig.delegateToBot}
                        onCheckedChange={(val) =>
                          wizard.setRoutingConfig((prev) => ({ ...prev, delegateToBot: val }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="space-y-0.5 pr-4">
                        <div className="flex items-center gap-1">
                          <div className="text-xs font-semibold">Forzar actualización del chat</div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs text-xs">
                                Reclona el enrutamiento incluso en chats que ya existían
                                previamente.
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Reaplica el enrutamiento incluso en chats ya existentes.
                        </div>
                      </div>
                      <Switch
                        checked={wizard.routingConfig.forceChatUpdate}
                        onCheckedChange={(val) =>
                          wizard.setRoutingConfig((prev) => ({ ...prev, forceChatUpdate: val }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Right Live Preview Panel */}
                <div className="h-full min-h-[340px]">
                  <CampaignPreviewPanel
                    messageText={wizard.messageText}
                    name={wizard.name}
                    selectedTemplate={wizard.selectedTemplate}
                    variableValues={wizard.templateVariableValues}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Wizard Footer */}
        <DialogFooter className="px-6 py-3.5 bg-muted/30 border-t border-border flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              wizard.resetWizard();
              onOpenChange(false);
            }}
            className="text-xs"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            disabled={!wizard.canSubmit || isSubmitting}
            onClick={handleFormSubmit}
            className="text-xs font-bold px-6 shadow-sm gap-2"
          >
            {isSubmitting ? "Creando campaña..." : "Crear campaña"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function cx(...classes: (string | boolean | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
