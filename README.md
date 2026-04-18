# Basalt Design System

Design tokens in Git. Readable by AI. Beautiful to edit.

This repo is managed by [Basalt](https://basalt.run) — a design system platform that stores tokens, components, and documentation in Git and serves them to AI coding tools via MCP.

## What's in this repo

```
tokens/
├── primitives.json        # Raw values (colors, spacing, radii)
├── semantic.light.json    # Light theme semantic tokens
└── semantic.dark.json     # Dark theme semantic tokens
```

All tokens use the [DTCG 2025.10](https://tr.designtokens.org/format/) format (W3C standard).

## Using these tokens with AI tools

Basalt serves this design system to Cursor, Claude Code, Claude Design, and Windsurf via an MCP server. AI tools query your real token values instead of guessing.

See **[MCP.md](MCP.md)** for setup instructions and available tools.

**Quick config (Cursor / Claude Code / Windsurf):**

```json
{
  "mcpServers": {
    "basalt": {
      "url": "https://basalt.run/api/mcp",
      "headers": {
        "Authorization": "Bearer bsk_your_key_here"
      }
    }
  }
}
```

Get a free API key at [basalt.run](https://basalt.run).

## Token architecture

Three tiers, each referencing the layer above:

**Primitive** → raw values (`color.orange.500` = `#F97316`)
**Semantic** → intent + theming (`color.action.default` → `color.orange.500`)
**Component** → scoped to UI elements (`button.background.default` → `color.action.default`)

AI tools resolve the full chain automatically via MCP.

## Links

- [basalt.run](https://basalt.run) — visual editor, component registry, MCP server
- [MCP.md](MCP.md) — MCP server docs and setup
- [MCP Registry](https://registry.modelcontextprotocol.io/) — search for `basalt`

## License

MIT — see [LICENSE](LICENSE).
