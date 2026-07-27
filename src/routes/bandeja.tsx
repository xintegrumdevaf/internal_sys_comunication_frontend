import { createFileRoute } from "@tanstack/react-router";
import { Inbox, Bot, User } from "lucide-react";
import { AppShell } from "../components/AppShell";

export const Route = createFileRoute("/bandeja")({
  component: BandejaPage,
});

const chats = [
  { who: "+57 301 445 8890", preview: "No tengo internet, la luz de la ONU parpadea…", time: "2m", tag: "Daño", tagCls: "bg-red-100 text-red-700", agent: "ia", active: true },
  { who: "Carlos Ruiz", preview: "Envío comprobante de pago del mes…", time: "10m", tag: "Pago", tagCls: "bg-green-100 text-green-700", agent: "hum" },
  { who: "+57 322 890 1122", preview: "Quiero saber si hay cobertura en Sector B…", time: "15m", tag: "Instalación", tagCls: "bg-amber-100 text-amber-700", agent: "ia" },
  { who: "María Peña", preview: "Adjunto boucher de $85.000 — Contrato 4521", time: "22m", tag: "Pago", tagCls: "bg-green-100 text-green-700", agent: "ia" },
  { who: "+57 318 220 4410", preview: "Necesito traslado de mi servicio a nueva dirección", time: "34m", tag: "Traslado", tagCls: "bg-amber-100 text-amber-700", agent: "hum" },
  { who: "Andrés Gómez", preview: "Cuándo llega la cuadrilla técnica?", time: "45m", tag: "UTGA", tagCls: "bg-blue-100 text-blue-700", agent: "ia" },
];

const active = chats[0];

const messages = [
  { from: "user", text: "Hola, no tengo internet desde ayer en la noche. La luz roja de la ONU está parpadeando." },
  { from: "bot", text: "Hola María. Detecté tu contrato #4521. Estoy consultando el estado de tu equipo en la OLT…" },
  { from: "bot", text: "Lectura ONU: potencia RX -27.4 dBm (crítico). Genero visita técnica prioritaria." },
  { from: "user", text: "¿Cuándo viene el técnico? Necesito trabajar." },
  { from: "bot", text: "Cuadrilla asignada — ventana 14:00 a 16:00 hoy. Ticket #9921. ¿Confirmas la dirección Cra 21 #45-12?" },
];

function BandejaPage() {
  return (
    <AppShell title="Bandeja Unificada · Chatwoot" icon={Inbox}>
      <section className="grid grid-cols-12 gap-6 min-h-[680px] animate-fade-up">
        <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-background/60 flex justify-between items-center">
            <h3 className="text-xs font-extrabold uppercase tracking-widest">6 conversaciones</h3>
            <span className="text-[10px] font-mono text-muted-foreground">WhatsApp Cloud API</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {chats.map((c) => (
              <button key={c.who} className={`w-full text-left p-4 transition-colors ${c.active ? "bg-primary/5 border-l-4 border-primary" : "hover:bg-foreground/5 border-l-4 border-transparent"}`}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold">{c.who}</span>
                  <span className="text-[10px] text-muted-foreground">{c.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.preview}</p>
                <div className="mt-2 flex gap-1.5 flex-wrap items-center">
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${c.tagCls}`}>{c.tag}</span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${c.agent === "ia" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                    {c.agent === "ia" ? "IA" : "Humano"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-background/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold">{active.who}</p>
              <p className="text-[10px] text-muted-foreground">Contrato #4521 · Sector A</p>
            </div>
            <button className="text-[10px] px-3 py-1.5 rounded bg-danger text-danger-foreground font-bold uppercase">Tomar Control</button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-background/40">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-[12px] leading-snug shadow-sm ${m.from === "user" ? "bg-card border border-border" : "bg-primary text-primary-foreground"}`}>
                  <div className="flex items-center gap-1.5 mb-1 opacity-80">
                    {m.from === "user" ? <User className="size-3" /> : <Bot className="size-3" />}
                    <span className="text-[9px] uppercase font-bold tracking-widest">{m.from === "user" ? "Cliente" : "IA · Soporte"}</span>
                  </div>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border bg-background/60 flex gap-2">
            <input placeholder="Escribe una respuesta (Meta-approved templates)…" className="flex-1 px-3 py-2 bg-card border border-border rounded-md text-xs outline-none focus:ring-2 focus:ring-primary/20" />
            <button className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-md">Enviar</button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3">Contexto Cliente</h3>
            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex justify-between"><span className="text-muted-foreground">Contrato</span><span className="font-bold">#4521</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span>300 Mbps</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Estado</span><span className="text-primary font-bold">Al día</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Última visita</span><span>03 Mar 2026</span></div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3">Sugerencias IA</h3>
            <div className="space-y-2 text-[11px]">
              <button className="w-full text-left p-2 rounded border border-border hover:bg-foreground/5">Confirmar dirección de visita</button>
              <button className="w-full text-left p-2 rounded border border-border hover:bg-foreground/5">Ofrecer compensación por hora fuera</button>
              <button className="w-full text-left p-2 rounded border border-border hover:bg-foreground/5">Cerrar caso tras confirmación</button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
