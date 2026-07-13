import type { AppId } from "./access-policy.js";

export type AppEntry = {
  id: AppId;
  name: string;
  description: string;
  href: string;
};

const directory: Record<Exclude<AppId, "portal">, AppEntry> = {
  admin: {
    id: "admin",
    name: "Admin",
    description: "User management and system settings",
    href: "/apps/admin",
  },
  reports: {
    id: "reports",
    name: "Reports",
    description: "Sales reports and analytics",
    href: "/apps/reports",
  },
  crm: {
    id: "crm",
    name: "CRM",
    description: "Customer relationship management",
    href: "/apps/crm",
  },
};

export function getAppEntries(appIds: AppId[]): AppEntry[] {
  return appIds
    .filter((id): id is Exclude<AppId, "portal"> => id !== "portal" && id in directory)
    .map((id) => directory[id]);
}
