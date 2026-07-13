# CSS Standard

## Single global stylesheet

All styles live in `src/styles.css`. Do not create per-component CSS files or CSS
modules. The global stylesheet is imported once in `src/app/layout.tsx`.

## No inline styles

Inline `style={{}}` props are **never** acceptable.

Static values — colours, spacing, layout, typography — must be defined as named
classes in `styles.css`. A value is still static when it appears inside a conditional
that picks between two hard-coded strings; use conditional class names (see below)
instead of an inline style.

## Design tokens: two tiers

Define all design values as CSS custom properties in `:root`, in two tiers so they
can be changed in one place:

1. **Palette** — raw values, named literally (`--blue-600`, not `--brand`).
2. **Semantic tokens** — reference the palette via `var(...)` and describe *usage*,
   not appearance (`--color-text-main`, `--font-primary`).

Classes only ever consume **semantic tokens**. They must never reference the raw
palette directly.

### Naming

Semantic tokens use a category prefix so they stay grouped and predictable as they
grow: `--color-*`, `--font-*`, `--space-*`, `--radius-*`.

```css
:root {
  /* Palette */
  --gray-900: #111827;
  --gray-600: #4b5563;

  /* Semantic — colours */
  --color-text-main: var(--gray-900);
  --color-text-muted: var(--gray-600);

  /* Semantic — typography */
  --font-primary: system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, sans-serif;
}

/* good */
.page-title {
  color: var(--color-text-main);
  font-family: var(--font-primary);
}

/* bad — raw palette + hard-coded font in the class */
.page-title {
  color: var(--gray-900);
  font-family: system-ui, -apple-system, sans-serif;
}
```

## Conditional class names

Use template literals for state-driven styling, with the conditional class computed
by default-then-override above the `return` — no ternaries (see
[`typescript.md`](typescript.md) §6). Do **not** add a runtime dependency
(`classnames`, `clsx`, `cn()`) for this.

```tsx
let stateClass = 'class-b';
if (condition) stateClass = 'class-a';
return <div className={`base-class ${stateClass}`} />;
```
