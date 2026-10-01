import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Users,
  Search,
  Plus,
  LayoutList,
  LayoutGrid,
  MessageSquare,
  Edit2,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { CustomerDto } from "../domain/customer";
import { customerGateway } from "@/modules/customers/infrastructure/customer.gateway";
import { tagsGateway } from "@/modules/tags/infrastructure/tags.gateway";
import { getTagColorPreset, type TagItem } from "@/modules/tags/domain/tag";
import { ContactDialog } from "./ContactDialog";
import { avatarColorFromSeed } from "@/shared/avatar-color";
import {
  formatWaPhone,
  type ConversationStatus,
} from "@/modules/conversations/domain/conversation";
import {
  listConversations,
  getConversation,
} from "@/modules/conversations/infrastructure/conversation.gateway";

export function ContactsManagementView() {
  const navigate = useNavigate();

  // Estados de datos
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("ALL");
  const [tagIdFilter, setTagIdFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Catálogo de tags para el dropdown
  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);

  // Modales
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerDto | null>(null);

  // Cargar catálogo de etiquetas y escuchar actualizaciones en vivo
  useEffect(() => {
    const load = () => {
      void tagsGateway.list().then(setAvailableTags);
    };
    load();
    window.addEventListener("tags-updated", load);
    return () => window.removeEventListener("tags-updated", load);
  }, []);

  // Cargar contactos
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const hasTagsParam =
        tagFilter === "WITH_TAGS" ? true : tagFilter === "NO_TAGS" ? false : undefined;
      const tagIdParam = tagIdFilter !== "ALL" ? tagIdFilter : undefined;

      const res = await customerGateway.list({
        search: search.trim() || undefined,
        hasTags: hasTagsParam,
        tagId: tagIdParam,
        startDate: dateFilter || undefined,
        page,
        limit: 15,
      });

      setCustomers(res.data || []);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar contactos";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCustomers();
  }, [page, tagFilter, tagIdFilter, dateFilter]);

  // Manejo de búsqueda con enter o botón
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void fetchCustomers();
  };

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (customer: CustomerDto) => {
    setEditingCustomer(customer);
    setDialogOpen(true);
  };

  const handleOpenChat = async (customer: CustomerDto) => {
    if (customer.conversationId) {
      try {
        const conv = await getConversation(customer.conversationId);
        void navigate({
          to: "/bandeja",
          search: { conversationId: conv.id, status: conv.status },
        });
        return;
      } catch {
        // En caso de que falle la conversación por ID directo, continuar con la búsqueda por teléfono/ID
      }
    }

    const cleanPhone = customer.waPhone?.replace(/\D/g, "");
    try {
      const statuses: (ConversationStatus | undefined)[] = [
        "open",
        "pending",
        "resolved",
        "closed",
      ];
      for (const st of statuses) {
        const list = await listConversations({ status: st });
        const match = list.find((c) => {
          if (c.customerId && c.customerId === customer.id) return true;
          if (cleanPhone && c.waPhone.replace(/\D/g, "").endsWith(cleanPhone.slice(-8)))
            return true;
          return false;
        });
        if (match) {
          void navigate({
            to: "/bandeja",
            search: { conversationId: match.id, status: match.status },
          });
          return;
        }
      }
      toast.info("El contacto no tiene una conversación registrada aún.");
    } catch {
      toast.error("No se pudo consultar la conversación del contacto.");
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("es-EC", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 space-y-4 animate-fade-in pb-8">
      {/* Cabecera de la sección (estilo unificado sin tarjeta contenedora duplicada) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Contactos
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestiona los contactos de tu cuenta, sus etiquetas y conversaciones.
          </p>
        </div>
      </div>

      {/* Barra de Filtros y Herramientas (100% de ancho con botones de acción a la derecha) */}
      <div className="bg-card border border-border rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 w-full">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] max-w-sm relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono, cédula..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden text-foreground"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro: Estado de etiquetas */}
          <select
            value={tagFilter}
            onChange={(e) => {
              setTagFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground outline-hidden focus:border-primary cursor-pointer font-medium"
          >
            <option value="ALL">Todos los contactos</option>
            <option value="WITH_TAGS">Con etiquetas</option>
            <option value="NO_TAGS">Sin etiquetas</option>
          </select>

          {/* Filtro: Catálogo de etiquetas */}
          <select
            value={tagIdFilter}
            onChange={(e) => {
              setTagIdFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground outline-hidden focus:border-primary cursor-pointer font-medium"
          >
            <option value="ALL">Todas las etiquetas</option>
            {availableTags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Filtro: Fecha de creación */}
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground outline-hidden focus:border-primary cursor-pointer font-medium"
              title="Filtrar por fecha de creación"
            />
          </div>

          {/* Switch de Vistas */}
          <div className="flex items-center border border-border rounded-xl p-0.5 bg-background">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Vista Lista"
            >
              <LayoutList className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Vista Cuadrícula"
            >
              <LayoutGrid className="size-3.5" />
            </button>
          </div>

          {/* Botón Agregar Contacto */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:brightness-95 transition cursor-pointer shrink-0"
          >
            <Plus className="size-3.5" />
            <span>+ Agregar Contacto</span>
          </button>
        </div>
      </div>

      {/* Contenido Principal: Tabla o Cuadrícula abarcando 100% del ancho */}
      {viewMode === "list" ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs w-full flex-1 flex flex-col min-h-0">
          <div className="overflow-x-auto w-full flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider sticky top-0 z-10 backdrop-blur-xs">
                <tr>
                  <th className="py-3.5 px-5 font-bold">Nombre</th>
                  <th className="py-3.5 px-5 font-bold">WhatsApp</th>
                  <th className="py-3.5 px-5 font-bold">Correo Electrónico</th>
                  <th className="py-3.5 px-5 font-bold">Etiquetas</th>
                  <th className="py-3.5 px-5 font-bold">Creado En</th>
                  <th className="py-3.5 px-5 font-bold">Último Mensaje</th>
                  <th className="py-3.5 px-5 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {customers.map((c) => {
                  const avatarColor = avatarColorFromSeed(c.waPhone || c.id);
                  const initials =
                    (c.fullName || c.waProfileName || "?")
                      .trim()
                      .split(/\s+/)
                      .map((p) => p[0]?.toUpperCase())
                      .slice(0, 2)
                      .join("") || "?";

                  return (
                    <tr key={c.id} className="hover:bg-foreground/5 transition-colors">
                      {/* Nombre */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`size-8 rounded-full grid place-items-center font-bold text-xs shrink-0 ${avatarColor.bg} ${avatarColor.text}`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate max-w-[240px]">
                              {c.fullName || c.waProfileName || "Sin nombre"}
                            </p>
                            {c.nationalId && (
                              <p className="text-[10px] text-muted-foreground font-mono truncate">
                                Cédula: {c.nationalId}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* WhatsApp */}
                      <td className="py-3.5 px-5 font-mono text-[11px] text-foreground">
                        {c.waPhone ? formatWaPhone(c.waPhone) : "-"}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-5 text-muted-foreground">
                        {c.email ? (
                          <span className="truncate max-w-[200px] block" title={c.email}>
                            {c.email}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40 italic">-</span>
                        )}
                      </td>

                      {/* Etiquetas */}
                      <td className="py-3.5 px-5">
                        <div className="flex flex-wrap gap-1 max-w-[280px]">
                          {c.tags && c.tags.length > 0 ? (
                            c.tags.map((t) => {
                              const preset = getTagColorPreset(t.color);
                              return (
                                <span
                                  key={t.id}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${preset.bgCls} ${preset.textCls} ${preset.borderCls}`}
                                  style={preset.customStyle}
                                >
                                  {t.name}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[10px] text-muted-foreground/60 italic">
                              Sin etiquetas
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Creado En */}
                      <td className="py-3.5 px-5 text-muted-foreground text-[11px]">
                        {formatDate(c.createdAt)}
                      </td>

                      {/* Último Mensaje */}
                      <td className="py-3.5 px-5 text-muted-foreground text-[11px]">
                        {formatDate(c.lastMessageAt)}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenChat(c)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors cursor-pointer"
                            title="Abrir conversación"
                          >
                            <MessageSquare className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors cursor-pointer"
                            title="Editar contacto"
                          >
                            <Edit2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {customers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="size-10 text-muted-foreground/30 mb-1" />
                        <p className="text-sm font-semibold text-foreground">
                          No se encontraron contactos
                        </p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {search
                            ? `No hay resultados para "${search}". Prueba con otro término de búsqueda.`
                            : "Aún no tienes contactos registrados en tu cuenta."}
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenCreate}
                          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:brightness-95 transition cursor-pointer"
                        >
                          <Plus className="size-3.5" />
                          <span>+ Agregar Contacto</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Vista Cuadrícula (100% de ancho con grid responsivo hasta 4 columnas) */
        <div className="w-full flex-1">
          {customers.length === 0 && !loading ? (
            <div className="bg-card border border-border rounded-2xl p-16 text-center space-y-3 w-full">
              <Users className="size-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm font-semibold text-foreground">No se encontraron contactos</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {search
                  ? `No hay resultados para "${search}". Prueba con otro término de búsqueda.`
                  : "Aún no tienes contactos registrados en tu cuenta."}
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:brightness-95 transition cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>+ Agregar Contacto</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 w-full">
              {customers.map((c) => {
                const avatarColor = avatarColorFromSeed(c.waPhone || c.id);
                const initials =
                  (c.fullName || c.waProfileName || "?")
                    .trim()
                    .split(/\s+/)
                    .map((p) => p[0]?.toUpperCase())
                    .slice(0, 2)
                    .join("") || "?";

                return (
                  <div
                    key={c.id}
                    className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`size-10 rounded-full grid place-items-center font-bold text-sm shrink-0 ${avatarColor.bg} ${avatarColor.text}`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3
                              className="font-bold text-xs text-foreground truncate"
                              title={c.fullName || c.waProfileName || "Sin nombre"}
                            >
                              {c.fullName || c.waProfileName || "Sin nombre"}
                            </h3>
                            <p className="text-[11px] text-muted-foreground font-mono truncate">
                              {c.waPhone ? formatWaPhone(c.waPhone) : "-"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenChat(c)}
                            className="p-1 rounded-md hover:bg-primary/10 text-primary cursor-pointer"
                            title="Abrir chat"
                          >
                            <MessageSquare className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="p-1 rounded-md hover:bg-muted text-foreground cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      {c.email && (
                        <p className="text-[11px] text-muted-foreground mt-2 truncate flex items-center gap-1">
                          <Mail className="size-3 shrink-0" />
                          <span>{c.email}</span>
                        </p>
                      )}

                      {/* Etiquetas */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {c.tags && c.tags.length > 0 ? (
                          c.tags.map((t) => {
                            const preset = getTagColorPreset(t.color);
                            return (
                              <span
                                key={t.id}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${preset.bgCls} ${preset.textCls} ${preset.borderCls}`}
                                style={preset.customStyle}
                              >
                                {t.name}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[10px] text-muted-foreground/60 italic">
                            Sin etiquetas
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-border/60 pt-2 flex justify-between items-center text-[10px] text-muted-foreground">
                      <span>Creado: {formatDate(c.createdAt)}</span>
                      {c.contracts && c.contracts.length > 0 && (
                        <span className="font-semibold text-primary">
                          {c.contracts.length} contrato(s)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 p-3.5 bg-card border border-border rounded-2xl shadow-xs text-xs w-full">
          <span className="text-muted-foreground">
            Mostrando página {page} de {totalPages} ({total} contactos en total)
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-3 font-semibold">{page}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Crear / Editar */}
      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={editingCustomer}
        onSuccess={() => {
          void fetchCustomers();
        }}
      />
    </div>
  );
}
