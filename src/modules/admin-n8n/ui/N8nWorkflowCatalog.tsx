import { Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { StatCard } from "@/app/shell/AppShell";
import { useSession } from "@/modules/identity/application/use-session";
import {
  deactivateN8nWorkflow,
  listN8nWorkflows,
  upsertN8nWorkflow,
} from "@/modules/admin-n8n/infrastructure/n8n-workflow.gateway";
import type { N8nWorkflowEntryDto } from "@/modules/admin-n8n/domain/n8n-workflow";
import { caseStepLabel } from "@/modules/cases/domain/case";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  case_action: "Acción dentro de un caso",
  admin_action: "Acción administrativa",
};

type DraftMap = Record<string, { url: string; timeoutMs: number; maxRetries: number }>;

export function N8nWorkflowCatalog() {
  const session = useSession();
  const [entries, setEntries] = useState<N8nWorkflowEntryDto[]>([]);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const reload = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await listN8nWorkflows(session.id);
      setEntries(data);
      setDrafts(
        Object.fromEntries(
          data.map((e) => [
            e.action,
            { url: e.url, timeoutMs: e.timeoutMs, maxRetries: e.maxRetries },
          ]),
        ),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar el catálogo n8n");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  const activeCount = entries.filter((e) => e.active).length;
  const caseActionCount = entries.filter((e) => e.category === "case_action").length;

  const save = async (action: string) => {
    if (!session) return;
    const draft = drafts[action];
    if (!draft) return;
    setBusyAction(action);
    try {
      await upsertN8nWorkflow(session.id, action, {
        url: draft.url,
        timeoutMs: draft.timeoutMs,
        maxRetries: draft.maxRetries,
      });
      toast.success(`${caseStepLabel(action)} actualizado`);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setBusyAction(null);
    }
  };

  const deactivate = async (action: string) => {
    if (!session) return;
    setBusyAction(action);
    try {
      await deactivateN8nWorkflow(session.id, action);
      toast.success(`${caseStepLabel(action)} desactivado`);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo desactivar");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <>
      <div className="mb-4 p-3 rounded-lg border border-border bg-card text-[11px] text-muted-foreground animate-fade-up">
        Aquí se configuran las automatizaciones que ejecutan los flujos del asistente (por ejemplo,
        a qué dirección web avisar cuando hay que revisar un saldo). Cambiar algo aquí aplica de
        inmediato, sin reiniciar el sistema.
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        <StatCard label="Automatizaciones" value={String(entries.length)} />
        <StatCard label="Activas" value={String(activeCount)} tone="success" />
        <StatCard label="Dentro de un caso" value={String(caseActionCount)} />
        <StatCard
          label="Permiso de edición"
          value={session?.role === "admin" ? "Sí" : "No"}
          tone={session?.role === "admin" ? "success" : "danger"}
          hint="Solo administradores"
        />
      </section>

      <section className="bg-card border border-border rounded-xl overflow-hidden animate-fade-up">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="text-xs font-extrabold uppercase tracking-widest">
            {loading ? "Cargando…" : "Catálogo de automatizaciones"}
          </h3>
        </div>
        <div className="divide-y divide-border">
          {entries.map((e) => {
            const draft = drafts[e.action] ?? {
              url: e.url,
              timeoutMs: e.timeoutMs,
              maxRetries: e.maxRetries,
            };
            return (
              <div key={e.action} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-bold text-sm">{caseStepLabel(e.action)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {CATEGORY_LABELS[e.category] ?? e.category} · actualizado el{" "}
                      {new Date(e.updatedAt).toLocaleString("es-CO")}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ring-1 ${
                      e.active
                        ? "bg-primary/10 text-primary ring-primary/30"
                        : "bg-foreground/5 text-muted-foreground ring-border"
                    }`}
                  >
                    {e.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="grid sm:grid-cols-3 gap-2">
                  <input
                    value={draft.url}
                    disabled={session?.role !== "admin"}
                    onChange={(ev) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [e.action]: { ...draft, url: ev.target.value },
                      }))
                    }
                    className="sm:col-span-2 px-2 py-1.5 text-xs border border-border rounded bg-background font-mono disabled:opacity-60"
                    placeholder="Dirección web (https://...)"
                  />
                  <input
                    type="number"
                    value={draft.timeoutMs}
                    disabled={session?.role !== "admin"}
                    onChange={(ev) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [e.action]: { ...draft, timeoutMs: Number(ev.target.value) },
                      }))
                    }
                    className="px-2 py-1.5 text-xs border border-border rounded bg-background disabled:opacity-60"
                    placeholder="Tiempo máx. de espera (ms)"
                  />
                </div>
                {session?.role === "admin" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyAction === e.action}
                      onClick={() => void save(e.action)}
                      className="inline-flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded bg-foreground text-background font-bold uppercase disabled:opacity-40"
                    >
                      <Save className="size-3" /> Guardar
                    </button>
                    {e.active && (
                      <button
                        type="button"
                        disabled={busyAction === e.action}
                        onClick={() => void deactivate(e.action)}
                        className="inline-flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded border border-danger/30 text-danger font-bold uppercase disabled:opacity-40"
                      >
                        <Trash2 className="size-3" /> Desactivar
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {!loading && entries.length === 0 && (
            <p className="p-6 text-center text-xs text-muted-foreground">
              Todavía no hay automatizaciones configuradas.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
