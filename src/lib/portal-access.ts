export const ADMIN_PORTAL_ROLES = new Set([
  "system_admin",
  "support_supervisor",
  "data_privacy_admin",
]);

export function isCustomerRole(role?: string | null): boolean {
  return role === "customer";
}

export function isAgentRole(role?: string | null): boolean {
  return role === "agent";
}

export function isAdminRole(role?: string | null): boolean {
  return !!role && ADMIN_PORTAL_ROLES.has(role);
}

export function getPortalHomeForRole(role?: string | null): string {
  if (isCustomerRole(role)) return "/customer";
  if (isAgentRole(role)) return "/agent";
  if (isAdminRole(role)) return "/admin";
  return "/";
}
