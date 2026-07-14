import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUserList } = vi.hoisted(() => ({
  mockGetUserList: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: () =>
    Promise.resolve({ users: { getUserList: mockGetUserList } }),
}));

import { listUsers } from "./user-admin.js";

beforeEach(() => {
  mockGetUserList.mockReset();
});

function clerkUser(overrides: {
  id: string;
  email: string;
  role?: string;
  locked?: boolean;
}) {
  const emailId = `eid_${overrides.id}`;
  return {
    id: overrides.id,
    primaryEmailAddressId: emailId,
    emailAddresses: [{ id: emailId, emailAddress: overrides.email }],
    publicMetadata: overrides.role ? { role: overrides.role } : {},
    locked: overrides.locked ?? false,
  };
}

describe("listUsers", () => {
  it("maps Clerk users to TeamMember shape", async () => {
    mockGetUserList.mockResolvedValue({
      data: [
        clerkUser({ id: "u_1", email: "admin@co.com", role: "admin" }),
        clerkUser({ id: "u_2", email: "mgr@co.com", role: "manager" }),
        clerkUser({
          id: "u_3",
          email: "rep@co.com",
          role: "sales_rep",
          locked: true,
        }),
      ],
    });

    const result = await listUsers();

    expect(result).toEqual([
      { id: "u_1", email: "admin@co.com", role: "admin", status: "Active" },
      { id: "u_2", email: "mgr@co.com", role: "manager", status: "Active" },
      { id: "u_3", email: "rep@co.com", role: "sales_rep", status: "Locked" },
    ]);
  });

  it("returns null role when publicMetadata has no role", async () => {
    mockGetUserList.mockResolvedValue({
      data: [clerkUser({ id: "u_1", email: "no-role@co.com" })],
    });

    const [member] = await listUsers();
    expect(member.role).toBeNull();
  });

  it("returns null role for unrecognized role strings", async () => {
    mockGetUserList.mockResolvedValue({
      data: [clerkUser({ id: "u_1", email: "bad@co.com", role: "superuser" })],
    });

    const [member] = await listUsers();
    expect(member.role).toBeNull();
  });

  it("uses primary email when available", async () => {
    const primaryId = "eid_primary";
    mockGetUserList.mockResolvedValue({
      data: [
        {
          id: "u_1",
          primaryEmailAddressId: primaryId,
          emailAddresses: [
            { id: "eid_other", emailAddress: "other@co.com" },
            { id: primaryId, emailAddress: "primary@co.com" },
          ],
          publicMetadata: { role: "admin" },
          locked: false,
        },
      ],
    });

    const [member] = await listUsers();
    expect(member.email).toBe("primary@co.com");
  });

  it("falls back to first email when no primary match", async () => {
    mockGetUserList.mockResolvedValue({
      data: [
        {
          id: "u_1",
          primaryEmailAddressId: null,
          emailAddresses: [
            { id: "eid_1", emailAddress: "fallback@co.com" },
          ],
          publicMetadata: { role: "admin" },
          locked: false,
        },
      ],
    });

    const [member] = await listUsers();
    expect(member.email).toBe("fallback@co.com");
  });

  it("returns empty string when user has no email addresses", async () => {
    mockGetUserList.mockResolvedValue({
      data: [
        {
          id: "u_1",
          primaryEmailAddressId: null,
          emailAddresses: [],
          publicMetadata: { role: "admin" },
          locked: false,
        },
      ],
    });

    const [member] = await listUsers();
    expect(member.email).toBe("");
  });

  it("returns empty array when no users exist", async () => {
    mockGetUserList.mockResolvedValue({ data: [] });

    const result = await listUsers();
    expect(result).toEqual([]);
  });

  it("reflects locked status correctly", async () => {
    mockGetUserList.mockResolvedValue({
      data: [
        clerkUser({ id: "u_1", email: "a@co.com", role: "admin", locked: false }),
        clerkUser({ id: "u_2", email: "b@co.com", role: "admin", locked: true }),
      ],
    });

    const result = await listUsers();
    expect(result[0].status).toBe("Active");
    expect(result[1].status).toBe("Locked");
  });
});
