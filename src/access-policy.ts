export const roles = ["admin", "manager", "sales_rep"] as const;
export type Role = (typeof roles)[number];

export const accessPolicy = {
  portal: ["admin", "manager", "sales_rep"],
  admin: ["admin"],
  reports: ["admin", "manager"],
  crm: ["admin", "manager", "sales_rep"],
} as const satisfies Record<string, readonly Role[]>;

export type AppId = keyof typeof accessPolicy;

export const allAppIds = Object.keys(accessPolicy) as AppId[];

export function canAccess(role: Role, app: AppId): boolean {
  const allowedRoles: readonly Role[] = accessPolicy[app];
  return allowedRoles.includes(role);
}

export function appsForRole(role: Role): AppId[] {
  return allAppIds.filter((app) => canAccess(role, app));
}
