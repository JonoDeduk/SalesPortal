# React Component Standard

## File location

Components live in `src/components/`. The filename matches the primary exported
component (e.g. `ClientList.tsx` exports `ClientList`). Private sub-components
used only within that file may be co-located in the same file.

Server Components (the Next.js default) are preferred unless the component needs
interactivity (event handlers, hooks, browser APIs), in which case add `'use client'`
at the top.

## Exports

Named exports only — no default exports. Exception: Next.js page/layout files
require default exports by convention.

```tsx
// Good
export function ClientList(props: ClientListProps) { ... }

// Bad
export default function ClientList(props: ClientListProps) { ... }
```

## Declaration style

Use `function` declarations, not arrow functions assigned to `const`.

```tsx
// Good
export function ClientList(props: ClientListProps) { ... }

// Bad
export const ClientList = (props: ClientListProps) => { ... }
```

## Props interfaces

Props interfaces are named `XxxProps` and defined in the same file as the component.

```tsx
interface ClientListProps {
  clients: Client[];
  onSelect: (id: string) => void;
}

export function ClientList(props: ClientListProps) { ... }
```

## Conditional Rendering

Use `shouldRender` props instead of `&&` short-circuit rendering. The component
guards at the top of its function body.

```tsx
// Good
<ClientList shouldRender={items.length > 0} clients={items} />

export function ClientList({ shouldRender, clients }: ClientListProps) {
  if (!shouldRender) return null;
  // ...
}

// Bad
{items.length > 0 && <ClientList clients={items} />}
```

For conditional renders embedded mid-tree, extract to a sub-component so it can
use a guard clause.

Ternaries are banned everywhere — see [`typescript.md`](typescript.md) §6. For a
conditional `className` or text value, compute a named variable with
default-then-override above the `return`.

```tsx
// Good — default-then-override
let stateClass = '';
if (disabled) stateClass = 'btn-disabled';
return <button className={`btn ${stateClass}`} />;

// Good — default-then-override for text
let label = 'Submit';
if (loading) label = 'Loading...';
return <button>{label}</button>;

// Good — early return for JSX
if (isLoading) return <Spinner />;
return <Content />;
```

## Guard Clauses

Prefer early returns over `if/else` nesting everywhere.

```tsx
// Good
if (!user) return null;
if (!user.isActive) return <InactiveMessage />;
return <Dashboard user={user} />;
```

## State ownership

Shared client-side state lives in a Zustand store — see
[`zustand.md`](zustand.md). Server-side data fetching uses Next.js Server
Components and server actions. Local, component-only state (e.g. a form field
or toggle) may use `useState`.

## Styling

Follow the CSS standard in [`css.md`](css.md).
