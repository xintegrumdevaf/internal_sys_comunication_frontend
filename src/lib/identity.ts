export type DepartmentId = string;
export type UserId = string;

export type Department = {
  id: DepartmentId;
  slug: string;
  name: string;
  description: string;
  landingPath: string;
  active: boolean;
};

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
  return user.memberships.some(
    (membership) => membership.role === "admin" && membership.departmentId === "dept_ti",
  );
}
