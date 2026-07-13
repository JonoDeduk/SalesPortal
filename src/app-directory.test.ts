import { describe, it, expect } from "vitest";
import { getAppEntries } from "./app-directory.js";
import { appsForRole } from "./access-policy.js";
import type { AppId } from "./access-policy.js";

describe("getAppEntries", () => {
  it("returns entries for known app ids, excluding portal", () => {
    const entries = getAppEntries(["portal", "admin", "crm"]);
    expect(entries.map((e) => e.id)).toEqual(["admin", "crm"]);
  });

  it("returns empty array when given only portal", () => {
    expect(getAppEntries(["portal"])).toEqual([]);
  });

  it("preserves order of input ids", () => {
    const entries = getAppEntries(["crm", "reports", "admin"]);
    expect(entries.map((e) => e.id)).toEqual(["crm", "reports", "admin"]);
  });

  it("each entry has id, name, description, and href", () => {
    const entries = getAppEntries(["admin"]);
    expect(entries[0]).toEqual({
      id: "admin",
      name: "Admin",
      description: expect.any(String),
      href: expect.stringContaining("/"),
    });
  });
});

describe("launchpad tile filtering by role", () => {
  it("admin sees all downstream apps", () => {
    const tiles = getAppEntries(appsForRole("admin"));
    expect(tiles.map((t) => t.id)).toEqual(["admin", "reports", "crm"]);
  });

  it("manager sees reports and crm", () => {
    const tiles = getAppEntries(appsForRole("manager"));
    expect(tiles.map((t) => t.id)).toEqual(["reports", "crm"]);
  });

  it("sales_rep sees only crm", () => {
    const tiles = getAppEntries(appsForRole("sales_rep"));
    expect(tiles.map((t) => t.id)).toEqual(["crm"]);
  });
});
