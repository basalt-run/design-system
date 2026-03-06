/**
 * Basalt MCP Server
 * Serves DTCG 2025.10 design tokens to AI coding tools via Model Context Protocol.
 *
 * Tools exposed:
 *   get_tokens        — list all tokens, optionally filtered by category or mode
 *   get_token         — get a single token by path, fully resolved
 *   search_tokens     — find tokens by name, value, or description
 *   resolve_alias     — trace an alias chain step by step
 *
 * Usage:
 *   node server.js --tokens-path ./tokens
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, existsSync } from "fs";
import { resolve, join } from "path";

// ---------------------------------------------------------------------------
// Config — parse --tokens-path argument or fall back to ./tokens
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const tokensPathArg = args.indexOf("--tokens-path");
const TOKENS_DIR = resolve(
  tokensPathArg !== -1 ? args[tokensPathArg + 1] : "./tokens"
);

// ---------------------------------------------------------------------------
// Token loading
// ---------------------------------------------------------------------------

function loadJSON(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (e) {
    console.error(`[basalt] Failed to parse ${filePath}:`, e.message);
    return null;
  }
}

function loadTokens() {
  const primitives = loadJSON(join(TOKENS_DIR, "primitives.json"));
  const light = loadJSON(join(TOKENS_DIR, "semantic.light.json"));
  const dark = loadJSON(join(TOKENS_DIR, "semantic.dark.json"));

  if (!primitives) {
    throw new Error(`Could not load primitives.json from ${TOKENS_DIR}`);
  }

  return { primitives, light, dark };
}

// ---------------------------------------------------------------------------
// Token flattening — converts nested JSON into a flat map of path → token
// ---------------------------------------------------------------------------

const RESERVED_KEYS = new Set(["$type", "$value", "$description", "$metadata", "$extensions"]);

function flattenTokens(obj, prefix = "", inherited$type = null) {
  const result = {};

  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith("$")) continue;

    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof val !== "object" || val === null) continue;

    // Inherit $type from parent group if not set on node
    const currentType = val.$type || inherited$type;

    if ("$value" in val) {
      // This is a token node
      result[path] = {
        $value: val.$value,
        $type: currentType || null,
        $description: val.$description || null,
        path,
      };
    } else {
      // This is a group — recurse
      const nested = flattenTokens(val, path, currentType);
      Object.assign(result, nested);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Alias resolution — resolves {dot.notation} references recursively
// ---------------------------------------------------------------------------

const ALIAS_PATTERN = /^\{([^}]+)\}$/;

function resolveValue(value, allTokens, visited = new Set()) {
  if (typeof value === "string") {
    const match = value.match(ALIAS_PATTERN);
    if (match) {
      const aliasPath = match[1];
      if (visited.has(aliasPath)) {
        return { resolved: null, error: `Circular alias: ${aliasPath}` };
      }
      const target = allTokens[aliasPath];
      if (!target) {
        return { resolved: null, error: `Broken alias: ${aliasPath} not found` };
      }
      return resolveValue(target.$value, allTokens, new Set([...visited, aliasPath]));
    }
    return { resolved: value };
  }

  if (typeof value === "object" && value !== null) {
    // Handle composite values (e.g. shadow objects with color aliases inside)
    const resolved = {};
    for (const [k, v] of Object.entries(value)) {
      const r = resolveValue(v, allTokens, visited);
      resolved[k] = r.resolved ?? v;
    }
    return { resolved };
  }

  return { resolved: value };
}

function buildAliasChain(value, allTokens, chain = []) {
  if (typeof value !== "string") return chain;

  const match = value.match(ALIAS_PATTERN);
  if (!match) return chain;

  const aliasPath = match[1];
  const target = allTokens[aliasPath];

  if (!target) {
    return [...chain, { path: aliasPath, error: "not found" }];
  }

  return buildAliasChain(target.$value, allTokens, [
    ...chain,
    { path: aliasPath, $value: target.$value, $type: target.$type },
  ]);
}

// ---------------------------------------------------------------------------
// Build the combined token map for a given mode
// ---------------------------------------------------------------------------

function buildTokenMap(tokens, mode = "light") {
  const { primitives, light, dark } = tokens;

  const semantic = mode === "dark" ? dark : light;

  const flat = {
    ...flattenTokens(primitives),
    ...(semantic ? flattenTokens(semantic) : {}),
  };

  return flat;
}

// ---------------------------------------------------------------------------
// Format a token for output
// ---------------------------------------------------------------------------

function formatToken(token, allTokens, resolveAliases = true) {
  const isAlias =
    typeof token.$value === "string" && ALIAS_PATTERN.test(token.$value);

  const output = {
    path: token.path,
    $type: token.$type,
    $value: token.$value,
    $description: token.$description,
    isAlias,
  };

  if (isAlias && resolveAliases) {
    const { resolved, error } = resolveValue(token.$value, allTokens);
    output.resolvedValue = resolved ?? null;
    output.aliasChain = buildAliasChain(token.$value, allTokens);
    if (error) output.aliasError = error;
  }

  return output;
}

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new Server(
  {
    name: "basalt",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Load tokens once at startup
let tokens;
try {
  tokens = loadTokens();
  const count = Object.keys(flattenTokens(tokens.primitives)).length;
  console.error(`[basalt] Loaded tokens from ${TOKENS_DIR} (${count} primitives)`);
} catch (e) {
  console.error(`[basalt] Fatal: ${e.message}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_tokens",
      description:
        "Get all design tokens from the Basalt design system. Optionally filter by category (e.g. 'color', 'spacing', 'typography') and mode ('light' or 'dark'). Returns token paths, values, types, and resolved alias values. Use this to understand what tokens are available before generating code.",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description:
              "Filter by top-level category: 'color', 'spacing', 'typography', 'radius', 'shadow', 'duration', 'easing'. Omit to get all tokens.",
          },
          mode: {
            type: "string",
            enum: ["light", "dark"],
            description: "Color mode for semantic alias resolution. Defaults to 'light'.",
          },
          include_primitives: {
            type: "boolean",
            description:
              "Include primitive tokens (raw values). Defaults to true. Set to false to only see semantic aliases.",
          },
        },
      },
    },
    {
      name: "get_token",
      description:
        "Get a single design token by its full dot-notation path (e.g. 'color.semantic.bg.page' or 'spacing.4'). Returns the value, type, description, and full alias resolution chain. Use this when you need the exact value for a specific token.",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Full dot-notation token path, e.g. 'color.bg.page' or 'color.accent.default'",
          },
          mode: {
            type: "string",
            enum: ["light", "dark"],
            description: "Color mode for alias resolution. Defaults to 'light'.",
          },
        },
        required: ["path"],
      },
    },
    {
      name: "search_tokens",
      description:
        "Search for design tokens by keyword. Searches token paths, descriptions, and string values. Useful for finding the right token when you know what you need but not the exact path — e.g. search 'background' to find all background color tokens, or 'ember' to find all brand accent tokens.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search term to match against token paths, descriptions, and values.",
          },
          mode: {
            type: "string",
            enum: ["light", "dark"],
            description: "Color mode. Defaults to 'light'.",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "resolve_alias",
      description:
        "Trace the full resolution chain of an alias token step by step. Shows each hop from semantic alias → intermediate aliases → final primitive value. Use this to understand how a token is derived, or to debug a broken alias.",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Token path to trace, e.g. 'color.accent.default'",
          },
          mode: {
            type: "string",
            enum: ["light", "dark"],
            description: "Color mode. Defaults to 'light'.",
          },
        },
        required: ["path"],
      },
    },
  ],
}));

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case "get_tokens": {
        const mode = args.mode || "light";
        const includePrimitives = args.include_primitives !== false;
        const allTokens = buildTokenMap(tokens, mode);

        let filtered = Object.entries(allTokens);

        // Filter by category prefix
        if (args.category) {
          filtered = filtered.filter(([path]) =>
            path.startsWith(args.category + ".")
          );
        }

        // Optionally exclude primitives (tokens not in semantic files)
        if (!includePrimitives) {
          const semanticKeys = new Set(
            Object.keys(flattenTokens(mode === "dark" ? tokens.dark || {} : tokens.light || {}))
          );
          filtered = filtered.filter(([path]) => semanticKeys.has(path));
        }

        const result = filtered.map(([, token]) =>
          formatToken(token, allTokens)
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  mode,
                  count: result.length,
                  tokens: result,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_token": {
        const mode = args.mode || "light";
        const allTokens = buildTokenMap(tokens, mode);
        const token = allTokens[args.path];

        if (!token) {
          // Try to suggest close matches
          const close = Object.keys(allTokens)
            .filter((p) => p.includes(args.path.split(".").pop()))
            .slice(0, 5);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: `Token not found: ${args.path}`,
                    suggestions: close,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formatToken(token, allTokens), null, 2),
            },
          ],
        };
      }

      case "search_tokens": {
        const mode = args.mode || "light";
        const allTokens = buildTokenMap(tokens, mode);
        const q = args.query.toLowerCase();

        const results = Object.entries(allTokens)
          .filter(([path, token]) => {
            const inPath = path.toLowerCase().includes(q);
            const inDesc = token.$description?.toLowerCase().includes(q);
            const inValue =
              typeof token.$value === "string" &&
              token.$value.toLowerCase().includes(q);
            return inPath || inDesc || inValue;
          })
          .map(([, token]) => formatToken(token, allTokens));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  query: args.query,
                  mode,
                  count: results.length,
                  tokens: results,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "resolve_alias": {
        const mode = args.mode || "light";
        const allTokens = buildTokenMap(tokens, mode);
        const token = allTokens[args.path];

        if (!token) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ error: `Token not found: ${args.path}` }, null, 2),
              },
            ],
          };
        }

        const chain = buildAliasChain(token.$value, allTokens);
        const { resolved, error } = resolveValue(token.$value, allTokens);

        // Build the full trace including the starting token
        const trace = [
          { path: args.path, $value: token.$value, $type: token.$type },
          ...chain,
        ];

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  path: args.path,
                  mode,
                  isAlias: ALIAS_PATTERN.test(token.$value),
                  resolvedValue: resolved ?? null,
                  aliasError: error ?? null,
                  trace,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (e) {
    return {
      content: [{ type: "text", text: `Error: ${e.message}` }],
      isError: true,
    };
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[basalt] MCP server running — waiting for connections");
