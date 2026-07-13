import { describe, it, expect, vi, beforeEach } from "vitest";
import { appIdFromPath, checkAppAccess } from "./role-gate.js";

describe("appIdFromPath", () => {
  it("extracts admin from /apps/admin", () => {
    expect(appIdFromPath("/apps/admin")).toBe("admin");
  });

  it("extracts reports from /apps/reports", () => {
    expect(appIdFromPath("/apps/reports")).toBe("reports");
  });

  it("extracts crm from /apps/crm", () => {
    expect(appIdFromPath("/apps/crm")).toBe("crm");
  });

  it("handles nested paths under an app", () => {
    expect(appIdFromPath("/apps/admin/settings")).toBe("admin");
    expect(appIdFromPath("/apps/crm/contacts/123")).toBe("crm");
  });

  it("returns null for non-app paths", () => {
    expect(appIdFromPath("/")).toBeNull();
    expect(appIdFromPath("/sign-in")).toBeNull();
    expect(appIdFromPath("/dashboard")).toBeNull();
  });

  it("returns null for unknown app ids", () => {
    expect(appIdFromPath("/apps/unknown")).toBeNull();
    expect(appIdFromPath("/apps/billing")).toBeNull();
  });

  it("returns portal for /apps/portal (valid AppId)", () => {
    expect(appIdFromPath("/apps/portal")).toBe("portal");
  });
});

describe("checkAppAccess", () => {
  describe("admin role", () => {
    it("can access admin app", () => {
      expect(checkAppAccess("admin", "/apps/admin")).toBe(true);
    });

    it("can access reports app", () => {
      expect(checkAppAccess("admin", "/apps/reports")).toBe(true);
    });

    it("can access crm app", () => {
      expect(checkAppAccess("admin", "/apps/crm")).toBe(true);
    });
  });

  describe("manager role", () => {
    it("cannot access admin app", () => {
      expect(checkAppAccess("manager", "/apps/admin")).toBe(false);
    });

    it("can access reports app", () => {
      expect(checkAppAccess("manager", "/apps/reports")).toBe(true);
    });

    it("can access crm app", () => {
      expect(checkAppAccess("manager", "/apps/crm")).toBe(true);
    });
  });

  describe("sales_rep role", () => {
    it("cannot access admin app", () => {
      expect(checkAppAccess("sales_rep", "/apps/admin")).toBe(false);
    });

    it("cannot access reports app", () => {
      expect(checkAppAccess("sales_rep", "/apps/reports")).toBe(false);
    });

    it("can access crm app", () => {
      expect(checkAppAccess("sales_rep", "/apps/crm")).toBe(true);
    });
  });

  it("allows any role on non-app paths", () => {
    expect(checkAppAccess("sales_rep", "/")).toBe(true);
    expect(checkAppAccess("sales_rep", "/sign-in")).toBe(true);
    expect(checkAppAccess("sales_rep", "/dashboard")).toBe(true);
  });

  it("checks nested app paths against the parent app", () => {
    expect(checkAppAccess("sales_rep", "/apps/admin/users")).toBe(false);
    expect(checkAppAccess("sales_rep", "/apps/crm/contacts")).toBe(true);
  });
});

// Integration: mock Clerk and verify the full auth → role-gate flow
const { mockAuth, mockCurrentUser } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCurrentUser: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

import { getCurrentUser } from "./auth.js";
import { canAccess, type AppId } from "./access-policy.js";

describe("integration: auth adapter + role gate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  async function simulateAppAccess(
    userId: string,
    role: string,
    pathname: string,
  ): Promise<boolean> {
    mockAuth.mockResolvedValue({ userId });
    mockCurrentUser.mockResolvedValue({
      id: userId,
      publicMetadata: { role },
    });

    const user = await getCurrentUser();
    if (!user) return false;

    const appId = appIdFromPath(pathname);
    if (!appId) return true;
    return canAccess(user.role, appId);
  }

  it("admin can access admin app end-to-end", async () => {
    expect(await simulateAppAccess("u1", "admin", "/apps/admin")).toBe(true);
  });

  it("wrong-role user (sales_rep) is rejected from admin app", async () => {
    expect(await simulateAppAccess("u1", "sales_rep", "/apps/admin")).toBe(
      false,
    );
  });

  it("wrong-role user (manager) is rejected from admin app", async () => {
    expect(await simulateAppAccess("u1", "manager", "/apps/admin")).toBe(false);
  });

  it("wrong-role user (sales_rep) is rejected from reports app", async () => {
    expect(await simulateAppAccess("u1", "sales_rep", "/apps/reports")).toBe(
      false,
    );
  });

  it("correct-role user (manager) can access reports app", async () => {
    expect(await simulateAppAccess("u1", "manager", "/apps/reports")).toBe(
      true,
    );
  });

  it("unauthenticated user has no access", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    mockCurrentUser.mockResolvedValue(null);
    const user = await getCurrentUser();
    expect(user).toBeNull();
  });
});
