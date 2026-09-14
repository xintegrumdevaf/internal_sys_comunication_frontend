import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Search,
  Zap,
  Edit2,
  Trash2,
  Building2,
  Globe2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { quickRepliesApi } from "@/services/quick-replies.api";
import type {
  QuickReply,
  CreateQuickReplyPayload,
  UpdateQuickReplyPayload,
} from "@/types/quick-reply";
import { QuickReplyFormModal } from "@/components/quick-replies/QuickReplyFormModal";
import {
  useDepartmentsQuery,
  useSession,
} from "@/modules/identity/application/use-session";
import { toast } from "sonner";

export function QuickRepliesManagementView() {
  const session = useSession();
  const { data: departments = [] } = useDepartmentsQuery();

  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("all");

  // Estado del modal de creación / edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);

  const isManager = session?.role === "manager";
  const userDeptId = session?.primaryDepartmentId ?? null;

  const loadReplies = useCallback(async () => {
    try {
      setLoading(true);
      const data = await quickRepliesApi.list();
      setReplies(data);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar las respuestas rápidas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReplies();
  }, [loadReplies]);

  const handleSave = async (payload: CreateQuickReplyPayload) => {
    try {
      if (editingReply) {
        const updatePayload: UpdateQuickReplyPayload = {
          shortcut: payload.shortcut,
          title: payload.title,
          body: payload.body,
          category: payload.category,
          departmentId: payload.departmentId,
        };
        const updated = await quickRepliesApi.update(editingReply.id, updatePayload);
        setReplies((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        toast.success(`Respuesta rápida /${updated.shortcut} actualizada`);
      } else {
        const created = await quickRepliesApi.create(payload);
        setReplies((prev) => [created, ...prev]);
        toast.success(`Respuesta rápida /${created.shortcut} creada`);
      }
      setIsModalOpen(false);
      setEditingReply(null);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Error al procesar la solicitud";
      toast.error(msg);
      throw err;
    }
  };

  const handleDelete = async (reply: QuickReply) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la respuesta rápida /${reply.shortcut}?`)) {
      return;
    }
    try {
      await quickRepliesApi.delete(reply.id);
      setReplies((prev) => prev.filter((r) => r.id !== reply.id));
      toast.success(`Respuesta /${reply.shortcut} eliminada`);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Error al eliminar";
      toast.error(msg);
    }
  };

  const handleToggleActive = async (reply: QuickReply) => {
    try {
      const updated = await quickRepliesApi.update(reply.id, {
        active: !reply.active,
      });
      setReplies((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(
        `Respuesta /${reply.shortcut} ${updated.active ? "activada" : "desactivada"}`,
      );
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Error al cambiar estado";
      toast.error(msg);
    }
  };

  // Filtrado reactivo en memoria
  const filteredReplies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return replies.filter((r) => {
      const matchQuery =
        !q ||
        r.shortcut.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.body.toLowerCase().includes(q);

      if (!matchQuery) return false;

      if (selectedDeptFilter === "all") return true;
      if (selectedDeptFilter === "global") return r.departmentId === null;
      return r.departmentId === selectedDeptFilter;
    });
  }, [replies, search, selectedDeptFilter]);

  const canEdit = (reply: QuickReply) => {
    if (session?.role === "admin") return true;
    if (isManager && reply.departmentId === userDeptId) return true;
    return false;
  };

  return (
    <div className="space-y-4">
      {/* Barra superior de acciones y filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por /atajo, título o texto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-card border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            />
          </div>

          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="px-3 py-1.5 bg-card border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
          >
            <option value="all">Todos los ámbitos</option>
            <option value="global">🌐 Solo Globales</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                🏢 {dept.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void loadReplies()}
            title="Recargar respuestas"
            className="p-2 rounded-xl bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingReply(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:brightness-95 transition"
        >
          <Plus className="size-4" />
          Nueva Respuesta Rápida
        </button>
      </div>

      {/* Lista / Grilla de Respuestas Rápidas */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground bg-card border border-border rounded-2xl">
          Cargando catálogo de respuestas rápidas...
        </div>
      ) : filteredReplies.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-2xl">
          <Zap className="size-8 text-muted-foreground/40 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-foreground">
            No se encontraron respuestas rápidas
          </h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search
              ? "Prueba con otros términos de búsqueda o cambia los filtros de departamento."
              : "Crea tu primera respuesta rápida con un atajo para agilizar la atención en el chat."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredReplies.map((item) => {
            const dept = departments.find((d) => d.id === item.departmentId);
            const userCanEdit = canEdit(item);

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between p-4 rounded-2xl bg-card border transition-all ${
                  item.active ? "border-border shadow-sm" : "border-border/60 opacity-60 bg-muted/20"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-lg bg-primary/10 text-primary">
                        /{item.shortcut}
                      </span>
                      {item.departmentId ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <Building2 className="size-3" />
                          {dept?.name ?? "Área"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <Globe2 className="size-3" />
                          Global
                        </span>
                      )}
                      {item.category && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {item.category}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={!userCanEdit}
                      onClick={() => void handleToggleActive(item)}
                      title={item.active ? "Desactivar respuesta" : "Activar respuesta"}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-40"
                    >
                      {item.active ? (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      ) : (
                        <XCircle className="size-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-foreground mt-2">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3 font-sans whitespace-pre-wrap">
                    {item.body}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border/80">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {item.body.includes("{{") ? "Contiene variables dinámicas" : "Texto directo"}
                  </span>

                  {userCanEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReply(item);
                          setIsModalOpen(true);
                        }}
                        title="Editar respuesta"
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(item)}
                        title="Eliminar respuesta"
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Creación / Edición */}
      <QuickReplyFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReply(null);
        }}
        onSave={handleSave}
        initialData={editingReply}
        departments={departments}
        currentUserRole={session?.role ?? "agent"}
        currentAgentDepartmentId={userDeptId}
      />
    </div>
  );
}
