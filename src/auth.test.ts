import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAuth, mockCurrentUser } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCurrentUser: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

import {
  getCurrentUser,
  requireRole,
  AuthorizationError,
} from "./auth.js";

beforeEach(() => {
  vi.resetAllMocks();
});

function signedIn(
  userId: string,
  role: string,
  overrides?: { publicMetadata?: Record<string, unknown> },
) {
  mockAuth.mockResolvedValue({ userId, redirectToSignIn: vi.fn() });
  mockCurrentUser.mockResolvedValue({
    id: userId,
    publicMetadata: overrides?.publicMetadata ?? { role },
  });
}

function signedOut() {
  mockAuth.mockResolvedValue({
    userId: null,
    redirectToSignIn: vi.fn(),
  });
  mockCurrentUser.mockResolvedValue(null);
}

describe("getCurrentUser", () => {
  it("returns id and role for a signed-in user with a valid role", async () => {
    signedIn("user_1", "admin");
    const user = await getCurrentUser();
    expect(user).toEqual({ id: "user_1", role: "admin" });
  });

  it("returns null when not authenticated", async () => {
    signedOut();
    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it("returns null when currentUser returns null", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockCurrentUser.mockResolvedValue(null);
    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it("returns null when publicMetadata has no role", async () => {
    signedIn("user_1", "admin", { publicMetadata: {} });
    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it("returns null when role is not a valid Role type", async () => {
    signedIn("user_1", "admin", { publicMetadata: { role: "superuser" } });
    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  for (const role of ["admin", "manager", "sales_rep"] as const) {
    it(`recognizes role "${role}"`, async () => {
      signedIn("user_1", role);
      const user = await getCurrentUser();
      expect(user).toEqual({ id: "user_1", role });
    });
  }
});

describe("requireRole", () => {
  it("returns user when role is in the allowed list", async () => {
    signedIn("user_1", "manager");
    const user = await requireRole("admin", "manager");
    expect(user).toEqual({ id: "user_1", role: "manager" });
  });

  it("throws AuthorizationError when role is not allowed", async () => {
    signedIn("user_1", "sales_rep");
    await expect(requireRole("admin")).rejects.toThrow(AuthorizationError);
  });

  it("AuthorizationError contains role and allowed list", async () => {
    signedIn("user_1", "sales_rep");
    try {
      await requireRole("admin", "manager");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AuthorizationError);
      const e = err as AuthorizationError;
      expect(e.role).toBe("sales_rep");
      expect(e.allowed).toEqual(["admin", "manager"]);
    }
  });

  it("redirects to sign-in when not authenticated", async () => {
    const redirectFn = vi.fn();
    mockAuth.mockResolvedValue({ userId: null, redirectToSignIn: redirectFn });
    mockCurrentUser.mockResolvedValue(null);
    await requireRole("admin");
    expect(redirectFn).toHaveBeenCalled();
  });
});
