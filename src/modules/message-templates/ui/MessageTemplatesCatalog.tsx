import {
  Eye,
  Grid,
  LayoutList,
  Megaphone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMessageTemplates } from "@/modules/message-templates/application/use-message-templates";
import type {
  MessageTemplate,
  TemplateCategory,
} from "@/modules/message-templates/domain/message-template";
import {
  templateCategoryLabel,
  templateStatusMeta,
} from "@/modules/message-templates/domain/message-template";
import { MessageTemplateDetailModal } from "./MessageTemplateDetailModal";
import { MessageTemplateFormDialog } from "./MessageTemplateFormDialog";

export function MessageTemplatesCatalog() {
  const {
    loading,
    submitting,
    templates,
    connections,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    isFormOpen,
    setIsFormOpen,
    selectedTemplate,
    isDetailOpen,
    openDetail,
    closeDetail,
    deletingTemplate,
    setDeletingTemplate,
    createTemplate,
    deleteTemplate,
  } = useMessageTemplates();

  const CategoryIcon = ({ category }: { category: TemplateCategory }) => {
    switch (category) {
      case "MARKETING":
        return <Megaphone className="size-3.5 text-blue-400" />;
      case "UTILITY":
        return <Wrench className="size-3.5 text-[#00a884]" />;
      case "AUTHENTICATION":
        return <ShieldCheck className="size-3.5 text-amber-400" />;
      default:
        return <Wrench className="size-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Header de la sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            Plantillas de Mensajes
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mensajes pre-aprobados por Meta para iniciar conversaciones por WhatsApp.
          </p>
        </div>
      </div>

      {/* Toolbar: Buscador, Filtros, Toggle Lista/Grid, Botón Añadir */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Buscador */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Filtro Categoría */}
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters((f) => ({ ...f, category: e.target.value as TemplateCategory | "" }))
            }
            className="px-3 py-1.5 text-xs rounded-xl border border-border bg-background font-semibold text-foreground outline-none cursor-pointer"
          >
            <option value="">Categoría</option>
            <option value="MARKETING">Marketing</option>
            <option value="UTILITY">Utilidad</option>
            <option value="AUTHENTICATION">Autenticación</option>
          </select>

          {/* Filtro Conexiones */}
          <select
            value={filters.connectionId}
            onChange={(e) => setFilters((f) => ({ ...f, connectionId: e.target.value }))}
            className="px-3 py-1.5 text-xs rounded-xl border border-border bg-background font-semibold text-foreground outline-none cursor-pointer"
          >
            <option value="">Conexiones</option>
            {connections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Filtro Estado */}
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                status: e.target.value as MessageTemplate["status"] | "",
              }))
            }
            className="px-3 py-1.5 text-xs rounded-xl border border-border bg-background font-semibold text-foreground outline-none cursor-pointer"
          >
            <option value="">Estado</option>
            <option value="APPROVED">Aprobado</option>
            <option value="PENDING">Pendiente</option>
            <option value="REJECTED">Rechazado</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle Vista Lista / Grid */}
          <div className="flex items-center bg-background border border-border rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="Vista en Lista"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-card text-primary font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutList className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Vista en Cuadrícula"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-card text-primary font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Grid className="size-4" />
            </button>
          </div>

          {/* Botón Añadir Plantilla */}
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs shadow-md flex items-center gap-1.5 transition-all"
          >
            <Plus className="size-4" /> Añadir plantilla
          </button>
        </div>
      </div>

      {/* Contenido Principal: Tabla o Grid */}
      {loading ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-xs text-muted-foreground">
          Cargando plantillas de mensajes...
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
          <p className="text-sm font-semibold text-foreground">No se encontraron plantillas</p>
          <p className="text-xs text-muted-foreground">
            Ajusta los filtros o crea una nueva plantilla para enviarla a revisión en Meta.
          </p>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="size-4" /> Crear primera plantilla
          </button>
        </div>
      ) : viewMode === "list" ? (
        /* Vista de Tabla */
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground select-none">
                  <th className="py-3 px-4">NOMBRE</th>
                  <th className="py-3 px-4">CATEGORÍA</th>
                  <th className="py-3 px-4">CONEXIÓN</th>
                  <th className="py-3 px-4">ESTADO</th>
                  <th className="py-3 px-4">MENSAJE</th>
                  <th className="py-3 px-4">IDIOMA</th>
                  <th className="py-3 px-4 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {templates.map((tpl) => {
                  const statusMeta = templateStatusMeta(tpl.status);
                  return (
                    <tr key={tpl.id} className="hover:bg-foreground/[0.02] transition-colors group">
                      {/* Nombre */}
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground truncate max-w-[160px]">
                        {tpl.name}
                      </td>

                      {/* Categoría Badge */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background border border-border text-[11px] font-semibold text-foreground shadow-xs">
                          <CategoryIcon category={tpl.category} />
                          {templateCategoryLabel(tpl.category)}
                        </span>
                      </td>

                      {/* Conexión */}
                      <td className="py-3.5 px-4 text-muted-foreground font-medium truncate max-w-[160px]">
                        {tpl.connectionName}
                      </td>

                      {/* Estado con dot indicador */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold ${statusMeta.badgeClass} px-2.5 py-0.5 rounded-full border`}
                        >
                          <span className={`size-1.5 rounded-full ${statusMeta.dotClass}`} />
                          {statusMeta.label}
                        </span>
                      </td>

                      {/* Mensaje preview truncado */}
                      <td className="py-3.5 px-4 text-muted-foreground truncate max-w-xs font-sans">
                        {tpl.body}
                      </td>

                      {/* Idioma */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {tpl.languageLabel || tpl.language}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Ver detalles"
                            onClick={() => openDetail(tpl)}
                            className="p-1.5 rounded-lg hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            type="button"
                            title="Eliminar plantilla"
                            onClick={() => setDeletingTemplate(tpl)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Vista de Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => {
            const statusMeta = templateStatusMeta(tpl.status);
            return (
              <div
                key={tpl.id}
                className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-foreground truncate">
                      {tpl.name}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold ${statusMeta.badgeClass} px-2 py-0.5 rounded-full border`}
                    >
                      <span className={`size-1.5 rounded-full ${statusMeta.dotClass}`} />
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background border border-border text-[10px] font-semibold">
                      <CategoryIcon category={tpl.category} />
                      {templateCategoryLabel(tpl.category)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {tpl.languageLabel || tpl.language}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed bg-background/50 p-2.5 rounded-xl border border-border/50">
                    {tpl.body}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="truncate max-w-[150px]">{tpl.connectionName}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openDetail(tpl)}
                      className="p-1.5 rounded-lg hover:bg-foreground/10 text-foreground"
                    >
                      <Eye className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingTemplate(tpl)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Formulario de Creación */}
      <MessageTemplateFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={createTemplate}
        connections={connections}
        submitting={submitting}
      />

      {/* Modal Detalle (Solo lectura) */}
      <MessageTemplateDetailModal
        template={selectedTemplate}
        isOpen={isDetailOpen}
        onClose={closeDetail}
      />

      {/* Confirmación de Eliminación */}
      <AlertDialog
        open={Boolean(deletingTemplate)}
        onOpenChange={(open) => {
          if (!open) setDeletingTemplate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la plantilla &quot;{deletingTemplate?.name}&quot; del sistema.
              Si la plantilla ya fue aprobada por Meta, se desincronizará de este panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingTemplate) {
                  void deleteTemplate(deletingTemplate.id);
                }
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
