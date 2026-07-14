# Styling Standard

## Single global stylesheet

All styles live in `src/app/globals.css`. Do not create per-component CSS files or CSS modules. The global stylesheet is imported once in `src/app/layout.tsx`.

> Note: the current pages use inline `style={{}}` and no stylesheet yet — that predates this standard and is non-compliant. New and touched UI must follow the rules below.

## No inline styles

Inline `style={{}}` props are **never** acceptable.

Static values — colours, spacing, layout, typography — must be defined as named classes in `globals.css`. A value is still static when it appears inside a conditional that picks between two hard-coded strings; use conditional class names (below) instead of an inline style.

## Design tokens: two tiers

Define all design values as CSS custom properties in `:root`, in two tiers so they can be changed in one place:

1. **Palette** — raw values, named literally (`--blue-600`, not `--brand`).
2. **Semantic tokens** — reference the palette via `var(...)` and describe *usage*, not appearance (`--color-text-main`, `--font-primary`).

Classes only ever consume **semantic tokens**; never the raw palette directly. Semantic tokens use a category prefix so they stay grouped: `--color-*`, `--font-*`, `--space-*`, `--radius-*`.

```css
:root {
  /* Palette */
  --gray-900: #111827;
  --green-600: #16a34a;
  --red-600: #dc2626;

  /* Semantic */
  --color-text-main: var(--gray-900);
  --color-status-active: var(--green-600);
  --color-status-locked: var(--red-600);
}

/* good */
.page-title { color: var(--color-text-main); }

/* bad — raw palette in the class */
.page-title { color: var(--gray-900); }
```

## Conditional class names

Use template literals for state-driven styling, with the conditional class computed by default-then-override above the `return` — no ternaries (see [`typescript.md`](typescript.md) §6). Do **not** add a runtime dependency (`classnames`, `clsx`, `cn()`) for this.

```tsx
let statusClass = "status-active";
if (member.locked) statusClass = "status-locked";
return <span className={`status ${statusClass}`}>{label}</span>;
```
