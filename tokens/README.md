# Basalt Design Tokens

Design tokens for the Basalt design system — stored in Git, readable by AI.

**Format:** [W3C DTCG 2025.10](https://design-tokens.github.io/community-group/format/)  
**Served via:** [Basalt MCP server](https://basalt.run) → Cursor, Claude Code, Windsurf

---

## File Structure

```
tokens/
  primitives.json       Raw values. Never consumed directly by components.
  semantic.light.json   Semantic aliases — light mode. Requires primitives.
  semantic.dark.json    Semantic aliases — dark mode. Requires primitives.
```

### Resolution order

```
component code
    ↓ consumes
semantic.{mode}.json   e.g. {color.bg.page}
    ↓ resolves via alias to
primitives.json        e.g. {color.stone.50} → #FAFAF9
```

Components always reference semantic tokens. Primitives are never used directly in UI.

---

## Token Categories

| Category | File | Description |
|---|---|---|
| Color primitives | `primitives.json` | Stone scale (11 steps), Ember scale (9 steps), feedback colors |
| Spacing | `primitives.json` | 4px grid, 12 steps |
| Typography | `primitives.json` | Font family, size, weight, line height, letter spacing |
| Radius | `primitives.json` | 9-step border radius scale |
| Shadow | `primitives.json` | 6-step elevation scale (light mode) |
| Duration | `primitives.json` | Animation timing |
| Easing | `primitives.json` | Cubic bezier curves |
| Semantic color | `semantic.{mode}.json` | bg, text, border, accent, feedback, token UI |
| Semantic shadow | `semantic.{mode}.json` | Component-level elevation (with dark mode override) |
| Semantic typography | `semantic.{mode}.json` | Named type roles: body, label, heading1–3, code |
| Semantic spacing | `semantic.{mode}.json` | Component padding and layout gap aliases |
| Semantic radius | `semantic.{mode}.json` | Per-component border radius |

---

## Alias Syntax

All aliases use `{dot.notation}` per DTCG spec:

```json
"color.bg.page.light": { "$value": "{color.stone.50}" }
"shadow.focus":         { "$value": { "color": "{color.ember.500}" } }
"typography.body":      { "$value": { "fontFamily": "{typography.fontFamily.sans}" } }
```

---

## Design Philosophy

**Warm but technical.** Basalt uses a warm gray (stone) rather than a cold neutral — it references volcanic rock, not silicon. The ember accent is the only chromatic color in the system. Everything else is grayscale.

**Dark-first.** Dark mode is the primary experience. The app chrome defaults to `color.stone.950`. Light mode is fully supported but secondary.

**No shadows in dark mode.** Dark mode communicates elevation through surface color, not drop shadows. `shadow.*` tokens in `semantic.dark.json` return transparent — use `color.border.*` tokens and elevated background colors instead.

**Primitives stay primitive.** The `stone.*` and `ember.*` scales are never used directly in component code. Everything goes through semantic aliases so theming is a file swap, not a find-replace.
