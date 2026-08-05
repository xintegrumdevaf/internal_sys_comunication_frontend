import { useMemo, useSyncExternalStore } from "react";
import { SEED_DEPARTMENTS } from "@/lib/auth-seed";
import type { User } from "@/lib/identity";
import { isGlobalAdmin } from "@/lib/identity";
import {
  getUserById,
  getUsersSnapshot,
  listActiveUsers,
  listUsers,
  subscribeUsers,
} from "@/lib/users-store";

/**
 * UI session adapter (driving adapter).
 * Maps Core identity users to the shell session shape.
 * Swap localStorage for real auth later without touching domain.
 */

export type SessionUser = {
  id: string;
  name: string;
  initials: string;
  email: string;
  /** Primary department slug for nav landing */
  departmentSlug: string;
  /** All department slugs the user belongs to */
  departmentSlugs: string[];
  /** Platform-wide access (Admin TI) */
  isAdmin: boolean;
  roleLabel: string;
  area: string;
  landing: string;
};

/** Path → department slug required (null = any authenticated user). */
export const PATH_DEPARTMENT: Record<string, string | null> = {
  "/": "ti",
  "/soporte": "soporte",
  "/cartera": "cartera",
  "/utga": "traslados",
  "/campanas": "administracion",
  "/bandeja": null,
  "/whatsapp": null,
  "/chat-interno": null,
  "/usuarios": null, // solo admin vía canAccessPath
  "/flujos": null, // solo admin vía canAccessPath
  "/auditoria": null, // solo admin
  "/login": null,
};

export function toSessionUser(user: User): SessionUser {
  const primary =
    SEED_DEPARTMENTS.find((d) => d.id === user.primaryDepartmentId) ?? SEED_DEPARTMENTS[0];
  const membership = user.memberships.find((m) => m.departmentId === primary.id);
  const roleLabel =
    membership?.role === "admin"
      ? `Admin · ${primary.name}`
      : membership?.role === "lead"
        ? `Líder · ${primary.name}`
        : `Agente · ${primary.name}`;

  const departmentSlugs = user.memberships
    .map((m) => SEED_DEPARTMENTS.find((d) => d.id === m.departmentId)?.slug)
    .filter((s): s is string => Boolean(s));

  return {
    id: user.id,
    name: user.name,
    initials: user.initials,
    email: user.email,
    departmentSlug: primary.slug,
    departmentSlugs,
    isAdmin: isGlobalAdmin(user),
    roleLabel,
    area: primary.name,
    landing: primary.landingPath,
  };
}

/** @deprecated Use SessionUser — kept for gradual UI migration */
export type DemoUser = SessionUser;
/** @deprecated Prefer departmentSlug from session */
export type Role = "admin_ti" | "soporte" | "cartera" | "utga";

/** Snapshot activo de sesión (login rápido). Preferir `listDemoUsers()`. */
export function listDemoUsers(): SessionUser[] {
  return listActiveUsers().map(toSessionUser);
}

/** @deprecated Prefer listDemoUsers() — se mantiene como getter vivo para imports existentes */
export const DEMO_USERS: SessionUser[] = new Proxy([] as SessionUser[], {
  get(_target, prop, receiver) {
    const live = listDemoUsers();
    const value = Reflect.get(live, prop, receiver);
    return typeof value === "function" ? value.bind(live) : value;
  },
});

export const DEPARTMENT_NAV = SEED_DEPARTMENTS.filter((d) => d.active).map((d) => ({
  id: d.id,
  slug: d.slug,
  label: d.name,
  to: d.landingPath,
}));

export function canAccessDepartment(session: SessionUser, slug: string): boolean {
  if (session.isAdmin) return true;
  return session.departmentSlugs.includes(slug);
}

export function canAccessPath(session: SessionUser, pathname: string): boolean {
  if (session.isAdmin) return true;

  if (
    pathname === "/flujos" ||
    pathname === "/auditoria" ||
    pathname === "/usuarios"
  ) {
    return false;
  }

  if (
    pathname === "/bandeja" ||
    pathname === "/whatsapp" ||
    pathname === "/chat-interno" ||
    pathname === "/login"
  ) {
    return true;
  }

  const required = PATH_DEPARTMENT[pathname];
  if (required === undefined) return false;
  if (required === null) return true;
  return canAccessDepartment(session, required);
}

export function departmentsForSession(session: SessionUser) {
  if (session.isAdmin) return DEPARTMENT_NAV;
  return DEPARTMENT_NAV.filter((d) => session.departmentSlugs.includes(d.slug));
}

export function modulesForSession(session: SessionUser): Array<{
  label: string;
  to: string;
  adminOnly?: boolean;
}> {
  const base = [
    { label: "Bandeja Unificada", to: "/bandeja" as const },
    { label: "Chat interno", to: "/chat-interno" as const },
  ];
  if (session.isAdmin) {
    return [
      ...base,
      { label: "Usuarios", to: "/usuarios", adminOnly: true },
      { label: "Flujos n8n", to: "/flujos", adminOnly: true },
      { label: "Campañas Masivas", to: "/campanas" },
      { label: "Auditoría & Logs", to: "/auditoria", adminOnly: true },
    ];
  }
  if (canAccessDepartment(session, "administracion")) {
    return [...base, { label: "Campañas Masivas", to: "/campanas" }];
  }
  return base;
}

/** Supervisor = Admin TI o membership lead/admin. */
export function isSupervisorSession(session: SessionUser | null | undefined): boolean {
  if (!session) return false;
  if (session.isAdmin) return true;
  const user = getUserById(session.id);
  if (!user) return false;
  return user.memberships.some((m) => m.role === "lead" || m.role === "admin");
}

export function useDirectoryUsers(): User[] {
  const users = useSyncExternalStore(subscribeUsers, getUsersSnapshot, () => listUsers());
  return useMemo(
    () => users.slice().sort((a, b) => a.name.localeCompare(b.name, "es")),
    [users],
  );
}

export function useDemoUsers(): SessionUser[] {
  const users = useDirectoryUsers();
  return useMemo(
    () => users.filter((u) => u.active).map(toSessionUser),
    [users],
  );
}

const KEY = "netops.session";
const listeners = new Set<() => void>();

let cacheEpoch = 0;
let cachedEpoch = -1;
let cachedUser: SessionUser | null = null;

function read(): SessionUser | null {
  if (typeof window === "undefined") return null;
  if (cachedEpoch === cacheEpoch) return cachedUser;
  cachedEpoch = cacheEpoch;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      cachedUser = null;
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<SessionUser> & { id: string };
    const fromStore = getUserById(parsed.id);
    if (!fromStore || !fromStore.active) {
      cachedUser = null;
      return null;
    }
    cachedUser = toSessionUser(fromStore);
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

function notify() {
  cacheEpoch += 1;
  listeners.forEach((l) => l());
}

export function signIn(user: SessionUser) {
  window.localStorage.setItem(KEY, JSON.stringify(user));
  notify();
}

export function signOut() {
  window.localStorage.removeItem(KEY);
  notify();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null || e.key === "netops.users.v1") {
      cacheEpoch += 1;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  // Also refresh session when users store mutates in same tab
  const unsubUsers = subscribeUsers(() => {
    cacheEpoch += 1;
    cb();
  });
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
    unsubUsers();
  };
};

export function useSession(): SessionUser | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
