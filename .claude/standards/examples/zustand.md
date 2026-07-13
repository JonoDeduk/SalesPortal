# Zustand State Standard

Client-side shared state lives in a Zustand store. Server-side data flows through
Next.js Server Components and server actions — Zustand is only for interactive
client state (UI state, optimistic updates, client-side filters).

## File location

Stores live in `src/store/`. Each store is a single file named after its domain
(e.g. `src/store/ui-store.ts`). The store plus its custom hooks and actions
namespace all live in that one file. Split a store across files only if a second,
unrelated domain appears.

## Never export the raw store

The `create(...)` result stays module-private. Export **custom hooks** only, so
components can never accidentally subscribe to the whole store.

```ts
// Bad — raw store escapes the module
export const useUIStore = create<UIState>(...)

// Good — raw store is private, hooks are the public API
const useUIStore = create<UIState>(...)
export const useIsSidebarOpen = () => useUIStore((s) => s.isSidebarOpen)
```

## Atomic selectors

One hook per value. Selectors must return **stable** results — never construct a
new object/array in a selector without shallow comparison, or the component
re-renders on every store change.

```ts
// Good — atomic, stable references
export const useIsSidebarOpen = () => useUIStore((s) => s.isSidebarOpen)

// Bad — new object every render
export const useUIState = () =>
  useUIStore((s) => ({ sidebar: s.isSidebarOpen, modal: s.activeModal }))
```

If a hook genuinely must return multiple values, use `useShallow`:

```ts
import { useShallow } from 'zustand/react/shallow'

export const useUIState = () =>
  useUIStore(useShallow((s) => ({ sidebar: s.isSidebarOpen, modal: s.activeModal })))
```

## Call selector hooks where the value is used — never prop-drill them

A component that needs store state calls the atomic selector hook itself. Do not
read a value in a parent and pass it down as a prop.

## Separate actions into an `actions` namespace

All mutations live under a single `actions` object. Actions never change identity,
so they can be exposed through one hook with no re-render cost.

```ts
export const useUIActions = () => useUIStore((s) => s.actions)
```

## Model actions as events, not setters

Business logic belongs in the store. Components dispatch high-level intent; they
do not read state, compute the next value, and write it back.

## Keep scope small

Prefer several focused stores over one monolith, but only split along genuine
domain boundaries.
