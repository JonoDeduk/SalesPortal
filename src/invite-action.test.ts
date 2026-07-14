import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRequireRole, mockInviteUser, mockRevalidatePath } = vi.hoisted(
  () => ({
    mockRequireRole: vi.fn(),
    mockInviteUser: vi.fn(),
    mockRevalidatePath: vi.fn(),
  }),
);

vi.mock("./auth.js", () => ({
  requireRole: mockRequireRole,
}));

vi.mock("./user-admin.js", () => ({
  inviteUser: mockInviteUser,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import { adminAction } from "./admin-action.js";
import { roles } from "./access-policy.js";
import type { ActionResult } from "./admin-action.js";

const assignableRoles = roles.filter((r) => r !== "admin");

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

function createInviteAction() {
  return adminAction(async (formData: FormData): Promise<ActionResult> => {
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
      await mockInviteUser(email, role);
      mockRevalidatePath("/apps/admin");
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
  });
}

beforeEach(() => {
  mockRequireRole.mockReset();
  mockInviteUser.mockReset();
  mockRevalidatePath.mockReset();
  mockRequireRole.mockResolvedValue({ id: "u_1", role: "admin" });
});

describe("invite action", () => {
  it("maps Clerk 422 to human-readable duplicate message", async () => {
    mockInviteUser.mockRejectedValue(
      Object.assign(new Error("duplicate"), {
        status: 422,
        errors: [{ code: "duplicate_record" }],
      }),
    );

    const action = createInviteAction();
    const formData = new FormData();
    formData.set("email", "dup@co.com");
    formData.set("role", "manager");

    const result = await action(null, formData);

    expect(result).toEqual({
      ok: false,
      error: "This email has already been invited or is already registered.",
    });
  });

  it("maps Clerk 422 status-only error to duplicate message", async () => {
    mockInviteUser.mockRejectedValue(
      Object.assign(new Error("conflict"), { status: 422 }),
    );

    const action = createInviteAction();
    const formData = new FormData();
    formData.set("email", "dup@co.com");
    formData.set("role", "manager");

    const result = await action(null, formData);

    expect(result).toEqual({
      ok: false,
      error: "This email has already been invited or is already registered.",
    });
  });

  it("re-throws non-422 errors", async () => {
    mockInviteUser.mockRejectedValue(new Error("network failure"));

    const action = createInviteAction();
    const formData = new FormData();
    formData.set("email", "test@co.com");
    formData.set("role", "manager");

    await expect(action(null, formData)).rejects.toThrow("network failure");
  });

  it("returns validation error for empty email", async () => {
    const action = createInviteAction();
    const formData = new FormData();
    formData.set("role", "manager");

    const result = await action(null, formData);

    expect(result).toEqual({
      ok: false,
      error: "Please enter a valid email address.",
    });
  });

  it("returns validation error for missing role", async () => {
    const action = createInviteAction();
    const formData = new FormData();
    formData.set("email", "test@co.com");

    const result = await action(null, formData);

    expect(result).toEqual({
      ok: false,
      error: "Please select a role.",
    });
  });

  it("rejects admin as an assignable role", async () => {
    const action = createInviteAction();
    const formData = new FormData();
    formData.set("email", "test@co.com");
    formData.set("role", "admin");

    const result = await action(null, formData);

    expect(result).toEqual({
      ok: false,
      error: "Please select a role.",
    });
  });

  it("calls inviteUser and revalidates on success", async () => {
    mockInviteUser.mockResolvedValue(undefined);

    const action = createInviteAction();
    const formData = new FormData();
    formData.set("email", "new@co.com");
    formData.set("role", "sales_rep");

    const result = await action(null, formData);

    expect(result).toEqual({ ok: true });
    expect(mockInviteUser).toHaveBeenCalledWith("new@co.com", "sales_rep");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/apps/admin");
  });
});
