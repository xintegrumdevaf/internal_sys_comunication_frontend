import type { DepartmentId, UserId } from "@/core/shared/domain/ids";

export type MembershipRole = "agent" | "lead" | "admin";

export type Membership = {
  userId: UserId;
  departmentId: DepartmentId;
  role: MembershipRole;
};

export type User = {
  id: UserId;
  name: string;
  initials: string;
  email: string;
  primaryDepartmentId: DepartmentId;
  memberships: Membership[];
  active: boolean;
};

export function isGlobalAdmin(user: User): boolean {
  // Solo Admin TI tiene visión transversal de todos los departamentos
  return user.memberships.some(
    (m) => m.role === "admin" && m.departmentId === ("dept_ti" as DepartmentId),
  );
}

export function userBelongsToDepartment(user: User, departmentId: DepartmentId): boolean {
  if (isGlobalAdmin(user)) return true;
  return user.memberships.some((m) => m.departmentId === departmentId);
}

export function userCanTransfer(user: User): boolean {
  return user.memberships.some((m) => m.role === "lead" || m.role === "admin");
}

export function userDepartmentIds(user: User): DepartmentId[] {
  return user.memberships.map((m) => m.departmentId);
}
