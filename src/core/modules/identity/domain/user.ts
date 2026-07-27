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

export function userBelongsToDepartment(user: User, departmentId: DepartmentId): boolean {
  return user.memberships.some((m) => m.departmentId === departmentId);
}

export function userCanTransfer(user: User): boolean {
  return user.memberships.some((m) => m.role === "lead" || m.role === "admin");
}
