# Basalt Design System

**Your tokens in Git. Readable by AI. Beautiful to edit.**

Basalt is a code-native design system platform. Tokens live in Git in [DTCG 2025.10](https://design-tokens.github.io/community-group/format/) format, served to AI coding tools via a native MCP server. Cursor, Claude Code, and Windsurf can read your actual design tokens and generate on-brand code automatically.

---

## What's in this repo

```
tokens/
  primitives.json       Raw values — stone scale, ember scale, spacing, type, radius, shadow, motion
  semantic.light.json   Semantic aliases — light mode
  semantic.dark.json    Semantic aliases — dark mode

brand/
  basalt-icon-dark.svg
  basalt-icon-light.svg
  basalt-icon-ember.svg
  basalt-logo-dark.svg

components/
  BasaltIcon.jsx        React icon + lockup component

public/
  favicon.svg

server.js               MCP server — serves tokens to AI coding tools
```

---

## MCP server

Exposes your DTCG tokens to Cursor, Claude Code, and Windsurf via the [Model Context Protocol](https://modelcontextprotocol.io).

**Install:**
```bash
npm install
```

**Run:**
```bash
node server.js --tokens-path ./tokens
```

**Connect to Cursor** — add to your MCP config:
```json
{
  "mcpServers": {
    "basalt": {
      "command": "node",
      "args": ["/path/to/design-system/server.js", "--tokens-path", "/path/to/design-system/tokens"]
    }
  }
}
```

**Available tools:**

| Tool | Description |
|---|---|
| `get_tokens` | List all tokens, filter by category and mode |
| `get_token` | Get a single token by path with full alias resolution |
| `search_tokens` | Search by name, value, or description |
| `resolve_alias` | Trace the full alias chain step by step |

---

## npm Package Export

Basalt can automatically publish your design system as an npm package. Enable it in your project settings — every token change triggers a build and publish automatically.

```bash
npm install @your-org/design-system
```

Includes tokens (TypeScript, JS, CSS), React components, and a Tailwind plugin. Powered by GitHub Actions — no extra tooling required.

---

## Token architecture

Three-tier structure — primitives → semantic → component.

```
component code
    ↓ consumes
semantic.{mode}.json    e.g. color.accent.default
    ↓ resolves to
primitives.json         e.g. color.ember.500 → #F97316
```

**105 primitive tokens** across color, spacing, typography, radius, shadow, duration, and easing.

Components never reference primitive tokens directly. Everything goes through semantic aliases so theming is a file swap.

---

## Token format

[W3C DTCG 2025.10](https://design-tokens.github.io/community-group/format/) — `$type`, `$value`, `$description`, `{dot.notation}` aliases.

```json
{
  "color": {
    "accent": {
      "default": {
        "$type": "color",
        "$value": "{color.ember.500}",
        "$description": "Primary CTA — resolves to #F97316 in light mode"
      }
    }
  }
}
```

---

## Design language

**Stone + Ember.** Two primitives. A warm gray neutral scale (stone, 11 steps) and a volcanic amber accent (ember, 9 steps). Dark mode is the primary experience. Shadows are replaced by border-based elevation on dark surfaces.

---

## Platform

→ [basalt.run](https://basalt.run) *(coming soon)*
