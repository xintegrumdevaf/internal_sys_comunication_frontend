import { useState, useMemo } from "react";
import {
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Sparkles,
  FileText,
  Eye,
} from "lucide-react";
import { AppShell, StatCard } from "@/app/shell/AppShell";
import { useTemplates } from "../application/use-templates";
import { useCampaigns } from "../application/use-campaigns";
import { TemplateStatusBadge } from "./TemplateStatusBadge";
import { TemplateWizardModal } from "./TemplateWizardModal";
import { CampaignLaunchModal } from "./CampaignLaunchModal";
import { CampaignDetailsDrawer } from "./CampaignDetailsDrawer";
import { WhatsAppBubblePreview } from "./WhatsAppBubblePreview";
import type { WhatsAppTemplate, TemplateStatus, TemplateCategory } from "../domain/template";

export function CampaignsManagementView() {
  const [activeTab, setActiveTab] = useState<"campaigns" | "templates">("campaigns");

  // Hooks de negocio
  const { templates, loading: templatesLoading, createTemplate, syncStatus } = useTemplates();
  const { campaigns, loading: campaignsLoading, stats, sendCampaign } = useCampaigns();

  // Modales
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateToDuplicate, setTemplateToDuplicate] = useState<WhatsAppTemplate | null>(null);

  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [selectedCampaignIdForDetails, setSelectedCampaignIdForDetails] = useState<string | null>(
    null,
  );

  const [previewTemplateModal, setPreviewTemplateModal] = useState<WhatsAppTemplate | null>(null);

  // Filtros de Plantillas
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateStatusFilter, setTemplateStatusFilter] = useState<TemplateStatus | "ALL">("ALL");
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<TemplateCategory | "ALL">(
    "ALL",
  );

  // Plantillas filtradas
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchSearch = t.name.toLowerCase().includes(templateSearch.toLowerCase());
      const matchStatus = templateStatusFilter === "ALL" || t.status === templateStatusFilter;
      const matchCategory =
        templateCategoryFilter === "ALL" || t.category === templateCategoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [templates, templateSearch, templateStatusFilter, templateCategoryFilter]);

  // Plantillas aprobadas para el creador de campañas
  const approvedTemplates = useMemo(() => {
    return templates.filter((t) => t.status === "approved");
  }, [templates]);

  return (
    <AppShell title="Gestión de Campañas y Plantillas de WhatsApp" icon={Megaphone}>
      {/* StatCards KPI Globales */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up mb-5">
        <StatCard
          label="Enviados hoy"
          value={String(stats.enviadosHoy)}
          hint={`${stats.totalCampanas} campañas creadas`}
        />
        <StatCard
          label="Entregabilidad"
          value={String(stats.entregabilidad)}
          unit="%"
          hint="Meta ≥ 95%"
          tone="success"
        />
        <StatCard
          label="Fallidos"
          value={String(stats.fallidos)}
          hint="Reintentos y webhook logs"
          tone="warning"
        />
        <StatCard
          label="Opt-out"
          value={String(stats.optOut)}
          unit="%"
          hint="Bajo la norma Meta"
          tone="success"
        />
      </section>

      {/* Navegación por pestañas */}
      <div className="flex items-center justify-between border-b border-border mb-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("campaigns")}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "campaigns"
                ? "border-primary text-primary font-extrabold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Megaphone className="size-4" /> Campañas Masivas ({campaigns.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "templates"
                ? "border-primary text-primary font-extrabold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="size-4" /> Plantillas de WhatsApp ({templates.length})
          </button>
        </div>

        <div className="pb-2">
          {activeTab === "campaigns" ? (
            <button
              type="button"
              onClick={() => setIsCampaignModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-extrabold uppercase shadow-md flex items-center gap-1.5"
            >
              <Plus className="size-4" /> Nueva Campaña
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTemplateToDuplicate(null);
                setIsTemplateModalOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-extrabold uppercase shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="size-4" /> Nueva Plantilla
            </button>
          )}
        </div>
      </div>

      {/* PESTAÑA 1: CAMPAÑAS MASIVAS */}
      {activeTab === "campaigns" && (
        <section className="grid grid-cols-12 gap-6 animate-fade-up mb-8">
          <div className="col-span-12 lg:col-span-8 space-y-4">
            {campaignsLoading ? (
              <div className="p-8 text-center text-xs font-mono text-muted-foreground bg-card rounded-xl border border-border">
                Cargando campañas del backend...
              </div>
            ) : campaigns.length === 0 ? (
              <div className="p-12 text-center bg-card border border-border rounded-xl space-y-3">
                <Megaphone className="size-8 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground">
                  No hay campañas masivas registradas aún.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-extrabold uppercase inline-flex items-center gap-1.5"
                >
                  <Plus className="size-4" /> Crear la primera campaña
                </button>
              </div>
            ) : (
              campaigns.map((c) => {
                const delivered = c.deliveredCount ?? 0;
                const failed = c.failedCount ?? 0;
                const progress = c.progress ?? 0;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCampaignIdForDetails(c.id)}
                    className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all cursor-pointer shadow-sm group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-mono font-bold text-sm group-hover:text-primary transition-colors">
                          {c.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5 font-mono">
                          Área · {c.area || "Administración"}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded font-bold text-[10px] ring-1 uppercase font-mono ${
                          c.status === "in_progress" || c.status === "RUNNING"
                            ? "bg-info/10 text-info ring-info/30 animate-pulse"
                            : c.status === "completed" || c.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-500 ring-emerald-500/30"
                              : "bg-warning/10 text-warning ring-warning/30"
                        }`}
                      >
                        {c.status === "in_progress" || c.status === "RUNNING"
                          ? "En curso"
                          : c.status === "completed" || c.status === "COMPLETED"
                            ? "Completada"
                            : c.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 bg-background border border-border h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold font-mono text-primary">
                        {progress}%
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono mt-3">
                      <div className="p-2 bg-background rounded border border-border">
                        <p className="text-muted-foreground text-[9px] uppercase">Enviados</p>
                        <p className="font-bold text-xs">{c.sentCount.toLocaleString("es-CO")}</p>
                      </div>
                      <div className="p-2 bg-background rounded border border-border">
                        <p className="text-muted-foreground text-[9px] uppercase flex items-center gap-1">
                          <CheckCircle2 className="size-3 text-emerald-400" /> Entregados
                        </p>
                        <p className="font-bold text-xs text-emerald-400">
                          {delivered.toLocaleString("es-CO")}
                        </p>
                      </div>
                      <div className="p-2 bg-background rounded border border-border">
                        <p className="text-muted-foreground text-[9px] uppercase flex items-center gap-1">
                          <AlertTriangle className="size-3 text-danger" /> Fallidos
                        </p>
                        <p className="font-bold text-xs text-danger">{failed}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className="bg-card border border-border rounded-xl p-5 text-xs text-muted-foreground leading-relaxed space-y-3">
              <h4 className="font-extrabold uppercase tracking-wider text-foreground">
                Información de Monitoreo
              </h4>
              <p>
                Haz clic sobre cualquier tarjeta de campaña para desplegar el monitoreo detallado en
                tiempo real, observar los receptores y revisar motivos de error por número
                telefónico.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* PESTAÑA 2: PLANTILLAS DE WHATSAPP */}
      {activeTab === "templates" && (
        <section className="space-y-4 animate-fade-up mb-8">
          {/* Barra de Filtros y Búsqueda */}
          <div className="p-4 bg-card border border-border rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar plantilla por nombre..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Filter className="size-3.5" />
                <span>Estado:</span>
                <select
                  value={templateStatusFilter}
                  onChange={(e) =>
                    setTemplateStatusFilter(e.target.value as TemplateStatus | "ALL")
                  }
                  className="px-2 py-1 text-xs rounded border border-border bg-background font-semibold"
                >
                  <option value="ALL">Todos los estados</option>
                  <option value="pending">Pendiente revisión (pending)</option>
                  <option value="approved">Aprobada (approved)</option>
                  <option value="rejected">Rechazada (rejected)</option>
                  <option value="paused">Pausada (paused)</option>
                  <option value="draft">Borrador (draft)</option>
                </select>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Categoría:</span>
                <select
                  value={templateCategoryFilter}
                  onChange={(e) =>
                    setTemplateCategoryFilter(e.target.value as TemplateCategory | "ALL")
                  }
                  className="px-2 py-1 text-xs rounded border border-border bg-background font-semibold"
                >
                  <option value="ALL">Todas las categorías</option>
                  <option value="UTILITY">Servicio (UTILITY)</option>
                  <option value="MARKETING">Marketing (MARKETING)</option>
                  <option value="AUTHENTICATION">Autenticación (AUTHENTICATION)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de Plantillas */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            {templatesLoading ? (
              <div className="p-8 text-center text-xs font-mono text-muted-foreground">
                Cargando plantillas desde el backend...
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <FileText className="size-8 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground">
                  No se encontraron plantillas con los filtros aplicados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 uppercase font-mono text-[10px] text-muted-foreground tracking-wider">
                      <th className="p-3.5">Nombre de la Plantilla</th>
                      <th className="p-3.5">Categoría</th>
                      <th className="p-3.5">Idioma</th>
                      <th className="p-3.5">Estado Meta</th>
                      <th className="p-3.5">Fecha Creación</th>
                      <th className="p-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTemplates.map((t) => (
                      <tr key={t.id} className="hover:bg-background/50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-foreground">
                          <div className="flex items-center gap-2">
                            <span>{t.name}</span>
                            {t.variables.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px]">
                                {t.variables.length} vars
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono">
                          <span className="px-2 py-0.5 rounded border border-border bg-background text-[10px]">
                            {t.category}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono uppercase text-muted-foreground">
                          {t.language}
                        </td>
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <TemplateStatusBadge status={t.status} />

                            {/* Detalle explícito de rechazo de Meta */}
                            {t.status === "rejected" && t.rejectedReason && (
                              <div className="mt-1 p-2 bg-danger/10 border border-danger/20 rounded text-[11px] text-danger max-w-md font-sans">
                                <p className="font-bold flex items-center gap-1 text-[10px] uppercase tracking-wide">
                                  <AlertTriangle className="size-3" /> Motivo de Rechazo Meta:
                                </p>
                                <p className="mt-0.5 leading-tight">{t.rejectedReason}</p>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground text-[11px]">
                          {new Date(t.createdAt).toLocaleDateString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewTemplateModal(t)}
                              title="Previsualizar mensaje de WhatsApp"
                              className="px-2.5 py-1 rounded border border-border hover:bg-background text-[11px] font-semibold flex items-center gap-1"
                            >
                              <Eye className="size-3" /> Ver
                            </button>

                            {/* Botón Sincronizar Estado si está pendiente */}
                            {t.status === "pending" && (
                              <button
                                type="button"
                                onClick={() => void syncStatus(t.id)}
                                className="px-2.5 py-1 rounded bg-warning/15 hover:bg-warning/25 text-warning font-bold text-[11px] flex items-center gap-1"
                              >
                                <RefreshCw className="size-3 animate-spin" /> Sincronizar estado
                              </button>
                            )}

                            {/* Botón Duplicar si fue rechazada */}
                            {t.status === "rejected" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTemplateToDuplicate(t);
                                  setIsTemplateModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded bg-danger/15 hover:bg-danger/25 text-danger font-bold text-[11px] flex items-center gap-1"
                              >
                                <Copy className="size-3" /> Duplicar para corregir
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Modales y Drawers */}
      <TemplateWizardModal
        isOpen={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setTemplateToDuplicate(null);
        }}
        initialData={templateToDuplicate}
        onSubmit={createTemplate}
      />

      <CampaignLaunchModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        approvedTemplates={approvedTemplates}
        onSubmit={sendCampaign}
      />

      <CampaignDetailsDrawer
        campaignId={selectedCampaignIdForDetails}
        onClose={() => setSelectedCampaignIdForDetails(null)}
      />

      {/* Modal sencillo para ver previa de plantilla */}
      {previewTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  Plantilla Meta
                </span>
                <h3 className="text-sm font-extrabold font-mono text-primary">
                  {previewTemplateModal.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplateModal(null)}
                className="size-7 rounded-lg hover:bg-foreground/10 grid place-items-center text-muted-foreground"
              >
                <Eye className="size-4" />
              </button>
            </div>

            <WhatsAppBubblePreview components={previewTemplateModal.components} />

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewTemplateModal(null)}
                className="px-4 py-1.5 rounded-lg border border-border text-xs font-bold uppercase"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
