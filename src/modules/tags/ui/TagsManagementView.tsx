import { useState, useEffect, useMemo, useRef } from "react";
import {
  Tag as TagIcon,
  Plus,
  Search,
  LayoutList,
  LayoutGrid,
  Edit2,
  Trash2,
  Check,
  Pipette,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { COLOR_SWATCHES, getTagColorPreset, type TagItem } from "../domain/tag";
import {
  loadTagsFromStorage,
  createTagInStorage,
  updateTagInStorage,
  deleteTagFromStorage,
} from "../infrastructure/tags.storage";

export function TagsManagementView() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Ref para el selector de color nativo (Pipeta / Eyedropper)
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Estado del Modal (Crear / Editar)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [tagName, setTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#ffffff4d");
  const [description, setDescription] = useState("");

  // Cargar etiquetas iniciales y escuchar cambios
  useEffect(() => {
    setTags(loadTagsFromStorage());

    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<TagItem[]>;
      if (custom.detail) {
        setTags(custom.detail);
      } else {
        setTags(loadTagsFromStorage());
      }
    };

    window.addEventListener("tags-updated", handleUpdate);
    return () => window.removeEventListener("tags-updated", handleUpdate);
  }, []);

  const openCreateModal = () => {
    setEditingTag(null);
    setTagName("");
    setSelectedColor("#ffffff4d");
    setDescription("");
    setModalOpen(true);
  };

  const openEditModal = (tag: TagItem) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setSelectedColor(tag.color || "#ffffff4d");
    setDescription(tag.description || "");
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = tagName.trim();
    if (!cleanName) {
      toast.error("El nombre de la etiqueta no puede estar vacío");
      return;
    }

    if (editingTag) {
      const updated = updateTagInStorage(editingTag.id, {
        name: cleanName,
        color: selectedColor,
        description: description.trim() || undefined,
      });
      setTags(updated);
      toast.success(`Etiqueta "${cleanName.toUpperCase()}" actualizada`);
    } else {
      const updated = createTagInStorage(cleanName, selectedColor, description);
      setTags(updated);
      toast.success(`Etiqueta "${cleanName.toUpperCase()}" creada con éxito`);
    }

    setModalOpen(false);
  };

  // Estado para confirmación de eliminación
  const [tagToDelete, setTagToDelete] = useState<TagItem | null>(null);

  const handleDelete = (tag: TagItem) => {
    setTagToDelete(tag);
  };

  const handlePerformDelete = () => {
    if (!tagToDelete) return;
    const updated = deleteTagFromStorage(tagToDelete.id);
    setTags(updated);
    toast.success(`Etiqueta "${tagToDelete.name}" eliminada`);
    setTagToDelete(null);
  };

  const filteredTags = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q),
    );
  }, [tags, search]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 space-y-5 animate-fade-up pb-8">
      {/* Barra de Herramientas Principal (Búsqueda + Crear Etiqueta + Alternador Vista) */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 w-full">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar etiqueta..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-border bg-card font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:brightness-95 transition flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="size-4" />
            <span>Nueva etiqueta</span>
          </button>

          <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg text-xs transition cursor-pointer ${
                viewMode === "list"
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Vista Lista"
            >
              <LayoutList className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg text-xs transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Vista Grilla"
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal Responsivo que abarca 100% de la pantalla */}
      {filteredTags.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3 w-full my-auto">
          <TagIcon className="size-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-semibold text-foreground">
            No se encontraron etiquetas {search ? `para "${search}"` : ""}
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Puedes crear nuevas etiquetas personalizadas para categorizar las atenciones de tus
            clientes.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 mt-2 cursor-pointer"
          >
            <Plus className="size-3.5" /> Crear etiqueta
          </button>
        </div>
      ) : viewMode === "list" ? (
        /* Vista de Tabla al 100% del ancho (w-full) */
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs w-full flex-1 flex flex-col min-h-0">
          <div className="overflow-x-auto w-full flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-xs">
                <tr>
                  <th className="py-4 px-6 font-bold w-1/2 sm:w-3/5">Nombre</th>
                  <th className="py-4 px-6 font-bold text-center w-1/4">Color</th>
                  <th className="py-4 px-6 font-bold text-right w-1/4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTags.map((tag) => {
                  const colorInfo = getTagColorPreset(tag.color);
                  const hexDisplay = (tag.color || "#64748b").toUpperCase();
                  return (
                    <tr key={tag.id} className="hover:bg-foreground/5 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span
                            className="size-3.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: tag.color || "#64748b" }}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="font-extrabold text-foreground tracking-wide font-mono text-xs block truncate">
                              {tag.name}
                            </span>
                            {tag.description && (
                              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                {tag.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold font-mono tracking-wider border ${colorInfo.bgCls} ${colorInfo.textCls} ${colorInfo.borderCls}`}
                          style={colorInfo.customStyle}
                        >
                          {hexDisplay}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(tag)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition cursor-pointer"
                            title="Editar etiqueta"
                          >
                            <Edit2 className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(tag)}
                            className="p-2 rounded-lg text-danger/70 hover:text-danger hover:bg-danger/10 transition cursor-pointer"
                            title="Eliminar etiqueta"
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
        /* Vista de Grilla de Tarjetas responsiva */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
          {filteredTags.map((tag) => {
            const colorInfo = getTagColorPreset(tag.color);
            const hexDisplay = (tag.color || "#64748b").toUpperCase();
            return (
              <div
                key={tag.id}
                className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-primary/40 transition"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold font-mono uppercase tracking-wide border flex items-center gap-1.5 truncate ${colorInfo.bgCls} ${colorInfo.textCls} ${colorInfo.borderCls}`}
                      style={colorInfo.customStyle}
                    >
                      <TagIcon className="size-3 shrink-0" />
                      <span className="truncate">{tag.name}</span>
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(tag)}
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(tag)}
                        className="p-1 rounded-md text-danger/70 hover:text-danger hover:bg-danger/10 transition cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {tag.description ? (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {tag.description}
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground/60 italic">Sin descripción</p>
                  )}
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Color: {hexDisplay}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar Etiqueta */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
              <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
                <TagIcon className="size-4" />
              </div>
              <span>{editingTag ? "Editar etiqueta" : "Agregar etiqueta"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define el nombre y el color de la nueva etiqueta.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            {/* Campo Nombre */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Nombre <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={tagName}
                onChange={(e) => setTagName(e.target.value.toUpperCase())}
                placeholder="EJ: INFORMATIVO-ADMINISTRATIVO"
                className="w-full text-xs p-3 rounded-xl border border-border bg-card font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Campo Color (Barra Hex + Selector + Paleta Círculos) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">
                Color <span className="text-danger">*</span>
              </label>

              {/* Input Hex con Pipeta y Vista Previa */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border bg-card focus-within:ring-2 focus-within:ring-primary/20 transition">
                <button
                  type="button"
                  onClick={() => colorInputRef.current?.click()}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition cursor-pointer shrink-0"
                  title="Seleccionar con cuentagotas"
                >
                  <Pipette className="size-4" />
                </button>
                <input
                  type="color"
                  ref={colorInputRef}
                  value={
                    selectedColor.startsWith("#") && selectedColor.length === 7
                      ? selectedColor
                      : "#3b82f6"
                  }
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="sr-only"
                />
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  placeholder="#ffffff"
                  className="bg-transparent font-mono text-xs text-foreground focus:outline-none flex-1 font-semibold"
                />
                <div
                  onClick={() => colorInputRef.current?.click()}
                  className="size-5 rounded-full border border-border shadow-xs cursor-pointer shrink-0 transition hover:scale-110"
                  style={{ backgroundColor: selectedColor || "#64748b" }}
                  title="Haz clic para abrir paleta completa de colores"
                />
              </div>

              {/* Grilla de 16 Círculos de Colores (2 filas x 8 columnas) */}
              <div className="grid grid-cols-8 gap-2 pt-1.5">
                {COLOR_SWATCHES.map((swatch) => {
                  const isSelected = selectedColor.toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => setSelectedColor(swatch.hex)}
                      title={swatch.name}
                      className={`size-8 rounded-full transition-all duration-150 flex items-center justify-center cursor-pointer relative ${
                        isSelected
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 z-10 shadow-sm"
                          : "hover:scale-110 opacity-90 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {isSelected && <Check className="size-3.5 text-white drop-shadow-xs" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campo Descripción */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Descripción / Uso de la etiqueta{" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Usada para comunicaciones informativas o de área administrativa..."
                className="w-full text-xs p-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {/* Acciones del Modal */}
            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!tagName.trim()}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:brightness-95 transition disabled:opacity-50 cursor-pointer"
              >
                {editingTag ? "Guardar Cambios" : "Agregar"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      <Dialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base font-extrabold text-foreground">
              <div className="size-9 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger shadow-xs shrink-0">
                <Trash2 className="size-4" />
              </div>
              <span>¿Eliminar etiqueta?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
              Estás a punto de eliminar la etiqueta{" "}
              <strong className="text-foreground font-mono font-bold">"{tagToDelete?.name}"</strong>
              . Esta acción removerá la clasificación de los casos asociados y no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border mt-2">
            <button
              type="button"
              onClick={() => setTagToDelete(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handlePerformDelete}
              className="px-4 py-2.5 rounded-xl bg-danger text-danger-foreground text-xs font-bold shadow-md hover:brightness-95 transition cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="size-3.5" />
              <span>Eliminar</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
