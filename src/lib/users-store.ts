import { SEED_USERS } from "@/lib/auth-seed";
import type { MembershipRole, User } from "@/lib/identity";
import { isGlobalAdmin } from "@/lib/identity";

const KEY = "netops.users.v1";
const listeners = new Set<() => void>();

let cacheEpoch = 0;
let cachedEpoch = -1;
let cachedUsers: User[] | null = null;

function cloneSeed(): User[] {
  return structuredClone(SEED_USERS);
}

function notify() {
  cacheEpoch += 1;
  listeners.forEach((l) => l());
}

function readUsers(): User[] {
  if (typeof window === "undefined") return cloneSeed();
  if (cachedEpoch === cacheEpoch && cachedUsers) return cachedUsers;
  cachedEpoch = cacheEpoch;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      cachedUsers = cloneSeed();
      return cachedUsers;
    }
    const parsed = JSON.parse(raw) as { users?: User[] };
    cachedUsers = Array.isArray(parsed.users) ? parsed.users : cloneSeed();
  } catch {
    cachedUsers = cloneSeed();
  }
  return cachedUsers;
}

function writeUsers(users: User[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify({ users }));
  cachedUsers = users;
  notify();
}

function newId(): string {
  return `u_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export function subscribeUsers(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) {
      cacheEpoch += 1;
      cb();
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function getUsersSnapshot(): User[] {
  return readUsers();
}

export function listUsers(): User[] {
  return readUsers().slice().sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export function listActiveUsers(): User[] {
  return listUsers().filter((u) => u.active);
}

export function getUserById(id: string): User | undefined {
  return readUsers().find((u) => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  const needle = email.trim().toLowerCase();
  return readUsers().find((u) => u.email.toLowerCase() === needle);
}

export type UserWriteInput = {
  name: string;
  email: string;
  primaryDepartmentId: string;
  role: Exclude<MembershipRole, "admin">;
  active: boolean;
};

function assertEmailUnique(email: string, exceptId?: string) {
  const hit = getUserByEmail(email);
  if (hit && hit.id !== exceptId) {
    throw new Error("Ya existe un usuario con ese email");
  }
}

function countGlobalAdmins(users: User[]): number {
  return users.filter((u) => u.active && isGlobalAdmin(u)).length;
}

export function createUser(input: UserWriteInput): User {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) throw new Error("El nombre es obligatorio");
  if (!email.includes("@")) throw new Error("Email inválido");
  assertEmailUnique(email);

  const user: User = {
    id: newId(),
    name,
    initials: initialsFromName(name),
    email,
    primaryDepartmentId: input.primaryDepartmentId,
    memberships: [
      {
        userId: "", // filled below
        departmentId: input.primaryDepartmentId,
        role: input.role,
      },
    ],
    active: input.active,
  };
  user.memberships[0].userId = user.id;

  writeUsers([...readUsers(), user]);
  return user;
}

export function updateUser(id: string, input: UserWriteInput): User {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) throw new Error("Usuario no encontrado");

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) throw new Error("El nombre es obligatorio");
  if (!email.includes("@")) throw new Error("Email inválido");
  assertEmailUnique(email, id);

  const prev = users[idx];
  const next: User = {
    ...prev,
    name,
    initials: initialsFromName(name),
    email,
    primaryDepartmentId: input.primaryDepartmentId,
    active: input.active,
    memberships: isGlobalAdmin(prev)
      ? prev.memberships
      : [
          {
            userId: id,
            departmentId: input.primaryDepartmentId,
            role: input.role,
          },
        ],
  };

  if (!next.active && isGlobalAdmin(prev) && countGlobalAdmins(users) <= 1) {
    throw new Error("No se puede desactivar el único Admin TI");
  }

  const copy = users.slice();
  copy[idx] = next;
  writeUsers(copy);
  return next;
}

export function setUserActive(id: string, active: boolean): User {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) throw new Error("Usuario no encontrado");
  const prev = users[idx];

  if (!active && isGlobalAdmin(prev) && countGlobalAdmins(users) <= 1) {
    throw new Error("No se puede desactivar el único Admin TI");
  }

  const next = { ...prev, active };
  const copy = users.slice();
  copy[idx] = next;
  writeUsers(copy);
  return next;
}
