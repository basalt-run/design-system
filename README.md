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

## License

MIT
