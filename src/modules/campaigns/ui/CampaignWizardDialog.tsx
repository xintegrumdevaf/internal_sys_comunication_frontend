import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
} from 'lucide-react';
import { CampaignPreviewPanel } from './CampaignPreviewPanel';
import { useCampaignWizard } from '../application/use-campaign-wizard';
import { useCreateCampaign } from '../application/use-campaigns';

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
  const [tagInput, setTagInput] = useState('');

  const handleFormSubmit = async () => {
    if (!wizard.canSubmit) return;
    try {
      await createCampaign(
        {
          name: wizard.name,
          messageText: wizard.messageText,
          quickMode: wizard.quickMode,
          intervalSeconds: wizard.intervalSeconds,
          recipients: wizard.importedRecipients,
          routingConfig: wizard.routingConfig,
          contactConfig: {
            tags: wizard.tags,
            customFields: wizard.customFields.filter((f) => f.key.trim() !== ''),
            forceContactUpdate: wizard.forceContactUpdate,
          },
        },
        wizard.importedFile
      );
      wizard.resetWizard();
      onOpenChange(false);
      onCampaignCreated?.();
    } catch (err) {
      console.error('Error creating campaign:', err);
    }
  };

  const handleDownloadExample = () => {
    const csvContent =
      'number,name,body,city\n+573001234567,Carlos Pérez,Hola Carlos,Bogotá\n+573009876543,Ana Gómez,Hola Ana,Medellín\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'destinatarios_ejemplo.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const insertFormatText = (prefix: string, suffix = prefix) => {
    wizard.setMessageText((prev) => `${prev}${prefix}texto${suffix}`);
  };

  const insertVariable = (variableName: string) => {
    wizard.setMessageText((prev) => `${prev}{{${variableName}}}`);
  };

  const emojis = ['😀', '😁', '😊', '👍', '🙏', '👉', '🔥', '🎉', '💡', '📢', '✅', '⭐'];

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !wizard.tags.includes(trimmed)) {
      wizard.setTags([...wizard.tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    wizard.setTags(wizard.tags.filter((t) => t !== tagToRemove));
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
            Configura el mensaje, el enrutamiento de los chats e importa tus contactos.
          </p>
        </DialogHeader>

        {/* Wizard Main Grid */}
        <div className="flex min-h-[520px] max-h-[70vh]">
          {/* Navigation Sidebar */}
          <div className="w-56 bg-muted/20 border-r border-border p-3 flex flex-col gap-1.5 shrink-0 select-none">
            <button
              type="button"
              className={cx(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left',
                wizard.activeStep === 1
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'hover:bg-muted/80 text-muted-foreground'
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
                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left',
                wizard.activeStep === 2
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'hover:bg-muted/80 text-muted-foreground'
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
                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left',
                wizard.activeStep === 3
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'hover:bg-muted/80 text-muted-foreground'
              )}
              onClick={() => wizard.setActiveStep(3)}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Enrutamiento
                </div>
                <span className="text-[9px] uppercase tracking-wider opacity-70 ml-6">AVANZADO</span>
              </div>
            </button>

            <button
              type="button"
              className={cx(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left',
                wizard.activeStep === 4
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'hover:bg-muted/80 text-muted-foreground'
              )}
              onClick={() => wizard.setActiveStep(4)}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Contacto
                </div>
                <span className="text-[9px] uppercase tracking-wider opacity-70 ml-6">AVANZADO</span>
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
                              Envía los mensajes de manera continua manteniendo el intervalo especificado.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Switch checked={wizard.quickMode} onCheckedChange={wizard.setQuickMode} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {wizard.quickMode
                        ? `Envía un mensaje cada ${wizard.intervalSeconds} segundos.`
                        : 'Modo pausado manual activado.'}
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
                              Puedes usar formato WhatsApp (*negrita*, _cursiva_, ~tachado~) y variables tipo {'{{name}}'}.
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
                            onClick={() => insertFormatText('*')}
                            title="Negrita (*texto*)"
                          >
                            <Bold className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => insertFormatText('_')}
                            title="Cursiva (_texto_)"
                          >
                            <Italic className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => insertFormatText('~')}
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
                            onClick={() => alert('Adjuntar archivo opcional')}
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
                                onClick={() => insertVariable('name')}
                                className="w-full text-left px-2.5 py-1.5 rounded text-xs hover:bg-muted font-mono"
                              >
                                {'{{name}}'} - Nombre
                              </button>
                              <button
                                type="button"
                                onClick={() => insertVariable('number')}
                                className="w-full text-left px-2.5 py-1.5 rounded text-xs hover:bg-muted font-mono"
                              >
                                {'{{number}}'} - Teléfono
                              </button>
                              <button
                                type="button"
                                onClick={() => insertVariable('body')}
                                className="w-full text-left px-2.5 py-1.5 rounded text-xs hover:bg-muted font-mono"
                              >
                                {'{{body}}'} - Mensaje custom
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
                  <CampaignPreviewPanel messageText={wizard.messageText} name={wizard.name} />
                </div>
              </div>
            )}

            {/* STEP 2: DESTINATARIOS */}
            {wizard.activeStep === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                <div className="space-y-4">
                  <div className="p-6 border-2 border-dashed border-border rounded-xl bg-muted/10 text-center hover:bg-muted/20 transition-colors flex flex-col items-center justify-center min-h-[220px]">
                    <FileSpreadsheet className="w-10 h-10 text-primary mb-2 opacity-80" />
                    <h3 className="text-sm font-bold text-foreground">Importa la planilla de contactos</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      Archivo .xlsx o .csv con las columnas <code className="font-mono text-primary">number</code> (requerida), <code className="font-mono text-muted-foreground">name</code> y <code className="font-mono text-muted-foreground">body</code> (opcionales).
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
                      <h4 className="text-xs font-bold mb-2 text-foreground">Vista previa de contactos (primeras filas)</h4>
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
                                  {r.number || r.telefono || r.phone || '—'}
                                </td>
                                <td className="p-2 font-medium">{r.name || r.nombre || '—'}</td>
                                <td className="p-2 text-muted-foreground truncate max-w-[150px]">
                                  {r.body || r.mensaje || '—'}
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
                  <CampaignPreviewPanel messageText={wizard.messageText} name={wizard.name} />
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
                          wizard.setRoutingConfig((prev) => ({ ...prev, chatStatus: 'open' }))
                        }
                        className={cx(
                          'py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5',
                          wizard.routingConfig.chatStatus === 'open'
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                            : 'text-muted-foreground hover:bg-muted'
                        )}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Abierto
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          wizard.setRoutingConfig((prev) => ({ ...prev, chatStatus: 'pending' }))
                        }
                        className={cx(
                          'py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5',
                          wizard.routingConfig.chatStatus === 'pending'
                            ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                            : 'text-muted-foreground hover:bg-muted'
                        )}
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        En espera
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          wizard.setRoutingConfig((prev) => ({ ...prev, chatStatus: 'closed' }))
                        }
                        className={cx(
                          'py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5',
                          wizard.routingConfig.chatStatus === 'closed'
                            ? 'bg-primary/15 text-primary border border-primary/30'
                            : 'text-muted-foreground hover:bg-muted'
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
                      value={wizard.routingConfig.departmentName || 'Ninguno'}
                      onValueChange={(val) =>
                        wizard.setRoutingConfig((prev) => ({
                          ...prev,
                          departmentName: val === 'Ninguno' ? '' : val,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full text-xs">
                        <SelectValue placeholder="Selecciona departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ninguno">Ninguno</SelectItem>
                        <SelectItem value="Soporte Técnico">Soporte Técnico</SelectItem>
                        <SelectItem value="Ventas">Ventas</SelectItem>
                        <SelectItem value="Cobranzas">Cobranzas</SelectItem>
                        <SelectItem value="Facturación">Facturación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Usuario */}
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">
                      Usuario asignado
                    </label>
                    <Select
                      value={wizard.routingConfig.assignedUserName || 'Ninguno'}
                      onValueChange={(val) =>
                        wizard.setRoutingConfig((prev) => ({
                          ...prev,
                          assignedUserName: val === 'Ninguno' ? '' : val,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full text-xs">
                        <SelectValue placeholder="Buscar usuario..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ninguno">Ninguno</SelectItem>
                        <SelectItem value="Juan Pérez">Juan Pérez</SelectItem>
                        <SelectItem value="María Gómez">María Gómez</SelectItem>
                        <SelectItem value="Carlos Rodríguez">Carlos Rodríguez</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Switches */}
                  <div className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 pr-4">
                        <div className="text-xs font-semibold">Mantener asignado al usuario</div>
                        <div className="text-[11px] text-muted-foreground">
                          Devuelve el chat directamente a la bandeja del usuario cuando el contacto responda, omitiendo el chatbot.
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
                        <div className="text-xs font-semibold">Delegar a motor de IA (NetOps AI)</div>
                        <div className="text-[11px] text-muted-foreground">
                          El chat será atendido por el motor de automatización e IA cuando el contacto responda.
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
                                Reclona el enrutamiento incluso en chats que ya existían previamente.
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
                  <CampaignPreviewPanel messageText={wizard.messageText} name={wizard.name} />
                </div>
              </div>
            )}

            {/* STEP 4: CONTACTO (AVANZADO) */}
            {wizard.activeStep === 4 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Opcional. Enriquece el registro de todos los contactos importados.
                  </p>

                  {/* Etiquetas */}
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">
                      Etiquetas
                    </label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Escribe una etiqueta y presiona Agregar..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        className="text-xs"
                      />
                      <Button type="button" size="sm" onClick={handleAddTag} className="text-xs gap-1">
                        <Plus className="w-3.5 h-3.5" />
                        Agregar
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg border border-border bg-muted/10">
                      {wizard.tags.length === 0 ? (
                        <span className="text-[11px] text-muted-foreground italic">
                          Sin etiquetas asignadas.
                        </span>
                      ) : (
                        wizard.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs gap-1 py-0.5 px-2 bg-primary/10 text-primary border-primary/20"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-red-500 ml-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Información adicional (Custom Key-Value) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-foreground">
                        Información adicional (Campos personalizados)
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={wizard.handleAddCustomField}
                        className="h-7 text-xs gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar campo
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {wizard.customFields.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground italic">
                          No hay campos adicionales agregados.
                        </p>
                      ) : (
                        wizard.customFields.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              placeholder="Clave (ej. ciudad)"
                              value={item.key}
                              onChange={(e) =>
                                wizard.handleUpdateCustomField(idx, e.target.value, item.value)
                              }
                              className="h-8 text-xs"
                            />
                            <Input
                              placeholder="Valor (ej. Bogotá)"
                              value={item.value}
                              onChange={(e) =>
                                wizard.handleUpdateCustomField(idx, item.key, e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:bg-red-500/10 shrink-0"
                              onClick={() => wizard.handleRemoveCustomField(idx)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Forzar actualización de datos */}
                  <div className="p-3.5 rounded-xl border border-border bg-muted/10 flex items-center justify-between">
                    <div className="space-y-0.5 pr-4">
                      <div className="flex items-center gap-1">
                        <div className="text-xs font-semibold">Forzar actualización de los datos</div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">
                              Sobrescribe los datos del contacto existente con los de la importación.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Sobrescribe lo que ya existe en el registro del contacto.
                      </div>
                    </div>
                    <Switch
                      checked={wizard.forceContactUpdate}
                      onCheckedChange={wizard.setForceContactUpdate}
                    />
                  </div>
                </div>

                {/* Right Live Preview Panel */}
                <div className="h-full min-h-[340px]">
                  <CampaignPreviewPanel messageText={wizard.messageText} name={wizard.name} />
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
            {isSubmitting ? 'Creando campaña...' : 'Crear campaña'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function cx(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
