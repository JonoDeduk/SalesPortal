import { auth, currentUser } from "@clerk/nextjs/server";
import type { Role } from "./access-policy.js";

export type AuthUser = { id: string; role: Role };

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { userId } = await auth();
  console.log({userId});
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  const role = (user.publicMetadata as { role?: string }).role;
  if (!role || !isRole(role)) return null;

  return { id: userId, role };
}

export async function requireRole(
  ...allowed: Role[]
): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }
  if (!allowed.includes(user.role)) {
    throw new AuthorizationError(user.role, allowed);
  }
  return user;
}

export class AuthorizationError extends Error {
  public readonly role: Role;
  public readonly allowed: Role[];

  constructor(role: Role, allowed: Role[]) {
    super(`Role "${role}" is not allowed. Required: ${allowed.join(", ")}`);
    this.name = "AuthorizationError";
    this.role = role;
    this.allowed = allowed;
  }
}

function isRole(value: string): value is Role {
  return value === "admin" || value === "manager" || value === "sales_rep";
}
