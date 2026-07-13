---
name: Tailwind v4 theme color var indirection breaks section-scoped recoloring
description: Why chaining a @theme color token to another custom property (for dark/light section overrides) silently fails to inherit, and the fix.
---

Tailwind v4 registers each `@theme --color-*` token via `@property` with
`inherits: false` (the CSS spec default when `inherits` is omitted). If a
`@theme` color is defined as an indirection, e.g. `--color-body: var(--text-body)`,
then a scoped override of `--text-body` on an ancestor (e.g. a `.section-dark`
class meant to recolor a whole section) does NOT cascade down to descendants
using the Tailwind-generated `.text-body` utility — the property resolves to
its non-inherited initial value instead, producing very-low-contrast/invisible
text with no console error.

**Why:** Direct single-level `color: var(--text-body)` (e.g. on a plain `h1`
selector) inherits normally and works fine — only the double-indirection
through a `@theme`-registered color token breaks. This is easy to miss because
tsc/build/lint all pass; it only shows up visually.

**How to apply:** For any pattern that needs a CSS custom property to be
dynamically re-scoped per ancestor (dark section, per-theme override, etc.),
do NOT route it through a Tailwind `@theme` color token. Instead hand-write a
plain CSS class with a direct `var()` reference (`.text-body { color: var(--text-body); }`)
outside of `@theme`, placed after Tailwind's utilities in source order so it
wins the cascade.
