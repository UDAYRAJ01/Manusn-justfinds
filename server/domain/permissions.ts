export type JustFindsRole = "user" | "business_owner" | "admin" | "super_admin";

export function canModerate(role: JustFindsRole) {
  return role === "admin" || role === "super_admin";
}

export function canManageBusiness(role: JustFindsRole, userId: number, ownerId: number | null) {
  return canModerate(role) || (role === "business_owner" && ownerId === userId);
}

export function canManageAdmins(role: JustFindsRole) {
  return role === "super_admin";
}
