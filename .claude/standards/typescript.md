# TypeScript Code Standards

Core principle: **code reads top-to-bottom as a flat sequence of named decisions.**

Applies to all `.ts` and `.tsx` in `src/`.

## 1. Hoist conditionals to named predicates — never inline

Any condition with more than a single term must be lifted into named `const` predicates **above** the `if`, so the `if` reads like English and each term is individually named. Don't inline compound boolean logic (`&&`, `||`, negation of a call) in the `if` itself. Build up the final condition from the smaller named parts.

```tsx
// GOOD — each term named, if reads plainly
const userDoesNotExist = !user;
const userCanAccess = canAccess(user?.role, appId as AppId);
const accessDenied = userDoesNotExist || !userCanAccess;

if (accessDenied) {
  return <AccessDenied />;
}

// BAD — compound condition inline in the if
if (!user || !canAccess(user.role, appId as AppId)) {
  return <AccessDenied />;
}
```

Repeated conditions must be extracted once and reused. A single-term condition (`if (!user)`, `if (accessDenied)`) is already named enough — don't wrap a lone term in another `const`.

Note on types: because the hoisted predicate is evaluated before the guard runs, use optional chaining for values a later term proves present (`user?.role`), or split into sequential guard clauses (§4) when that reads cleaner.

```ts
const isActiveAdmin = user.role === "admin" && user.verifiedAt != null && !user.suspended;
if (isActiveAdmin) { ... }
```

## 2. No `else`, no `else if`

`else` couples branches; flat `if`s stand alone. For multiple cases, name each condition so exclusivity is explicit:

```ts
const isLocked = user.locked;
const isActive = !isLocked;

if (isLocked) return "Locked";
if (isActive) return "Active";
```

For two-way value selection, default-then-override:

```ts
let status = "Active";
if (user.locked) status = "Locked";
```

## 3. No `switch`

Same coupling as `else`, plus fall-through footguns. Map values with a lookup object; dispatch behavior with flat named `if`s or a map of handlers.

```ts
const accessPolicy: Record<AppId, readonly Role[]> = { ... };
return accessPolicy[app].includes(role);
```

## 4. Guard clauses first, then the happy path

Early-return invalid input at the top. Everything below operates on valid data at zero indentation.

```ts
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  // happy path, flat
}
```

## 5. Growing branch → extract a function

If an `if` body exceeds a few lines, move it to a well-named function. The parent stays a flat dispatcher.

## 6. No ternaries

Ternaries hide branching in expressions and get messy when extended. **Never use them** — anywhere, `.ts` or `.tsx`. Use default-then-override or a named `if` instead.

```ts
// ❌
const role = isRole(raw) ? raw : null;

// ✅
let role: Role | null = null;
if (isRole(raw)) role = raw;
```

## 7. No `any`

Don't use `any`. Prefer `unknown` plus a type guard, or `typeof` inference. Clerk's `publicMetadata` is untyped — narrow it through a guard:

```ts
const raw = (user.publicMetadata as { role?: string }).role;
let role: Role | null = null;
if (raw && isRole(raw)) role = raw;
```

## 8. Object parameters for same-typed args

When a function has more than one parameter of the same type, use a single object parameter. Positional is fine when the params are distinct types (`checkAppAccess(role: Role, pathname: string)`).

```ts
// ❌
const addUserToPost = (userId: string, postId: string) => {};
// ✅
const addUserToPost = (opts: { userId: string; postId: string }) => {};
```

## 9. Import alias

Use the `@/*` alias for anything inside `/src` (configured in `tsconfig.json`). No relative imports (`./access-policy`, `../auth`) and no `.js` extensions on TS imports.

```ts
// ❌
import { canAccess } from "./access-policy.js";
// ✅
import { canAccess } from "@/access-policy";
```

## 10. No magic strings in comparisons or defaults

Strings that *build* output are fine inline. Strings that are *compared* or used as *defaults* must reference one named source (e.g. the `roles` / `accessPolicy` constants in `access-policy.ts`) so copies can't drift. Comparing against a string-literal union type is compiler-checked and fine.

---

## Quick reference

- Compound conditions → hoisted named `const` predicates above the `if` (never inline)
- Never `else`, `else if`, `switch`, or ternaries (app-wide, incl. `.tsx`)
- Guard clauses + early returns; happy path at zero indentation
- Value mapping → lookup object; two-way selection → default-then-override
- No `any` → `unknown` + type guard
- Same-typed multi-args → object param
- Imports → `@/*` alias, no relative, no `.js`
- Compared/default strings → named constant or map reference
- Branch body > a few lines → extract a function
- Max nesting: one level of `if`
