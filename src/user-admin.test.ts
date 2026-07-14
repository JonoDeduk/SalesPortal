import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUserList, mockCreateInvitation, mockGetInvitationList, mockRevokeInvitation, mockGetUser, mockLockUser } = vi.hoisted(() => ({
  mockGetUserList: vi.fn(),
  mockCreateInvitation: vi.fn(),
  mockGetInvitationList: vi.fn(),
  mockRevokeInvitation: vi.fn(),
  mockGetUser: vi.fn(),
  mockLockUser: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: () =>
    Promise.resolve({
      users: { getUserList: mockGetUserList, getUser: mockGetUser, lockUser: mockLockUser },
      invitations: {
        createInvitation: mockCreateInvitation,
        getInvitationList: mockGetInvitationList,
        revokeInvitation: mockRevokeInvitation,
      },
    }),
}));

import { listUsers, inviteUser, listPendingInvitations, revokeInvitation, getUser, deactivateUser } from "./user-admin.js";

beforeEach(() => {
  mockGetUserList.mockReset();
  mockCreateInvitation.mockReset();
  mockGetInvitationList.mockReset();
  mockRevokeInvitation.mockReset();
  mockGetUser.mockReset();
  mockLockUser.mockReset();
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

describe("inviteUser", () => {
  it("calls Clerk createInvitation with role in publicMetadata", async () => {
    mockCreateInvitation.mockResolvedValue({});

    await inviteUser("new@co.com", "manager");

    expect(mockCreateInvitation).toHaveBeenCalledWith({
      emailAddress: "new@co.com",
      redirectUrl: "/sign-up",
      publicMetadata: { role: "manager" },
    });
  });

  it("attaches sales_rep role to invitation", async () => {
    mockCreateInvitation.mockResolvedValue({});

    await inviteUser("rep@co.com", "sales_rep");

    expect(mockCreateInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        publicMetadata: { role: "sales_rep" },
      }),
    );
  });

  it("derives redirect_url from NEXT_PUBLIC_APP_URL", async () => {
    const original = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://portal.example.com";
    mockCreateInvitation.mockResolvedValue({});

    await inviteUser("test@co.com", "manager");

    expect(mockCreateInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectUrl: "https://portal.example.com/sign-up",
      }),
    );
    process.env.NEXT_PUBLIC_APP_URL = original;
  });

  it("propagates Clerk errors", async () => {
    mockCreateInvitation.mockRejectedValue(
      Object.assign(new Error("duplicate"), {
        status: 422,
        errors: [{ code: "duplicate_record" }],
      }),
    );

    await expect(inviteUser("dup@co.com", "manager")).rejects.toThrow(
      "duplicate",
    );
  });
});

function clerkInvitation(overrides: {
  id: string;
  email: string;
  role?: string;
  createdAt?: number;
}) {
  return {
    id: overrides.id,
    emailAddress: overrides.email,
    publicMetadata: overrides.role ? { role: overrides.role } : {},
    createdAt: overrides.createdAt ?? 1720000000000,
  };
}

describe("listPendingInvitations", () => {
  it("maps Clerk invitations to PendingInvitation shape", async () => {
    mockGetInvitationList.mockResolvedValue({
      data: [
        clerkInvitation({ id: "inv_1", email: "mgr@co.com", role: "manager", createdAt: 1720000000000 }),
        clerkInvitation({ id: "inv_2", email: "rep@co.com", role: "sales_rep", createdAt: 1720086400000 }),
      ],
    });

    const result = await listPendingInvitations();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: "inv_1", email: "mgr@co.com", role: "manager" });
    expect(result[1]).toMatchObject({ id: "inv_2", email: "rep@co.com", role: "sales_rep" });
  });

  it("passes status filter for pending invitations", async () => {
    mockGetInvitationList.mockResolvedValue({ data: [] });

    await listPendingInvitations();

    expect(mockGetInvitationList).toHaveBeenCalledWith({ status: "pending" });
  });

  it("returns null role when invitation has no role metadata", async () => {
    mockGetInvitationList.mockResolvedValue({
      data: [clerkInvitation({ id: "inv_1", email: "no-role@co.com" })],
    });

    const [inv] = await listPendingInvitations();
    expect(inv.role).toBeNull();
  });

  it("returns null role for unrecognized role strings", async () => {
    mockGetInvitationList.mockResolvedValue({
      data: [clerkInvitation({ id: "inv_1", email: "bad@co.com", role: "superuser" })],
    });

    const [inv] = await listPendingInvitations();
    expect(inv.role).toBeNull();
  });

  it("returns empty array when no pending invitations exist", async () => {
    mockGetInvitationList.mockResolvedValue({ data: [] });

    const result = await listPendingInvitations();
    expect(result).toEqual([]);
  });

  it("formats sentAt as a locale date string", async () => {
    mockGetInvitationList.mockResolvedValue({
      data: [clerkInvitation({ id: "inv_1", email: "a@co.com", role: "manager", createdAt: 1720000000000 })],
    });

    const [inv] = await listPendingInvitations();
    expect(typeof inv.sentAt).toBe("string");
    expect(inv.sentAt.length).toBeGreaterThan(0);
  });
});

describe("revokeInvitation", () => {
  it("calls Clerk revokeInvitation with the invitation ID", async () => {
    mockRevokeInvitation.mockResolvedValue({});

    await revokeInvitation("inv_123");

    expect(mockRevokeInvitation).toHaveBeenCalledWith("inv_123");
  });

  it("propagates Clerk errors", async () => {
    mockRevokeInvitation.mockRejectedValue(new Error("not found"));

    await expect(revokeInvitation("inv_bad")).rejects.toThrow("not found");
  });
});

describe("getUser", () => {
  it("maps Clerk user to TeamMember shape", async () => {
    mockGetUser.mockResolvedValue(
      clerkUser({ id: "u_1", email: "mgr@co.com", role: "manager" }),
    );

    const result = await getUser("u_1");

    expect(result).toEqual({
      id: "u_1",
      email: "mgr@co.com",
      role: "manager",
      status: "Active",
    });
    expect(mockGetUser).toHaveBeenCalledWith("u_1");
  });

  it("reflects locked status", async () => {
    mockGetUser.mockResolvedValue(
      clerkUser({ id: "u_1", email: "locked@co.com", role: "sales_rep", locked: true }),
    );

    const result = await getUser("u_1");
    expect(result.status).toBe("Locked");
  });

  it("returns null role for unrecognized role strings", async () => {
    mockGetUser.mockResolvedValue(
      clerkUser({ id: "u_1", email: "bad@co.com", role: "superuser" }),
    );

    const result = await getUser("u_1");
    expect(result.role).toBeNull();
  });

  it("propagates Clerk errors", async () => {
    mockGetUser.mockRejectedValue(new Error("not found"));

    await expect(getUser("u_bad")).rejects.toThrow("not found");
  });
});

describe("deactivateUser", () => {
  it("calls Clerk lockUser with the user ID", async () => {
    mockLockUser.mockResolvedValue({});

    await deactivateUser("u_123");

    expect(mockLockUser).toHaveBeenCalledWith("u_123");
  });

  it("propagates Clerk errors", async () => {
    mockLockUser.mockRejectedValue(new Error("lock failed"));

    await expect(deactivateUser("u_bad")).rejects.toThrow("lock failed");
  });
});
