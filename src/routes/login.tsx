import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, LogIn, MessageCircle, Zap, Lock } from "lucide-react";
import { getUserByEmail } from "@/lib/users-store";
import {
  signIn,
  toSessionUser,
  useDemoUsers,
  useSession,
  type DemoUser,
} from "../lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const session = useSession();
  const demoUsers = useDemoUsers();
  const [email, setEmail] = useState("javier.diaz@netops.co");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: session.landing });
  }, [session, navigate]);

  const doLogin = (user: DemoUser) => {
    setLoading(true);
    setError("");
    setTimeout(() => {
      signIn(user);
      navigate({ to: user.landing });
    }, 450);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const directoryUser = getUserByEmail(email);
    if (!directoryUser) {
      setError("Usuario no encontrado. Prueba con un perfil demo o crea uno en Usuarios.");
      return;
    }
    if (!directoryUser.active) {
      setError("Usuario inactivo. Contacta a Admin TI.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    doLogin(toSessionUser(directoryUser));
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans grid lg:grid-cols-2">
      {/* Left — brand panel */}
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
            Orquesta soporte, cartera y UTGA con agentes de IA sobre WhatsApp.
          </h2>
          <div className="space-y-3">
            <Feature icon={MessageCircle} label="Bandeja unificada + handover humano" />
            <Feature icon={Zap} label="Flujos n8n: diagnóstico ONU, OCR boucher, viabilidad" />
            <Feature icon={ShieldCheck} label="TLS 1.3 · RBAC · PII enmascarada · auditoría" />
          </div>
        </div>

        <div className="relative text-[10px] text-muted-foreground tracking-widest uppercase">
          v1.0 · Prototype · © 2026 NetOps
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <h1 className="font-extrabold tracking-tighter text-2xl uppercase">
              NetOps <span className="text-primary">AI</span>
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Iniciar sesión</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Accede a la consola operativa NetOps.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Correo corporativo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full px-4 py-2.5 bg-card border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition"
                placeholder="tu.usuario@netops.co"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Lock className="size-3" /> Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full px-4 py-2.5 bg-card border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background text-sm font-bold rounded-md hover:bg-foreground/85 transition-colors disabled:opacity-60"
            >
              <LogIn className="size-4" />
              {loading ? "Autenticando..." : "Ingresar"}
            </button>

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <ShieldCheck className="size-3 text-primary" />
              Sesión cifrada TLS 1.3 · MFA requerido en producción
            </div>
          </form>

          <div className="my-8 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Simular ingreso demo
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {demoUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => doLogin(u)}
                className="text-left p-3 bg-card border border-border rounded-lg hover:border-primary/40 hover:bg-primary/5 transition group"
              >
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-primary/15 text-primary grid place-items-center text-[10px] font-bold">
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
