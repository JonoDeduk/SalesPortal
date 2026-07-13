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
- `src/proxy.ts` — Next.js proxy (middleware) enforcing auth on all routes except sign-in
- `src/access-policy.ts` — Pure module: role→app access mapping, no I/O, no framework deps
- `src/access-policy.test.ts` — Exhaustive unit tests for access policy
- `.env.local` — Clerk keys (not committed)
