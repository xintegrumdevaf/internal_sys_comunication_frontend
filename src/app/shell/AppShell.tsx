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
  LayoutTemplate,
  Menu,
  X,
  Sparkles,
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
import { ThemeToggle } from "@/shared/theme/ThemeToggle";

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
  "/calidad": ShieldCheck,
  "/usuarios": Users,
  "/departamentos": Building2,
  "/flujos": GitBranch,
  "/campanas": Megaphone,
  "/plantillas": LayoutTemplate,
  "/auditoria": ShieldCheck,
  "/conocimiento": BrainCircuit,
};

/**
 * Composition root de la UI: la única pieza que conoce al mismo tiempo
 * identity (sesión/nav) y realtime (conexión/notificaciones).
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  useRealtimeSession(session?.id ?? null);
  const connected = useRealtimeConnected();

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
    if (sessionLoading) return;
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
      <div className="min-h-screen bg-background grid place-items-center text-muted-foreground text-sm font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p>Cargando sesión…</p>
        </div>
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

  const renderNavContent = () => (
    <>
      <div className="p-4 border-b border-border flex items-center justify-between bg-card shrink-0">
        <Link to={session.landing} className="flex items-center gap-2.5 min-w-0 group" onClick={() => setMobileMenuOpen(false)}>
          <div className="size-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black tracking-tight shadow-xs group-hover:scale-105 transition-transform">
            N
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold tracking-tight text-base text-foreground flex items-center gap-1">
              NetOps <span className="text-primary">AI</span>
            </h1>
            <p className="text-[10px] text-muted-foreground tracking-wide font-medium truncate">
              {session.roleLabel}
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 -mr-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          aria-label="Cerrar menú"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {moduleNav.map((m) => (
          <NavLink key={m.to} item={m} pathname={pathname} onSelect={() => setMobileMenuOpen(false)} />
        ))}
      </nav>

      <div className="p-3 border-t border-border bg-card relative shrink-0">
        {menuOpen && !changePasswordOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-30 animate-fade-up">
            <button
              type="button"
              onClick={() => setChangePasswordOpen(true)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-foreground/5 text-left text-xs font-semibold text-foreground transition-colors"
            >
              <KeyRound className="size-4 text-muted-foreground" />
              <span>Cambiar mi contraseña</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setMobileMenuOpen(false);
                void logout().then(() => navigate({ to: "/login", replace: true }));
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-danger/10 text-danger border-t border-border text-xs font-semibold transition-colors"
            >
              <LogOut className="size-4" />
              <span>Cerrar sesión</span>
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
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex-1 min-w-0 flex items-center gap-2.5 p-2 rounded-xl hover:bg-foreground/5 transition-colors text-left"
          >
            <div className="relative shrink-0">
              <div className="size-8 rounded-full bg-primary/15 text-primary grid place-items-center text-xs font-bold ring-1 ring-primary/30">
                {session.initials}
              </div>
              <span className={`absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-card ${connected ? "bg-emerald-500" : "bg-amber-500"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{session.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{session.email}</p>
            </div>
            <ChevronDown
              className={`size-3.5 text-muted-foreground transition-transform shrink-0 ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="h-screen w-screen bg-background text-foreground font-sans flex overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 border-r border-border flex-col bg-card shrink-0 select-none">
        {renderNavContent()}
      </aside>

      {/* Drawer Móvil con Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-card border-r border-border flex flex-col shadow-2xl lg:hidden transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderNavContent()}
      </aside>

      {/* Área Principal */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 h-full">
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 -ml-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 shrink-0 transition-colors"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="size-5" />
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon className="size-4" />
              </div>
              <h2 className="text-xs sm:text-sm font-bold tracking-tight text-foreground truncate">{title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-background border border-border text-[11px] text-muted-foreground font-medium">
              {connected ? (
                <>
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-foreground font-semibold">En vivo</span>
                </>
              ) : (
                <>
                  <span className="size-2 rounded-full bg-amber-500" />
                  <span>Reconectando</span>
                </>
              )}
            </div>

            <NotificationBell />

            <ThemeToggle variant="dropdown" />

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-extrabold uppercase rounded-full ring-1 ring-primary/20">
              {session.roleLabel}
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col">
          <div className="w-full flex-1 flex flex-col min-h-0">{children}</div>
        </div>
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
    <div className="absolute bottom-full left-3 right-3 mb-2 bg-card border border-border rounded-xl shadow-xl p-3.5 space-y-2.5 z-30 animate-fade-up">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Cambiar mi contraseña
      </p>
      <input
        type="password"
        placeholder="Contraseña actual"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20"
      />
      <input
        type="password"
        placeholder="Nueva contraseña (mín. 8 caracteres)"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20"
      />
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={busy || !current || next.length < 8}
          onClick={() => void submit()}
          className="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase disabled:opacity-40 hover:bg-primary/90 transition-colors shadow-xs"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold uppercase hover:bg-foreground/5 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function NavLink({
  item,
  pathname,
  onSelect,
}: {
  item: NavItem;
  pathname: string;
  onSelect?: () => void;
}) {
  const active = pathname === item.to;
  const unreadBadge = useUnreadBadge();
  const showBadge = item.to === "/bandeja" && unreadBadge > 0;

  return (
    <Link
      to={item.to}
      onClick={onSelect}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
        active
          ? "bg-primary/15 text-primary font-bold shadow-xs ring-1 ring-primary/20"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <item.icon className={`size-4 shrink-0 transition-transform ${active ? "scale-110 text-primary" : ""}`} />
        <span className="truncate">{item.label}</span>
      </div>
      {showBadge && (
        <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-danger text-[10px] font-extrabold text-white shadow-sm ring-2 ring-card shrink-0">
          {unreadBadge > 99 ? "99+" : unreadBadge}
        </span>
      )}
    </Link>
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
      wrap: "bg-card border-border hover:border-primary/40",
      accent: "bg-primary/60",
      label: "text-muted-foreground",
      value: "text-foreground",
      hint: "text-muted-foreground",
    },
    success: {
      wrap: "bg-card border-border hover:border-emerald-500/40",
      accent: "bg-emerald-500",
      label: "text-muted-foreground",
      value: "text-foreground",
      hint: "text-emerald-600 dark:text-emerald-400 font-medium",
    },
    danger: {
      wrap: "bg-card border-border hover:border-danger/40",
      accent: "bg-danger",
      label: "text-danger",
      value: "text-danger",
      hint: "text-danger/80",
    },
    warning: {
      wrap: "bg-card border-border hover:border-amber-500/40",
      accent: "bg-amber-500",
      label: "text-amber-700 dark:text-amber-400",
      value: "text-foreground",
      hint: "text-amber-700 dark:text-amber-400 font-medium",
    },
  }[tone];

  return (
    <div className={`relative p-4 sm:p-5 border rounded-2xl shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden ${toneMap.wrap}`}>
      <div className={`absolute top-0 left-0 right-0 h-1 ${toneMap.accent}`} />
      <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${toneMap.label}`}>
        {label}
      </p>
      <p className={`text-2xl sm:text-3xl font-extrabold font-mono mt-2 tracking-tight ${toneMap.value}`}>
        {value}
        {unit && <span className="text-xs sm:text-sm ml-1.5 font-sans font-normal text-muted-foreground">{unit}</span>}
      </p>
      {hint && <p className={`text-[10px] sm:text-[11px] mt-1.5 truncate ${toneMap.hint}`}>{hint}</p>}
    </div>
  );
}

