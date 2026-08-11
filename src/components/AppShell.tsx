import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Search,
  Wrench,
  Wallet,
  ShoppingBag,
  Inbox,
  GitBranch,
  Megaphone,
  ShieldCheck,
  LogOut,
  ChevronDown,
  MessagesSquare,
  Users,
  Bell,
  ArrowRightLeft,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  canAccessDepartment,
  canAccessPath,
  modulesForSession,
  signIn,
  signOut,
  useDepartmentsQuery,
  useDirectoryUsers,
  useSession,
} from "../lib/auth";
import { useNotifications, useRealtimeConnected, useRealtimeSession } from "@/hooks/use-realtime";
import { relativeTime } from "@/hooks/use-operational-inbox";

type NavItem = {
  icon: LucideIcon;
  label: string;
  to: string;
  search?: Record<string, string>;
};

const departmentIcons: Record<string, LucideIcon> = {
  support: Wrench,
  billing: Wallet,
  sales: ShoppingBag,
};

const moduleIcons: Record<string, LucideIcon> = {
  "/bandeja": Inbox,
  "/chat-interno": MessagesSquare,
  "/escalaciones": ArrowRightLeft,
  "/asignaciones": Users,
  "/usuarios": Users,
  "/flujos": GitBranch,
  "/campanas": Megaphone,
  "/auditoria": ShieldCheck,
};

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
  const directory = useDirectoryUsers();
  const { data: departments = [] } = useDepartmentsQuery();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useRealtimeSession(session?.id ?? null);
  const connected = useRealtimeConnected();
  const { notifications, unreadCount, markAllRead } = useNotifications();

  const roleNav = useMemo<NavItem[]>(() => {
    if (!session) return [];
    return departments
      .filter((d) => d.active && canAccessDepartment(session, d))
      .map((d) => ({
        icon: departmentIcons[d.slug] ?? Wrench,
        label: d.name,
        to: "/bandeja",
        search: { departmentId: d.id },
      }));
  }, [session, departments]);

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
    if (!session && pathname !== "/login") {
      void navigate({ to: "/login", replace: true });
      return;
    }
    if (session && !canAccessPath(session, pathname)) {
      void navigate({ to: session.landing, replace: true });
    }
  }, [session, pathname, navigate]);

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
    <div className="min-h-screen bg-background text-foreground font-sans flex">
      <aside className="w-64 border-r border-border flex flex-col bg-card shrink-0">
        <div className="p-6 border-b border-border">
          <Link to={session.landing} className="block">
            <h1 className="font-extrabold tracking-tighter text-xl uppercase">
              NetOps <span className="text-primary">AI</span>
            </h1>
            <p className="text-[10px] text-muted-foreground mt-1 tracking-wide">
              {session.departmentName ?? "Todos los departamentos"}
            </p>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {roleNav.length > 0 && (
            <>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2">
                Departamentos
              </div>
              {roleNav.map((r) => (
                <NavLink key={`${r.to}-${r.search?.departmentId}`} item={r} pathname={pathname} />
              ))}
            </>
          )}

          <div className="pt-8 text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2">
            Módulos
          </div>
          {moduleNav.map((m) => (
            <NavLink key={m.to} item={m} pathname={pathname} />
          ))}
        </nav>

        <div className="p-3 border-t border-border relative">
          {menuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-20">
              <div className="p-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border">
                Cambiar de perfil
              </div>
              {directory
                .filter((u) => u.active && u.id !== session.id)
                .map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      signIn(u.id);
                      setMenuOpen(false);
                      void navigate({ to: u.landing, replace: true });
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-foreground/5 text-left"
                  >
                    <div className="size-7 rounded-full bg-primary/15 text-primary grid place-items-center text-[10px] font-bold">
                      {u.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.roleLabel}</p>
                    </div>
                  </button>
                ))}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                  void navigate({ to: "/login", replace: true });
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-danger/10 text-danger border-t border-border text-xs font-bold"
              >
                <LogOut className="size-3.5" />
                Cerrar sesión
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="w-full flex items-center gap-3 p-1.5 rounded-md hover:bg-foreground/5 transition-colors"
          >
            <div className="size-9 rounded-full bg-primary/15 text-primary grid place-items-center text-xs font-bold">
              {session.initials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold truncate">{session.name}</p>
              <div className="flex items-center gap-1.5">
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

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Icon className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-bold tracking-tight">{title}</h2>
            <div className="relative flex-1 ml-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar conversación o teléfono..."
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  if (!notifOpen) markAllRead();
                }}
                className="relative p-2 rounded-md hover:bg-foreground/5"
                aria-label="Notificaciones"
              >
                <Bell className="size-4 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-danger text-danger-foreground text-[9px] font-bold grid place-items-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-30">
                  <div className="p-3 border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                    Notificaciones
                    {connected ? (
                      <span className="text-primary normal-case font-normal">En vivo</span>
                    ) : (
                      <span className="text-warning normal-case font-normal">Reconectando…</span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-border">
                    {notifications.length === 0 && (
                      <p className="p-4 text-xs text-muted-foreground">Sin novedades por ahora.</p>
                    )}
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          void navigate({ to: "/bandeja" });
                        }}
                        className="w-full text-left p-3 hover:bg-foreground/5 text-xs"
                      >
                        <p className="font-bold">
                          {n.kind === "CASE_ESCALATED"
                            ? "Caso escalado a humano"
                            : n.isMine
                              ? "Se te asignó un caso"
                              : "Caso asignado a otro agente"}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Caso {n.caseId.slice(0, 8)}… · {relativeTime(n.createdAt)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded ring-1 ring-primary/20">
              {session.roleLabel}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">{children}</div>
      </main>
    </div>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = pathname === item.to;
  return (
    <Link
      to={item.to}
      search={item.search}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      }`}
    >
      <item.icon className="size-4 shrink-0" />
      {item.label}
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
