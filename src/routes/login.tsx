import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, LogIn, MessageCircle, Zap } from "lucide-react";
import { useAuth, useSession } from "@/modules/identity/application/use-session";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

/**
 * Login real con correo + contraseña (docs/spec/06_BACKEND_GAPS.md §1.b).
 * El backend valida las credenciales y deja una cookie httpOnly de sesión —
 * este componente nunca guarda ni maneja el token directamente.
 */
function LoginPage() {
  const navigate = useNavigate();
  const session = useSession();
  const { login, loggingIn, loginError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (session) navigate({ to: session.landing });
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const agent = await login(email.trim(), password);
      const landing = agent.role === "agent" ? "/bandeja" : "/";
      void navigate({ to: landing });
    } catch {
      // el error ya queda expuesto via loginError (loginMutation.error)
    }
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
            <Feature icon={ShieldCheck} label="Sesión protegida con inicio de sesión real" />
          </div>
        </div>

        <div className="relative text-[10px] text-muted-foreground tracking-widest uppercase">
          v2.0 · isp-customer-service-api · © 2026 NetOps
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <h1 className="font-extrabold tracking-tighter text-2xl uppercase">
              NetOps <span className="text-primary">AI</span>
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Inicia sesión</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Usa el correo y la contraseña que te dio tu administrador.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-xs space-y-1">
              <span className="font-bold uppercase tracking-wide text-muted-foreground">
                Correo
              </span>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.correo@empresa.com"
                className="w-full px-3 py-2.5 rounded-md border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block text-xs space-y-1">
              <span className="font-bold uppercase tracking-wide text-muted-foreground">
                Contraseña
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-md border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            {loginError && (
              <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-md px-3 py-2">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loggingIn || !email.trim() || !password}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40"
            >
              <LogIn className="size-4" />
              {loggingIn ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-[11px] text-muted-foreground text-center">
            ¿Olvidaste tu contraseña? Pide a un administrador que te la restablezca desde
            "Agentes".
          </p>
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
