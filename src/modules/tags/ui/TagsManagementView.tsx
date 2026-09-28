import { useState, useEffect, useMemo } from "react";
import {
  Tag as TagIcon,
  Plus,
  Search,
  LayoutList,
  LayoutGrid,
  Edit2,
  Trash2,
  Check,
  Palette,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  COLOR_PALETTE,
  getTagColorPreset,
  type TagItem,
} from "../domain/tag";
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

  // Estado del Modal (Crear / Editar)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [tagName, setTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[1].hex);
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
    setSelectedColor(COLOR_PALETTE[1].hex);
    setDescription("");
    setModalOpen(true);
  };

  const openEditModal = (tag: TagItem) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setSelectedColor(tag.color || COLOR_PALETTE[0].hex);
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

  const handleDelete = (tag: TagItem) => {
    if (window.confirm(`¿Estás seguro de eliminar la etiqueta "${tag.name}"?`)) {
      const updated = deleteTagFromStorage(tag.id);
      setTags(updated);
      toast.success(`Etiqueta "${tag.name}" eliminada`);
    }
  };

  const filteredTags = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q),
    );
  }, [tags, search]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 space-y-5 animate-fade-up pb-8">
      {/* Header explicativo estilo Whaticket que ocupa el 100% del ancho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 w-full">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <TagIcon className="size-6 text-primary" />
            Etiquetas
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Crea y organiza las etiquetas usadas para clasificar contactos, casos y atenciones en la plataforma.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:brightness-95 transition flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="size-4" />
          <span>+ Nueva etiqueta</span>
        </button>
      </div>

      {/* Barra de Búsqueda y Alternador Vista Tabla/Grilla fluidos */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 w-full">
        <div className="relative w-full sm:w-96">
          <Search className="size-4 absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar etiqueta..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-border bg-card font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-card border border-border rounded-xl p-1 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg text-xs transition cursor-pointer ${
              viewMode === "list"
                ? "bg-primary/10 text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Vista Lista estilo Whaticket"
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
            title="Vista Grilla / Tarjetas"
          >
            <LayoutGrid className="size-4" />
          </button>
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
            Puedes crear nuevas etiquetas personalizadas para categorizar las atenciones de tus clientes.
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
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold border ${colorInfo.bgCls} ${colorInfo.textCls} ${colorInfo.borderCls}`}
                        >
                          {colorInfo.name}
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
                          {!tag.isSystem && (
                            <button
                              type="button"
                              onClick={() => handleDelete(tag)}
                              className="p-2 rounded-lg text-danger/70 hover:text-danger hover:bg-danger/10 transition cursor-pointer"
                              title="Eliminar etiqueta"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
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
            return (
              <div
                key={tag.id}
                className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-primary/40 transition"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold font-mono uppercase tracking-wide border flex items-center gap-1.5 truncate ${colorInfo.bgCls} ${colorInfo.textCls} ${colorInfo.borderCls}`}
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
                      {!tag.isSystem && (
                        <button
                          type="button"
                          onClick={() => handleDelete(tag)}
                          className="p-1 rounded-md text-danger/70 hover:text-danger hover:bg-danger/10 transition cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
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
                  <span>Color: {colorInfo.name}</span>
                  {tag.isSystem && <span className="font-bold text-primary">Sistema</span>}
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
              <TagIcon className="size-5 text-primary" />
              {editingTag ? "Editar Etiqueta" : "Nueva Etiqueta"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define el nombre y el color identificativo para clasificar las atenciones de la plataforma.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            {/* Campo Nombre */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Nombre de la etiqueta <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={tagName}
                onChange={(e) => setTagName(e.target.value.toUpperCase())}
                placeholder="Ej: INFORMATIVO-ADMINISTRATIVO"
                className="w-full text-xs p-3 rounded-xl border border-border bg-background font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Selector Paleta de Colores */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Palette className="size-3.5 text-primary" />
                Color de la etiqueta
              </label>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_PALETTE.map((c) => {
                  const selected = selectedColor.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setSelectedColor(c.hex)}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${c.bgCls} ${c.textCls} ${c.borderCls} ${
                        selected ? "ring-2 ring-primary shadow-xs" : "hover:brightness-95"
                      }`}
                    >
                      <span className="truncate text-[11px]">{c.name}</span>
                      {selected && <Check className="size-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campo Descripción */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Descripción / Uso de la etiqueta <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Usada para comunicaciones informativas o de área administrativa..."
                className="w-full text-xs p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {/* Acciones del Modal */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-foreground/5 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!tagName.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:brightness-95 transition disabled:opacity-50 cursor-pointer"
              >
                {editingTag ? "Guardar Cambios" : "Crear Etiqueta"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
