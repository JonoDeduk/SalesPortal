"use server";

import { adminAction, type ActionResult } from "@/admin-action";
import { inviteUser } from "@/user-admin";
import { revalidatePath } from "next/cache";
import { roles } from "@/access-policy";

const assignableRoles = roles.filter((r) => r !== "admin");

export const invite = adminAction(
  async (formData: FormData): Promise<ActionResult> => {
    const email = formData.get("email");
    const role = formData.get("role");

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return { ok: false, error: "Please enter a valid email address." };
    }

    if (
      !role ||
      typeof role !== "string" ||
      !(assignableRoles as readonly string[]).includes(role)
    ) {
      return { ok: false, error: "Please select a role." };
    }

    try {
      await inviteUser(email, role as (typeof assignableRoles)[number]);
      revalidatePath("/apps/admin");
      return { ok: true };
    } catch (err: unknown) {
      if (isClerkDuplicateError(err)) {
        return {
          ok: false,
          error:
            "This email has already been invited or is already registered.",
        };
      }
      throw err;
    }
  },
);

function isClerkDuplicateError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as Record<string, unknown>;
  if (e.status === 422) return true;
  if (Array.isArray(e.errors)) {
    return e.errors.some(
      (error: Record<string, unknown>) => error.code === "duplicate_record",
    );
  }
  return false;
}
