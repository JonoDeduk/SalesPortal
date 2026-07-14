import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRequireRole, mockRevokeInvitation, mockRevalidatePath } =
  vi.hoisted(() => ({
    mockRequireRole: vi.fn(),
    mockRevokeInvitation: vi.fn(),
    mockRevalidatePath: vi.fn(),
  }));

vi.mock("./auth.js", () => ({
  requireRole: mockRequireRole,
  AuthorizationError: class AuthorizationError extends Error {
    role: string;
    allowed: string[];
    constructor(role: string, allowed: string[]) {
      super(`Role "${role}" is not allowed. Required: ${allowed.join(", ")}`);
      this.name = "AuthorizationError";
      this.role = role;
      this.allowed = allowed;
    }
  },
}));

vi.mock("./user-admin.js", () => ({
  revokeInvitation: mockRevokeInvitation,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import { adminAction } from "./admin-action.js";
import type { ActionResult } from "./admin-action.js";

function createRevokeAction() {
  return adminAction(async (formData: FormData): Promise<ActionResult> => {
    const invitationId = formData.get("invitationId");

    if (!invitationId || typeof invitationId !== "string") {
      return { ok: false, error: "Missing invitation ID." };
    }

    try {
      await mockRevokeInvitation(invitationId);
      mockRevalidatePath("/apps/admin");
      return { ok: true };
    } catch {
      return { ok: false, error: "Failed to revoke invitation." };
    }
  });
}

beforeEach(() => {
  mockRequireRole.mockReset();
  mockRevokeInvitation.mockReset();
  mockRevalidatePath.mockReset();
  mockRequireRole.mockResolvedValue({ id: "u_1", role: "admin" });
});

describe("revoke action", () => {
  it("calls revokeInvitation and revalidates on success", async () => {
    mockRevokeInvitation.mockResolvedValue(undefined);

    const action = createRevokeAction();
    const formData = new FormData();
    formData.set("invitationId", "inv_123");

    const result = await action(null, formData);

    expect(result).toEqual({ ok: true });
    expect(mockRevokeInvitation).toHaveBeenCalledWith("inv_123");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/apps/admin");
  });

  it("returns error when invitationId is missing", async () => {
    const action = createRevokeAction();
    const result = await action(null, new FormData());

    expect(result).toEqual({ ok: false, error: "Missing invitation ID." });
    expect(mockRevokeInvitation).not.toHaveBeenCalled();
  });

  it("returns error when Clerk revoke fails", async () => {
    mockRevokeInvitation.mockRejectedValue(new Error("not found"));

    const action = createRevokeAction();
    const formData = new FormData();
    formData.set("invitationId", "inv_bad");

    const result = await action(null, formData);

    expect(result).toEqual({ ok: false, error: "Failed to revoke invitation." });
  });

  it("is wrapped in adminAction (admin-only)", async () => {
    const { AuthorizationError } = await import("./auth.js");
    mockRequireRole.mockRejectedValue(
      new AuthorizationError("sales_rep", ["admin"]),
    );

    const action = createRevokeAction();
    const formData = new FormData();
    formData.set("invitationId", "inv_123");

    await expect(action(null, formData)).rejects.toThrow();
    expect(mockRevokeInvitation).not.toHaveBeenCalled();
  });
});
