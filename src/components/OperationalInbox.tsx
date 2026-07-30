import { Bot, User, ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import { MessageMediaBody } from "@/components/chat/MessageMediaBody";
import {
  intentLabel,
  relativeTime,
  useOperationalInbox,
} from "@/hooks/use-operational-inbox";

type Props = {
  departmentSlug?: string;
  userScope?: boolean;
  subtitle?: string;
};

export function OperationalInbox({ departmentSlug, userScope = true, subtitle }: Props) {
  const {
    conversations,
    selected,
    selectedId,
    setSelectedId,
    messages,
    context,
    loading,
    busy,
    takeControl,
    transfer,
  } = useOperationalInbox({ departmentSlug, userScope: !departmentSlug && userScope });

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferSlug, setTransferSlug] = useState("");
  const [transferReason, setTransferReason] = useState("Requiere atención del área destino");

  return (
    <section className="grid grid-cols-12 gap-6 min-h-[680px] animate-fade-up">
      <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border bg-background/60 flex justify-between items-center">
          <h3 className="text-xs font-extrabold uppercase tracking-widest">
            {loading ? "Cargando…" : `${conversations.length} conversaciones`}
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">
            {subtitle ?? "Mock Core · WhatsApp"}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {conversations.map((c) => {
            const tag = intentLabel(c.intent);
            const active = c.id === selectedId;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left p-4 transition-colors ${
                  active
                    ? "bg-primary/5 border-l-4 border-primary"
                    : "hover:bg-foreground/5 border-l-4 border-transparent"
                }`}
              >
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold">{c.customerName ?? c.waPhone}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {relativeTime(c.updatedAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {c.lastMessagePreview}
                </p>
                <div className="mt-2 flex gap-1.5 flex-wrap items-center">
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${tag.cls}`}>
                    {tag.label}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                      c.handlerMode === "ai"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {c.handlerMode === "ai" ? "IA" : "Humano"}
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-foreground/5 text-muted-foreground">
                    {c.status}
                  </span>
                </div>
              </button>
            );
          })}
          {!loading && conversations.length === 0 && (
            <p className="p-6 text-xs text-muted-foreground">
              No hay conversaciones para este perfil/departamento.
            </p>
          )}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-5 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
        {selected ? (
          <>
            <div className="p-4 border-b border-border bg-background/60 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">
                  {selected.customerName ?? selected.waPhone}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {selected.contractId
                    ? `Contrato #${selected.contractId}`
                    : selected.waPhone}
                  {context?.department ? ` · ${context.department.name}` : ""}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  disabled={busy || selected.handlerMode === "human"}
                  onClick={() => void takeControl()}
                  className="text-[10px] px-3 py-1.5 rounded bg-danger text-danger-foreground font-bold uppercase disabled:opacity-40"
                >
                  Tomar Control
                </button>
                <button
                  disabled={busy}
                  onClick={() => {
                    setTransferSlug(context?.transferTargets?.[0]?.slug ?? "");
                    setTransferOpen((v) => !v);
                  }}
                  className="text-[10px] px-3 py-1.5 rounded border border-border font-bold uppercase flex items-center gap-1"
                >
                  <ArrowRightLeft className="size-3" /> Transferir
                </button>
              </div>
            </div>

            {transferOpen && (
              <div className="p-3 border-b border-border bg-background/80 space-y-2">
                <select
                  value={transferSlug}
                  onChange={(e) => setTransferSlug(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border border-border rounded bg-card"
                >
                  {(context?.transferTargets ?? []).map((d) => (
                    <option key={d.id} value={d.slug}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <input
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border border-border rounded bg-card"
                  placeholder="Motivo de transferencia"
                />
                <button
                  disabled={busy || !transferSlug}
                  onClick={() => {
                    void transfer(transferSlug, transferReason).then(() =>
                      setTransferOpen(false),
                    );
                  }}
                  className="w-full text-[10px] py-1.5 rounded bg-foreground text-background font-bold uppercase"
                >
                  Confirmar transferencia
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-background/40">
              {messages.map((m) => {
                const fromCustomer = m.author === "customer";
                return (
                  <div
                    key={m.id}
                    className={`flex ${fromCustomer ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-2xl text-[12px] leading-snug shadow-sm ${
                        fromCustomer
                          ? "bg-card border border-border"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 opacity-80">
                        {fromCustomer ? <User className="size-3" /> : <Bot className="size-3" />}
                        <span className="text-[9px] uppercase font-bold tracking-widest">
                          {fromCustomer
                            ? "Cliente"
                            : m.author === "agent"
                              ? "Agente"
                              : "IA"}
                        </span>
                      </div>
                      <MessageMediaBody message={m} />
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground">Sin mensajes en el hilo.</p>
              )}
            </div>
            <div className="p-3 border-t border-border bg-background/60 flex gap-2">
              <input
                disabled
                placeholder="Respuesta (mock — conexión Meta pendiente)"
                className="flex-1 px-3 py-2 bg-card border border-border rounded-md text-xs outline-none opacity-60"
              />
              <button
                disabled
                className="px-4 py-2 bg-primary/50 text-primary-foreground text-xs font-bold rounded-md"
              >
                Enviar
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-xs text-muted-foreground">
            Selecciona una conversación
          </div>
        )}
      </div>

      <div className="col-span-12 lg:col-span-3 space-y-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3">
            Contexto Cliente
          </h3>
          {context?.customer ? (
            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contrato</span>
                <span className="font-bold">#{context.customer.contractId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span>{context.customer.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado</span>
                <span className="text-primary font-bold uppercase">
                  {context.customer.billingStatus.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sector</span>
                <span>{context.customer.sector}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Dirección</span>
                <span className="text-right">{context.customer.address}</span>
              </div>
              {context.customer.onuPowerDbm != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ONU RX</span>
                  <span
                    className={
                      context.customer.onuPowerDbm < -25
                        ? "text-danger font-bold"
                        : "text-primary font-bold"
                    }
                  >
                    {context.customer.onuPowerDbm} dBm
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Sin contrato vinculado (prospecto / alerta sistema).
            </p>
          )}
        </div>

        {context?.payment && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3">Pago</h3>
            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto</span>
                <span className="font-bold">
                  {context.payment.monto.toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método</span>
                <span>{context.payment.metodo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado</span>
                <span className="font-bold">{context.payment.estado}</span>
              </div>
            </div>
          </div>
        )}

        {context?.workOrder && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3">OT</h3>
            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Código</span>
                <span className="font-bold">{context.workOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo</span>
                <span className="text-right">{context.workOrder.tipo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado</span>
                <span className="font-bold">{context.workOrder.estado}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
