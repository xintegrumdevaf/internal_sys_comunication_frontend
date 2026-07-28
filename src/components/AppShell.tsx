import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Search,
  Wrench,
  Wallet,
  HardHat,
  Server,
  Inbox,
  GitBranch,
  Megaphone,
  Plus,
  ShieldCheck,
  LogOut,
  ChevronDown,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEMO_USERS,
  canAccessPath,
  departmentsForSession,
  modulesForSession,
  signIn,
  signOut,
  useSession,
} from "../lib/auth";

type NavItem = { icon: LucideIcon; label: string; to: string };

const departmentIcons: Record<string, LucideIcon> = {
  ti: Server,
  soporte: Wrench,
  cartera: Wallet,
  administracion: Megaphone,
  traslados: HardHat,
};

const moduleIcons: Record<string, LucideIcon> = {
  "/bandeja": Inbox,
  "/whatsapp": MessageCircle,
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
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const roleNav = useMemo<NavItem[]>(() => {
    if (!session) return [];
    return departmentsForSession(session).map((d) => ({
      icon: departmentIcons[d.slug] ?? Server,
      label: d.label,
      to: d.to,
    }));
  }, [session]);

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
        Sin acceso a esta pantalla… redirigiendo a {session.area}
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
            <p className="text-[10px] text-muted-foreground mt-1 tracking-wide">{session.area}</p>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2">
            Mi área
          </div>
          {roleNav.map((r) => (
            <NavLink key={r.to} item={r} pathname={pathname} />
          ))}

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
                Simular otro perfil
              </div>
              {DEMO_USERS.filter((u) => u.id !== session.id).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    signIn(u);
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
                <div className="size-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] text-muted-foreground truncate">{session.roleLabel}</span>
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
                placeholder="Buscar contrato, MAC o celular..."
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded ring-1 ring-primary/20">
              {session.area}
            </div>
            {session.isAdmin && (
              <>
                <div className="h-8 w-px bg-border" />
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-xs font-bold rounded-md hover:bg-foreground/85 transition-colors"
                >
                  <Plus className="size-3.5" />
                  Nueva Campaña
                </button>
              </>
            )}
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
