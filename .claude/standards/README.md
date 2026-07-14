# Coding standards

This directory holds the coding standards for **this project** — an internal Sales
Portal on Next.js 16 (App Router) + React 19 + Clerk + TypeScript, tested with
Vitest. No database in this milestone. Agents and humans working in the repo should
read the relevant file before writing or reviewing code.

## Files

- [`typescript.md`](typescript.md) — flat control flow (named predicates, no
  `else`/`switch`/ternary), guard clauses, no `any`, object params, the `@/*` import alias.
- [`react-components.md`](react-components.md) — Server vs client components, named
  exports, `function` declarations, `XxxProps`, `shouldRender`, guard clauses.
- [`styling.md`](styling.md) — single `globals.css`, no inline styles, two-tier design
  tokens, conditional class names.
- [`routes-and-auth.md`](routes-and-auth.md) — App Router pages call into modules,
  Clerk isolated behind `auth.ts`/`user-admin.ts`, roles from `access-policy.ts`,
  proxy role-gate as defence in depth.
- [`testing.md`](testing.md) — Vitest, mock the Clerk boundary before importing the
  module under test, adapters/pure modules need tests.

Keep them short and specific — they're read as context by the agent harness.

> The previous `examples/` directory (a React + Zustand + global-CSS reference from
> another project) has been removed now that real standards exist for this stack.
