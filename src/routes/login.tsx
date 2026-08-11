import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShieldCheck, LogIn, MessageCircle, Zap } from "lucide-react";
import {
  signIn,
  useDirectoryUsers,
  useSession,
} from "@/modules/identity/application/use-session";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

/**
 * Selector de perfil sobre agentes reales de isp-customer-service-api.
 * El backend no tiene JWT/login todavía (docs/spec/00_OVERVIEW.md §2), así que
 * no simulamos un password que no valida nada real: se elige el agente y listo.
 */
function LoginPage() {
  const navigate = useNavigate();
  const session = useSession();
  const directory = useDirectoryUsers();
  const activeAgents = directory.filter((u) => u.active);

  useEffect(() => {
    if (session) navigate({ to: session.landing });
  }, [session, navigate]);

  const doLogin = (agentId: string, landing: string) => {
    signIn(agentId);
    void navigate({ to: landing });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-card border-r border-border relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_20%_20%,var(--color-primary)_0,transparent_50%),radial-gradient(circle_at_80%_80%,var(--color-primary)_0,transparent_50%)]" />
        <div className="relative">
          <h1 className="font-extrabold tracking-tighter text-3xl uppercase">
            NetOps <span className="text-primary">AI</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-2 tracking-wide">
            WhatsApp Ops Platform · ISP
          </p>
        </div>

        <div className="relative space-y-6 max-w-md">
          <h2 className="text-3xl font-bold tracking-tight leading-tight">
            Orquesta soporte, facturación y ventas con agentes de IA sobre WhatsApp.
          </h2>
          <div className="space-y-3">
            <Feature icon={MessageCircle} label="Bandeja unificada + handover humano" />
            <Feature icon={Zap} label="Motor de casos con escalación y auditoría real" />
            <Feature icon={ShieldCheck} label="Datos en vivo desde isp-customer-service-api" />
          </div>
        </div>

        <div className="relative text-[10px] text-muted-foreground tracking-widest uppercase">
          v2.0 · isp-customer-service-api · © 2026 NetOps
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <h1 className="font-extrabold tracking-tighter text-2xl uppercase">
              NetOps <span className="text-primary">AI</span>
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Selecciona tu perfil</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Agentes reales del backend (isp-customer-service-api). Aún no hay login con
              contraseña — la identidad se declara por agente, igual que en la API.
            </p>
          </div>

          {activeAgents.length === 0 ? (
            <p className="text-xs text-muted-foreground border border-border rounded-lg p-4 bg-card">
              No hay agentes activos en el backend. Verifica que{" "}
              <code className="font-mono">isp-customer-service-api</code> esté corriendo y con
              seed aplicado (<code className="font-mono">npm run seed</code>).
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeAgents.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => doLogin(u.id, u.landing)}
                  className="text-left p-3 bg-card border border-border rounded-lg hover:border-primary/40 hover:bg-primary/5 transition group"
                >
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-primary/15 text-primary grid place-items-center text-[10px] font-bold shrink-0">
                      {u.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.roleLabel}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 flex items-center gap-2 text-[10px] text-muted-foreground">
            <LogIn className="size-3.5 text-primary" />
            Sin contraseña por ahora — ver docs/spec/06_BACKEND_GAPS.md
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, label }: { icon: typeof ShieldCheck; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <div className="size-8 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
        <Icon className="size-4" />
      </div>
      {label}
    </div>
  );
}
