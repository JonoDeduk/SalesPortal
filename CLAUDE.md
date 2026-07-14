# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Sandcastle agent harness

- **Sandcastle** (`.sandcastle/`) runs an agent against this repo. `main.ts` runs it
  in a Docker sandbox over the open GitHub issues; `interactive.ts` runs it locally
  without a sandbox; `test.ts` is a minimal smoke test. The agent's working
  instructions live in `.sandcastle/prompt.md`.
- **Run the agent:** `npm run sandcastle` (see `README.md` for setup).
- **Init:** `npm run init` reads `.sandcastle/.env.example` and writes `.sandcastle/.env`.

## Project State

Internal Sales Portal — a Next.js app behind Clerk authentication serving as a role-based launchpad for internal CRM tools. Currently building the auth spine milestone: login, roles, launchpad, and one protected downstream app proving the pattern.

Stack: Next.js 16 (App Router) + Clerk + Vercel. No database in this milestone.

## Building & Running

```bash
npm install
npm run dev        # Start dev server (requires .env.local with Clerk keys)
npm run build      # Production build
npm run test       # Run vitest tests
npm run typecheck  # Run tsc --noEmit
```

## Architecture

- `src/app/` — Next.js App Router pages and layouts
  - `layout.tsx` — Root layout with ClerkProvider
  - `page.tsx` — Authenticated home page (placeholder launchpad)
  - `sign-in/[[...sign-in]]/page.tsx` — Clerk sign-in page
- `src/proxy.ts` — Next.js proxy (middleware) enforcing auth on all routes except sign-in; also enforces role-gate for `/apps/*` routes via session claims
- `src/access-policy.ts` — Pure module: role→app access mapping, no I/O, no framework deps
- `src/access-policy.test.ts` — Exhaustive unit tests for access policy
- `src/auth.ts` — Auth/Session adapter: isolates Clerk behind `getCurrentUser()` and `requireRole()`. One of two Clerk-server boundary modules (see also `user-admin.ts`).
- `src/auth.test.ts` — Integration-boundary tests for the auth adapter (mocks Clerk at the import boundary)
- `src/user-admin.ts` — Clerk Backend API adapter for user management: `listUsers()`. Second Clerk-server boundary module (alongside `auth.ts`). Pure adapter, no auth or framework deps.
- `src/user-admin.test.ts` — Unit tests for user-admin adapter (mocks Clerk at the import boundary, mirroring `auth.test.ts`)
- `src/role-gate.ts` — Reusable role-gate: maps URL path to AppId and checks role access. Pure module, no Clerk/Next.js deps. Used by middleware and app pages.
- `src/role-gate.test.ts` — Unit + integration tests for role-gate (includes auth adapter integration verifying wrong-role rejection)
- `src/app/apps/[appId]/page.tsx` — Downstream app page with server-side role enforcement; `/apps/admin` renders a real admin panel with Team Members list, other apps render stubs
- `.env.local` — Clerk keys (not committed)
