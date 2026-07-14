import { clerkClient } from "@clerk/nextjs/server";
import type { Role } from "./access-policy.js";

export type TeamMember = {
  id: string;
  email: string;
  role: Role | null;
  status: "Active" | "Locked";
};

export async function inviteUser(email: string, role: Role): Promise<void> {
  const client = await clerkClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  await client.invitations.createInvitation({
    emailAddress: email,
    redirectUrl: `${appUrl}/sign-up`,
    publicMetadata: { role },
  });
}

export async function listUsers(): Promise<TeamMember[]> {
  const client = await clerkClient();
  const { data: users } = await client.users.getUserList();

  return users.map((user) => {
    const email =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "";

    const rawRole = (user.publicMetadata as { role?: string }).role;
    const role = isRole(rawRole) ? rawRole : null;

    return {
      id: user.id,
      email,
      role,
      status: user.locked ? "Locked" : "Active",
    };
  });
}

function isRole(value: unknown): value is Role {
  return value === "admin" || value === "manager" || value === "sales_rep";
}
