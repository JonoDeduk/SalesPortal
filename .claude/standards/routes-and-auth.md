# Routes & Auth Standard

Next.js App Router + Clerk. No database this milestone — Clerk is the source of truth for identity and roles (`publicMetadata.role`).

## Pages call into modules — no business logic in routes

Routes live under `src/app/` (`page.tsx`, `layout.tsx`, `[param]` dynamic segments). Pages are Server Components: do auth and data-loading at the top, then render. Don't put business logic in a page — call into the pure/adapter modules (`@/auth`, `@/user-admin`, `@/access-policy`, `@/role-gate`).

## Clerk lives behind the boundary modules

All Clerk access is isolated in two adapters: `auth.ts` (session/identity) and `user-admin.ts` (Backend API / user management). **Never** call `auth()`, `currentUser()`, or `clerkClient()` directly from a page, component, or other module — go through the adapter.

In pages, use:

- `getCurrentUser()` — returns `AuthUser | null`; treat `null` as signed-out.
- `requireRole(...allowed)` — returns the `AuthUser`, or redirects to sign-in / throws `AuthorizationError`.

Roles are defined once in `access-policy.ts` (`roles`, `accessPolicy`). Don't hard-code role string lists elsewhere — import `Role`, `canAccess`, `appsForRole`.

## Route protection is defence in depth

`src/proxy.ts` (Clerk middleware) protects every route except `/sign-in(.*)` and role-gates `/apps/*` via session claims + `canAccess`. Page components must **still** enforce their own role check server-side — don't rely on the middleware alone.

## No stray logging

No `console.log` in committed code (there's currently one in `auth.ts` to remove). Use it only while debugging locally.

## Forms / server actions

When a server action handles multiple submissions on one page, discriminate on an `intent` field with a Zod discriminated union, and validate `FormData` / params / JSON bodies with Zod rather than parsing inline.

```ts
const schema = z.discriminatedUnion("intent", [
  z.object({ intent: z.literal("lock-user"), userId: z.string() }),
  z.object({ intent: z.literal("set-role"), userId: z.string(), role: z.enum(roles) }),
]);
```
