import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  MessageSquare,
  Users,
  GitBranch,
  UserCheck,
  Upload,
  Download,
  Plus,
  Trash2,
  HelpCircle,
  Smile,
  Bold,
  Italic,
  Strikethrough,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Braces,
  X,
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
          contactConfig: {
            tags: [],
            customFields: [],
            forceContactUpdate: false,
          },
        },
        wizard.importedFile,
      );
      wizard.resetWizard();
      onOpenChange(false);
      onCampaignCreated?.();
    } catch (err) {
      console.error("Error creating campaign:", err);
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

  const insertFormatText = (prefix: string, suffix = prefix) => {
    wizard.setMessageText((prev) => `${prev}${prefix}texto${suffix}`);
  };

  const insertVariable = (variableName: string) => {
    wizard.setMessageText((prev) => `${prev}{{${variableName}}}`);
  };

  const emojis = ["😀", "😁", "😊", "👍", "🙏", "👉", "🔥", "🎉", "💡", "📢", "✅", "⭐"];

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
                      value={wizard.selectedTemplate?.id || "none"}
                      onValueChange={(val) => {
                        if (val === "none") {
                          wizard.handleClearTemplate();
                        } else {
                          const found = availableTemplates.find((t) => t.id === val);
                          if (found) wizard.handleSelectTemplate(found);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full text-xs h-9 bg-background min-w-0">
                        <SelectValue
                          placeholder={
                            loadingTemplates ? "Cargando plantillas..." : "Seleccionar plantilla..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-card text-card-foreground border-border shadow-2xl z-[9999] max-h-80 w-[var(--radix-select-trigger-width)]">
                        <SelectItem value="none" className="cursor-pointer">
                          <span className="text-muted-foreground italic truncate">
                            Redactar mensaje personalizado (Sin plantilla)
                          </span>
                        </SelectItem>
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
                            className="h-6 text-[10px] text-muted-foreground hover:text-red-500 px-1.5 shrink-0 whitespace-nowrap"
                          >
                            <X className="w-3 h-3 mr-1 shrink-0" /> Desvincular
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
                  <div className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-semibold cursor-pointer">Modo rápido</label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">
                              Envía los mensajes de manera continua manteniendo el intervalo
                              especificado.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Switch checked={wizard.quickMode} onCheckedChange={wizard.setQuickMode} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {wizard.quickMode
                        ? `Envía un mensaje cada ${wizard.intervalSeconds} segundos.`
                        : "Modo pausado manual activado."}
                    </p>

                    {wizard.quickMode && (
                      <div className="pt-2 border-t border-border flex items-center gap-3">
                        <label className="text-xs text-muted-foreground whitespace-nowrap">
                          Intervalo (segundos):
                        </label>
                        <Input
                          type="number"
                          min={5}
                          max={600}
                          value={wizard.intervalSeconds}
                          onChange={(e) => wizard.setIntervalSeconds(Number(e.target.value) || 45)}
                          className="w-24 h-8 text-xs font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Mensaje Estándar */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1">
                        <label className="text-xs font-semibold text-foreground">
                          Mensaje estándar <span className="text-red-500">*</span>
                        </label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">
                              Puedes usar formato WhatsApp (*negrita*, _cursiva_, ~tachado~) y
                              variables tipo {"{{name}}"}.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-background overflow-hidden">
                      <Textarea
                        placeholder="Escribe el mensaje enviado a todos los contactos..."
                        value={wizard.messageText}
                        onChange={(e) => wizard.setMessageText(e.target.value)}
                        rows={6}
                        className="border-0 focus-visible:ring-0 resize-none text-xs leading-relaxed p-3"
                      />

                      {/* Formatting Toolbar */}
                      <div className="flex items-center justify-between border-t border-border px-2 py-1.5 bg-muted/20">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => insertFormatText("*")}
                            title="Negrita (*texto*)"
                          >
                            <Bold className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => insertFormatText("_")}
                            title="Cursiva (_texto_)"
                          >
                            <Italic className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => insertFormatText("~")}
                            title="Tachado (~texto~)"
                          >
                            <Strikethrough className="w-3.5 h-3.5" />
                          </Button>

                          {/* Emoji Picker */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                title="Insertar emoji"
                              >
                                <Smile className="w-3.5 h-3.5" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-60 p-2 border-border bg-card">
                              <div className="grid grid-cols-6 gap-1">
                                {emojis.map((emoji, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => wizard.setMessageText((prev) => prev + emoji)}
                                    className="h-8 w-8 rounded hover:bg-muted grid place-items-center text-base"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>

                          {/* Attachment Icon */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Adjuntar archivo"
                            onClick={() => alert("Adjuntar archivo opcional")}
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        {/* Variables Menu */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] gap-1 px-2"
                            >
                              <Braces className="w-3.5 h-3.5 text-primary" />
                              Variables
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-1.5 border-border bg-card">
                            <div className="space-y-0.5">
                              <button
                                type="button"
                                onClick={() => insertVariable("name")}
                                className="w-full text-left px-2.5 py-1.5 rounded text-xs hover:bg-muted font-mono"
                              >
                                {"{{name}}"} - Nombre
                              </button>
                              <button
                                type="button"
                                onClick={() => insertVariable("number")}
                                className="w-full text-left px-2.5 py-1.5 rounded text-xs hover:bg-muted font-mono"
                              >
                                {"{{number}}"} - Teléfono
                              </button>
                              <button
                                type="button"
                                onClick={() => insertVariable("body")}
                                className="w-full text-left px-2.5 py-1.5 rounded text-xs hover:bg-muted font-mono"
                              >
                                {"{{body}}"} - Mensaje custom
                              </button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    {!wizard.messageValidation.valid && wizard.messageText && (
                      <p className="text-[11px] text-red-500 mt-1">
                        {wizard.messageValidation.error}
                      </p>
                    )}
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

                  {/* Summary & Status */}
                  {wizard.importSummary.total > 0 && (
                    <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Resumen de importación
                      </h4>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          {wizard.importSummary.valid} válidos
                        </div>
                        {wizard.importSummary.invalid > 0 && (
                          <div className="flex items-center gap-1.5 text-red-500 font-semibold">
                            <AlertCircle className="w-4 h-4" />
                            {wizard.importSummary.invalid} con error
                          </div>
                        )}
                        <div className="text-muted-foreground">
                          Total procesados: {wizard.importSummary.total}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Preview Table of First Rows */}
                  {wizard.previewRows.length > 0 && (
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
                              <th className="p-2 font-semibold">Mensaje custom</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {wizard.previewRows.map((r, i) => (
                              <tr key={i} className="hover:bg-muted/10">
                                <td className="p-2 font-mono text-[11px]">
                                  {r.number || r.telefono || r.phone || "—"}
                                </td>
                                <td className="p-2 font-medium">{r.name || r.nombre || "—"}</td>
                                <td className="p-2 text-muted-foreground truncate max-w-[150px]">
                                  {r.body || r.mensaje || "—"}
                                </td>
                              </tr>
                            ))}
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

function cx(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
