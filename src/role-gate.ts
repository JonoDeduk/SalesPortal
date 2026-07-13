import { canAccess, allAppIds, type AppId, type Role } from "./access-policy";

export function appIdFromPath(pathname: string): AppId | null {
  const match = pathname.match(/^\/apps\/([^/]+)/);
  if (!match) return null;
  const candidate = match[1];
  return (allAppIds as readonly string[]).includes(candidate)
    ? (candidate as AppId)
    : null;
}

export function checkAppAccess(role: Role, pathname: string): boolean {
  const appId = appIdFromPath(pathname);
  if (!appId) return true;
  return canAccess(role, appId);
}
