import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Inbox,
  GitBranch,
  Megaphone,
  ShieldCheck,
  LogOut,
  KeyRound,
  ChevronDown,
  MessagesSquare,
  Users,
  ArrowRightLeft,
  Wifi,
  WifiOff,
  LayoutDashboard,
  Building2,
  BrainCircuit,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { canAccessPath, modulesForSession } from "@/modules/identity/application/access-control";
import { useAuth, useSession, useSessionLoading } from "@/modules/identity/application/use-session";
import { changePassword } from "@/modules/identity/infrastructure/auth.gateway";
import {
  useRealtimeConnected,
  useRealtimeSession,
} from "@/modules/realtime/application/use-realtime";
import { useUnreadBadge } from "@/modules/realtime/application/unread.state";
import { NotificationBell } from "@/modules/realtime/ui/NotificationBell";

type NavItem = {
  icon: LucideIcon;
  label: string;
  to: string;
};

const moduleIcons: Record<string, LucideIcon> = {
  "/": LayoutDashboard,
  "/bandeja": Inbox,
  "/chat-interno": MessagesSquare,
  "/escalaciones": ArrowRightLeft,
  "/asignaciones": Users,
  "/usuarios": Users,
  "/departamentos": Building2,
  "/flujos": GitBranch,
  "/campanas": Megaphone,
  "/auditoria": ShieldCheck,
  "/conocimiento": BrainCircuit,
};

/**
 * Composition root de la UI: la unica pieza que conoce al mismo tiempo
 * identity (sesion/nav) y realtime (conexion/notificaciones). El resto de
 * modulos nunca se importan entre si salvo a traves de application/ (DRY,
 * ver docs/skills/frontend-hexagonal-architecture.md).
 */
export function AppShell({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const session = useSession();
  const sessionLoading = useSessionLoading();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  useRealtimeSession(session?.id ?? null);
  const connected = useRealtimeConnected();

  const moduleNav = useMemo<NavItem[]>(() => {
    if (!session) return [];
    return modulesForSession(session).map((m) => ({
      icon: moduleIcons[m.to] ?? Inbox,
      label: m.label,
      to: m.to,
    }));
  }, [session]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionLoading) return; // esperar a saber si hay sesion real antes de decidir nada
    if (!session && pathname !== "/login") {
      void navigate({ to: "/login", replace: true });
      return;
    }
    if (session && !canAccessPath(session, pathname)) {
      void navigate({ to: session.landing, replace: true });
    }
  }, [session, sessionLoading, pathname, navigate]);

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background grid place-items-center text-muted-foreground text-sm">
        Cargando…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background grid place-items-center text-muted-foreground text-sm">
        Redirigiendo al login…
      </div>
    );
  }

  if (!canAccessPath(session, pathname)) {
    return (
      <div className="min-h-screen bg-background grid place-items-center text-muted-foreground text-sm">
        Sin acceso a esta pantalla… redirigiendo a {session.roleLabel}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background text-foreground font-sans flex overflow-hidden">
      <aside className="w-56 border-r border-border flex flex-col bg-card shrink-0 select-none">
        <div className="p-4 border-b border-border">
          <Link to={session.landing} className="block">
            <h1 className="font-extrabold tracking-tighter text-lg uppercase">
              NetOps <span className="text-primary">AI</span>
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wide">
              {session.roleLabel}
            </p>
          </Link>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {moduleNav.map((m) => (
            <NavLink key={m.to} item={m} pathname={pathname} />
          ))}
        </nav>

        <div className="p-2.5 border-t border-border relative">
          {menuOpen && !changePasswordOpen && (
            <div className="absolute bottom-full left-2.5 right-2.5 mb-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-20">
              <button
                type="button"
                onClick={() => setChangePasswordOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-foreground/5 text-left text-xs font-semibold"
              >
                <KeyRound className="size-3.5 text-muted-foreground" />
                Cambiar mi contraseña
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  void logout().then(() => navigate({ to: "/login", replace: true }));
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-danger/10 text-danger border-t border-border text-xs font-semibold"
              >
                <LogOut className="size-3.5" />
                Cerrar sesión
              </button>
            </div>
          )}
          {changePasswordOpen && (
            <ChangePasswordForm
              onClose={() => {
                setChangePasswordOpen(false);
                setMenuOpen(false);
              }}
            />
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="w-full flex items-center gap-2.5 p-1.5 rounded-md hover:bg-foreground/5 transition-colors"
          >
            <div className="size-8 rounded-full bg-primary/15 text-primary grid place-items-center text-xs font-bold shrink-0">
              {session.initials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold truncate">{session.name}</p>
              <div className="flex items-center gap-1">
                {connected ? (
                  <Wifi className="size-2.5 text-primary" />
                ) : (
                  <WifiOff className="size-2.5 text-muted-foreground" />
                )}
                <span className="text-[10px] text-muted-foreground truncate">
                  {session.roleLabel}
                </span>
              </div>
            </div>
            <ChevronDown
              className={`size-3.5 text-muted-foreground transition-transform ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0 h-full">
        <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <Icon className="size-4 text-muted-foreground" />
            <h2 className="text-xs font-bold tracking-tight">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded ring-1 ring-primary/20">
              {session.roleLabel}
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col">{children}</div>
      </main>
    </div>
  );
}

function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await changePassword(current, next);
      toast.success("Contraseña actualizada");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cambiar la contraseña");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="absolute bottom-full left-3 right-3 mb-2 bg-card border border-border rounded-lg shadow-xl p-3 space-y-2 z-20">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Cambiar mi contraseña
      </p>
      <input
        type="password"
        placeholder="Contraseña actual"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        className="w-full px-2.5 py-1.5 text-xs rounded border border-border bg-background"
      />
      <input
        type="password"
        placeholder="Nueva contraseña (mín. 8 caracteres)"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        className="w-full px-2.5 py-1.5 text-xs rounded border border-border bg-background"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy || !current || next.length < 8}
          onClick={() => void submit()}
          className="flex-1 py-1.5 rounded bg-primary text-primary-foreground text-[11px] font-bold uppercase disabled:opacity-40"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded border border-border text-[11px] font-bold uppercase"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = pathname === item.to;
  const unreadBadge = useUnreadBadge();
  const showBadge = item.to === "/bandeja" && unreadBadge > 0;

  return (
    <Link
      to={item.to}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-medium text-xs transition-colors ${
        active
          ? "bg-primary/10 text-primary font-bold"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <item.icon className="size-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </div>
      {showBadge && (
        <span className="flex h-4 min-w-[18px] px-1 items-center justify-center rounded-full bg-danger text-[10px] font-extrabold text-white shadow-sm ring-1 ring-background">
          {unreadBadge > 99 ? "99+" : unreadBadge}
        </span>
      )}
    </Link>
  );
}

export function SectionCard({
  title,
  children,
  right,
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border bg-background/60 flex justify-between items-center">
        <h3 className="text-xs font-extrabold uppercase tracking-widest">{title}</h3>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  unit,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  tone?: "default" | "danger" | "success" | "warning";
}) {
  const toneMap = {
    default: {
      wrap: "bg-card border-border",
      label: "text-muted-foreground",
      value: "text-foreground",
      hint: "text-muted-foreground",
    },
    success: {
      wrap: "bg-card border-border",
      label: "text-muted-foreground",
      value: "text-foreground",
      hint: "text-primary",
    },
    danger: {
      wrap: "bg-danger/5 border-danger/20",
      label: "text-danger",
      value: "text-danger",
      hint: "text-danger/70",
    },
    warning: {
      wrap: "bg-warning/5 border-warning/30",
      label: "text-warning",
      value: "text-foreground",
      hint: "text-warning",
    },
  }[tone];

  return (
    <div className={`p-4 border rounded-lg shadow-sm ${toneMap.wrap}`}>
      <p className={`text-[10px] font-bold uppercase tracking-tight ${toneMap.label}`}>{label}</p>
      <p className={`text-2xl font-extrabold font-mono mt-1 ${toneMap.value}`}>
        {value}
        {unit && <span className="text-xs ml-0.5">{unit}</span>}
      </p>
      {hint && <p className={`text-[10px] mt-1 ${toneMap.hint}`}>{hint}</p>}
    </div>
  );
}
