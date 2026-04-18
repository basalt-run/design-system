# Basalt MCP Server

Connect your AI coding tools to your design system. Basalt serves your design tokens, component specs, icons, and accessibility data via MCP so AI tools generate on-brand code — not hardcoded values.

Works with Claude Design, Claude Code, Cursor, Windsurf, and any MCP-compatible client.

## Quick Start

### 1. Get an API key

Sign up at [basalt.run](https://basalt.run) (free) and go to Settings → API Keys → Generate new key.

### 2. Add to your tool

**Cursor** — add to `~/.cursor/mcp.json` or Settings → MCP:

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

**Claude Code:**

```bash
claude mcp add --transport http basalt https://basalt.run/api/mcp \
  --header "Authorization: Bearer bsk_your_key_here"
```

**Claude Desktop** — add to `claude_desktop_config.json`:

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

**Windsurf** — Settings → MCP Servers, same config as Cursor.

## Available Tools

| Tool | Description |
|------|-------------|
| `get_token` | Get a resolved token value by path (e.g. `color.action.default`) |
| `list_tokens` | List all tokens in a project |
| `search_tokens` | Search tokens by name or value |
| `get_component` | Get full component spec — usage, variants, a11y notes, code |
| `list_components` | List all registered components with metadata |
| `get_icon` | Get an SVG icon by name |
| `list_icons` | List all available icons |
| `get_theme` | Get light/dark theme tokens |
| `check_contrast` | Check WCAG AA/AAA contrast between two colors |

## What It Solves

AI coding tools hallucinate design values. They hardcode `#3B82F6` instead of using `var(--color-action-default)`. They guess at component APIs instead of using your real props.

Basalt gives AI tools a structured, queryable source of truth for your design system. Tokens are stored in Git as DTCG 2025.10 JSON, edited visually in Basalt's web editor, and served via MCP.

## Works With Claude Design

Claude Design reads your codebase during onboarding to apply your brand. Basalt is where your brand is defined — tokens, components, documentation, all in Git. Edit in Basalt, commit to your repo, and Claude Design picks it up automatically.

## Links

- **Website:** [basalt.run](https://basalt.run)
- **Token format:** [DTCG 2025.10](https://tr.designtokens.org/format/) (W3C standard)
- **SDK:** [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) (Node.js)
