# Testing Standard

Vitest. Run with `npm run test`; `npm run typecheck` for `tsc --noEmit`.

## What must have tests

Every boundary adapter and pure logic module has a co-located `.test.ts`:
`auth.ts` → `auth.test.ts`, `user-admin.ts` → `user-admin.test.ts`,
`access-policy.ts` → `access-policy.test.ts`, `role-gate.ts` → `role-gate.test.ts`.
Adding such a module without a test is incomplete.

## Import vitest helpers explicitly

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
```

## Mock the Clerk boundary before importing the module under test

Use `vi.hoisted` for the mock fns, `vi.mock("@clerk/nextjs/server", ...)`, then import the module. The `vi.mock` call must come **before** the import.

```ts
const { mockGetUserList } = vi.hoisted(() => ({
  mockGetUserList: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: () =>
    Promise.resolve({ users: { getUserList: mockGetUserList } }),
}));

import { listUsers } from "@/user-admin";

beforeEach(() => {
  mockGetUserList.mockReset();
});
```

See `user-admin.test.ts` and `auth.test.ts` for reference.

## Result shapes

Assert the adapter's real contract: a nullable return for signed-out / not-found (`getCurrentUser`), or a thrown typed error for authorization failures (`AuthorizationError`). Pure modules (`access-policy`, `role-gate`) get exhaustive case coverage — test every role × app combination.
