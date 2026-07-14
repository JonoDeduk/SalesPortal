import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRequireRole } = vi.hoisted(() => ({
  mockRequireRole: vi.fn(),
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

import { adminAction } from "./admin-action.js";
import { AuthorizationError } from "./auth.js";

beforeEach(() => {
  mockRequireRole.mockReset();
});

describe("adminAction", () => {
  it("rejects non-admin users", async () => {
    mockRequireRole.mockRejectedValue(
      new AuthorizationError("sales_rep", ["admin"]),
    );

    const action = adminAction(async () => ({ ok: true as const }));

    await expect(action(null, new FormData())).rejects.toThrow(
      AuthorizationError,
    );
  });

  it("passes admin through to the inner function", async () => {
    mockRequireRole.mockResolvedValue({ id: "u_1", role: "admin" });

    const inner = vi.fn().mockResolvedValue({ ok: true as const });
    const action = adminAction(inner);

    const result = await action(null, new FormData());

    expect(mockRequireRole).toHaveBeenCalledWith("admin");
    expect(inner).toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });

  it("forwards FormData to the inner function", async () => {
    mockRequireRole.mockResolvedValue({ id: "u_1", role: "admin" });

    const inner = vi.fn().mockResolvedValue({ ok: true as const });
    const action = adminAction(inner);

    const formData = new FormData();
    formData.set("email", "test@co.com");

    await action(null, formData);

    expect(inner).toHaveBeenCalledWith(formData);
  });

  it("returns error result from inner function", async () => {
    mockRequireRole.mockResolvedValue({ id: "u_1", role: "admin" });

    const action = adminAction(async () => ({
      ok: false as const,
      error: "Something went wrong",
    }));

    const result = await action(null, new FormData());

    expect(result).toEqual({ ok: false, error: "Something went wrong" });
  });

  it("calls requireRole before the inner function", async () => {
    const callOrder: string[] = [];

    mockRequireRole.mockImplementation(async () => {
      callOrder.push("requireRole");
      return { id: "u_1", role: "admin" };
    });

    const action = adminAction(async () => {
      callOrder.push("inner");
      return { ok: true as const };
    });

    await action(null, new FormData());

    expect(callOrder).toEqual(["requireRole", "inner"]);
  });
});
