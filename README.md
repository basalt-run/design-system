# Demo Design System

A minimal design system managed by [Basalt](https://basalt.run).

## Token structure

```
tokens/
├── primitives.json        # Raw values — colors, spacing, typography, radius
├── semantic.light.json    # Light theme aliases → reference primitives
└── semantic.dark.json     # Dark theme aliases → reference primitives
```

## Format

All tokens use [DTCG 2025.10](https://www.designtokens.org/) format — the W3C standard for design tokens.

## Usage

This repo is connected to Basalt's MCP server. AI tools (Cursor, Claude Code, Windsurf) can query these tokens via the MCP endpoint.

The published npm package (`@basalt/design-system`) exposes resolved tokens, CSS variables, and a Tailwind helper — run `npm run build` after changing files under `tokens/`.

## Repository layout (beyond tokens)

| Path | Purpose |
|------|--------|
| `server.js` | Basalt MCP server (stdio) — loads `tokens/*.json` |
| `scripts/build.js` | Merges token JSON → `dist/` (JS, CSS, Tailwind plugin) |
| `app/`, `brand/`, `public/` | Example / marketing site assets |
| `components/` | Legacy React examples (not the token demo) |
| `figma-plugin/` | Plugin distribution |
| `src/` | Supporting source |

Large one-off Figma exports and sync manifests were removed to keep the demo repo easy to scan.

## License

MIT
