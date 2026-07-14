# React Component Standard

Next.js 16 App Router + React 19.

## Server vs client components

Server Components (the Next.js default) are preferred. Add `"use client"` only when the component needs interactivity — event handlers, hooks, browser APIs. Keep auth and role decisions on the server; pass already-resolved data (the `AuthUser`, the filtered list from `appsForRole`) down to any client component.

## File location

Reusable components live in `src/components/`. The filename matches the primary exported component (e.g. `TeamMemberList.tsx` exports `TeamMemberList`). Private sub-components used only within that file may be co-located in the same file. Don't nest component folders deeper than `src/components/`.

Route files (`page.tsx`, `layout.tsx`) live under `src/app/` and are not "components" in this sense — keep business logic out of them (see [`routes-and-auth.md`](routes-and-auth.md)).

## Exports

Named exports only — no default exports. **Exception:** Next.js `page.tsx` / `layout.tsx` files require a default export by convention.

```tsx
// Good (component in src/components/)
export function TeamMemberList(props: TeamMemberListProps) { ... }

// Required (route file in src/app/)
export default function Page() { ... }
```

## Declaration style

Use `function` declarations, not arrow functions assigned to `const`.

```tsx
// Good
export function TeamMemberList(props: TeamMemberListProps) { ... }
// Bad
export const TeamMemberList = (props: TeamMemberListProps) => { ... };
```

## Props interfaces

Props interfaces are named `XxxProps` and defined in the same file as the component.

```tsx
interface TeamMemberListProps {
  members: TeamMember[];
}

export function TeamMemberList(props: TeamMemberListProps) { ... }
```

## Conditional rendering

Use a `shouldRender` prop instead of `&&` short-circuit rendering; the component guards at the top of its body.

```tsx
// Good
<TeamMemberList shouldRender={members.length > 0} members={members} />;

export function TeamMemberList({ shouldRender, members }: TeamMemberListProps) {
  if (!shouldRender) return null;
  // ...
}

// Bad
{members.length > 0 && <TeamMemberList members={members} />}
```

Ternaries are banned everywhere — see [`typescript.md`](typescript.md) §6. For a conditional `className` or text value, compute a named variable with default-then-override above the `return`.

```tsx
// Good — early return for JSX
if (isLoading) return <Spinner />;
return <Content />;

// Good — default-then-override for text
let label = "Active";
if (member.locked) label = "Locked";
return <span>{label}</span>;
```

## Guard clauses

Prefer early returns over `if/else` nesting everywhere.

```tsx
if (!user) return null;
if (!canAccess(user.role, appId)) return <Forbidden />;
return <AppShell user={user} />;
```

## State ownership

Server-side data flows through Server Components and server actions — see [`routes-and-auth.md`](routes-and-auth.md). Local, component-only state (a form field, a toggle) may use `useState`. This milestone has no shared client-state store; if one becomes necessary, agree on a single approach before adding a dependency.

## Styling

Follow [`styling.md`](styling.md) — no inline styles.
