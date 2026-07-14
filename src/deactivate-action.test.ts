import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRequireRole, mockGetUser, mockDeactivateUser, mockRevalidatePath } =
  vi.hoisted(() => ({
    mockRequireRole: vi.fn(),
    mockGetUser: vi.fn(),
    mockDeactivateUser: vi.fn(),
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
  getUser: mockGetUser,
  deactivateUser: mockDeactivateUser,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import { adminAction } from "./admin-action.js";
import type { ActionResult } from "./admin-action.js";

function createDeactivateAction() {
  return adminAction(async (formData: FormData): Promise<ActionResult> => {
    const userId = formData.get("userId");

    if (!userId || typeof userId !== "string") {
      return { ok: false, error: "Missing user ID." };
    }

    const target = await mockGetUser(userId);

    if (target.role === "admin") {
      return { ok: false, error: "Cannot deactivate an admin account." };
    }

    try {
      await mockDeactivateUser(userId);
      mockRevalidatePath("/apps/admin");
      return { ok: true };
    } catch {
      return { ok: false, error: "Failed to deactivate user." };
    }
  });
}

beforeEach(() => {
  mockRequireRole.mockReset();
  mockGetUser.mockReset();
  mockDeactivateUser.mockReset();
  mockRevalidatePath.mockReset();
  mockRequireRole.mockResolvedValue({ id: "u_1", role: "admin" });
});

describe("deactivate action", () => {
  it("deactivates a non-admin user and revalidates", async () => {
    mockGetUser.mockResolvedValue({
      id: "u_2",
      email: "mgr@co.com",
      role: "manager",
      status: "Active",
    });
    mockDeactivateUser.mockResolvedValue(undefined);

    const action = createDeactivateAction();
    const formData = new FormData();
    formData.set("userId", "u_2");

    const result = await action(null, formData);

    expect(result).toEqual({ ok: true });
    expect(mockGetUser).toHaveBeenCalledWith("u_2");
    expect(mockDeactivateUser).toHaveBeenCalledWith("u_2");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/apps/admin");
  });

  it("refuses to deactivate an admin-role user", async () => {
    mockGetUser.mockResolvedValue({
      id: "u_admin",
      email: "admin@co.com",
      role: "admin",
      status: "Active",
    });

    const action = createDeactivateAction();
    const formData = new FormData();
    formData.set("userId", "u_admin");

    const result = await action(null, formData);

    expect(result).toEqual({ ok: false, error: "Cannot deactivate an admin account." });
    expect(mockDeactivateUser).not.toHaveBeenCalled();
  });

  it("returns error when userId is missing", async () => {
    const action = createDeactivateAction();
    const result = await action(null, new FormData());

    expect(result).toEqual({ ok: false, error: "Missing user ID." });
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockDeactivateUser).not.toHaveBeenCalled();
  });

  it("returns error when Clerk lock fails", async () => {
    mockGetUser.mockResolvedValue({
      id: "u_2",
      email: "mgr@co.com",
      role: "manager",
      status: "Active",
    });
    mockDeactivateUser.mockRejectedValue(new Error("lock failed"));

    const action = createDeactivateAction();
    const formData = new FormData();
    formData.set("userId", "u_2");

    const result = await action(null, formData);

    expect(result).toEqual({ ok: false, error: "Failed to deactivate user." });
  });

  it("is wrapped in adminAction (admin-only)", async () => {
    const { AuthorizationError } = await import("./auth.js");
    mockRequireRole.mockRejectedValue(
      new AuthorizationError("sales_rep", ["admin"]),
    );

    const action = createDeactivateAction();
    const formData = new FormData();
    formData.set("userId", "u_2");

    await expect(action(null, formData)).rejects.toThrow();
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockDeactivateUser).not.toHaveBeenCalled();
  });
});
