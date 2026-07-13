import { describe, it, expect } from "vitest";
import {
  canAccess,
  appsForRole,
  roles,
  allAppIds,
  accessPolicy,
  type Role,
  type AppId,
} from "./access-policy.js";

const expected: Record<AppId, Record<Role, boolean>> = {
  portal: { admin: true, manager: true, sales_rep: true },
  admin: { admin: true, manager: false, sales_rep: false },
  reports: { admin: true, manager: true, sales_rep: false },
  crm: { admin: true, manager: true, sales_rep: true },
};

describe("canAccess", () => {
  for (const app of allAppIds) {
    for (const role of roles) {
      const allowed = expected[app][role];
      it(`${role} ${allowed ? "can" : "cannot"} access ${app}`, () => {
        expect(canAccess(role, app)).toBe(allowed);
      });
    }
  }
});

describe("appsForRole", () => {
  it("admin sees all apps", () => {
    expect(appsForRole("admin").sort()).toEqual([...allAppIds].sort());
  });

  it("manager sees portal, reports, crm", () => {
    expect(appsForRole("manager").sort()).toEqual(["crm", "portal", "reports"]);
  });

  it("sales_rep sees portal, crm", () => {
    expect(appsForRole("sales_rep").sort()).toEqual(["crm", "portal"]);
  });
});

describe("config integrity", () => {
  it("has exactly 3 roles", () => {
    expect(roles).toHaveLength(3);
  });

  it("has exactly 4 apps", () => {
    expect(allAppIds).toHaveLength(4);
  });

  it("every app lists at least one role", () => {
    for (const app of allAppIds) {
      expect(accessPolicy[app].length).toBeGreaterThan(0);
    }
  });
});
