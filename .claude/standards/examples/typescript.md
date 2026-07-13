# TypeScript Code Standards

Core principle: **code reads top-to-bottom as a flat sequence of named decisions.**

## 1. Name conditions before using them

Hoist boolean logic into named `const` predicates so `if`s read like English. Repeated compound conditions must be extracted.

```ts
const isActiveAdmin = user.role === 'admin' && user.verifiedAt != null && !user.suspended
if (isActiveAdmin) { ... }
```

## 2. No `else`, no `else if`

`else` couples branches; flat `if`s stand alone. For multiple cases, name each condition so exclusivity is explicit:

```ts
const isExpressShipping = order.shipping === 'express'
const isInternational = !isExpressShipping && order.country !== homeCountry
const isStandardDomestic = !isExpressShipping && !isInternational

if (isExpressShipping) applyExpressRates(quote, order)
if (isInternational) applyInternationalRates(quote, order)
if (isStandardDomestic) applyDomesticRates(quote, order)
```

For two-way value selection, default-then-override:

```ts
let label = 'items'
if (count === 1) label = 'item'
```

## 3. No `switch`

Same coupling as `else`, plus fall-through footguns. Map values with a lookup object; dispatch behavior with flat named `if`s or a map of handlers.

```ts
const statusColors: Record<Status, string> = { pending: 'yellow', active: 'green', failed: 'red' }
return statusColors[status] ?? statusColors.active
```

## 4. Guard clauses first, then the happy path

Early-return invalid input at the top. Everything below operates on valid data at zero indentation.

```ts
function processOrder(order: Order | null) {
  if (order == null) return
  if (order.items.length === 0) return
  if (order.cancelled) return

  // happy path, flat
}
```

## 5. Growing branch → extract a function

If an `if` body exceeds a few lines, move it to a well-named function. The parent stays a flat dispatcher.

## 6. No ternaries

Ternaries hide branching in expressions and get messy when extended. **Never use
them** — anywhere in the codebase, `.ts` or `.tsx`. Use default-then-override or a
named `if` instead.

## 7. No magic strings in comparisons or defaults

Strings that *build* output are fine inline. Strings that are *compared* or used as *defaults* must reference one named source, so copies can't drift:

```ts
// ❌ fallback duplicates a map value
return statusColors[status] ?? 'green'
// ✅ reference the source
return statusColors[status] ?? statusColors.active

// ❌ raw literal comparison        // ✅ named source
if (env === 'production')           if (env === ENV.production)
```

Exception: comparing against a string literal union type is compiler-checked and fine.

---

## Quick reference

- Compound booleans → named `const` predicates
- Never `else`, `else if`, `switch`, or ternaries (app-wide, incl. `.tsx`)
- Guard clauses + early returns; happy path at zero indentation
- Value mapping → lookup object; two-way selection → default-then-override
- Compared/default strings → named constant or map reference
- Branch body > a few lines → extract a function
- Max nesting: one level of `if`
