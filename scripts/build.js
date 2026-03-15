import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const tokensDir = path.join(rootDir, 'tokens')

// Ensure dist exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
}

// ============================================================================
// STEP 1: Load all token files and merge them
// ============================================================================

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (key.startsWith('$')) continue
    const srcVal = source[key]
    const tgtVal = target[key]
    if (srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal) && srcVal.$value === undefined) {
      if (!tgtVal || typeof tgtVal !== 'object' || tgtVal.$value !== undefined) {
        target[key] = {}
      }
      deepMerge(target[key], srcVal)
    } else {
      target[key] = srcVal
    }
  }
  return target
}

function loadTokens() {
  const tokenFiles = [
    'primitives.json',
    'semantic.light.json',
    'semantic.dark.json'
  ]

  let merged = {}

  tokenFiles.forEach(file => {
    const filePath = path.join(tokensDir, file)
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      deepMerge(merged, content)
    }
  })

  return merged
}

// ============================================================================
// STEP 2: Generate TypeScript types
// ============================================================================

function flattenTokens(obj, prefix = '') {
  const flat = {}
  
  Object.entries(obj).forEach(([key, value]) => {
    if (key.startsWith('$')) return
    
    const pathStr = prefix ? `${prefix}.${key}` : key
    
    if (value && typeof value === 'object' && !value.$value) {
      Object.assign(flat, flattenTokens(value, pathStr))
    } else if (value && value.$value) {
      flat[pathStr] = value.$value
    }
  })
  
  return flat
}

// ============================================================================
// STEP 2.5: Resolve token references
// ============================================================================

function refValToStr(val) {
  if (val === undefined || val === null) return undefined
  if (typeof val === 'object') {
    if (val.offsetX !== undefined) {
      return `${val.offsetX} ${val.offsetY} ${val.blur} ${val.spread} ${val.color}`
    }
    return JSON.stringify(val)
  }
  return String(val)
}

function resolveReferences(flatTokens, maxDepth = 5) {
  const resolved = { ...flatTokens }
  let depth = 0
  let changed = true

  while (changed && depth < maxDepth) {
    changed = false
    depth++

    Object.entries(resolved).forEach(([path, value]) => {
      if (typeof value === 'string' && value.includes('{')) {
        const refPattern = /\{([a-z0-9.-]+)\}/gi
        const newValue = value.replace(refPattern, (match, refPath) => {
          const refKey = refPath.toLowerCase()

          if (resolved[refKey] !== undefined && resolved[refKey] !== match) {
            changed = true
            const refVal = resolved[refKey]
            return typeof refVal === 'object' ? refValToStr(refVal) : refVal
          }

          return match
        })

        resolved[path] = newValue
      }
    })
  }

  if (depth >= maxDepth) {
    console.warn('⚠️  Reference resolution hit max depth. Check for circular references.')
  }

  return resolved
}

function generateTypeScript(tokens) {
  const flatTokens = flattenTokens(tokens)
  const resolvedTokens = resolveReferences(flatTokens)
  const tokenPaths = Object.keys(resolvedTokens)
  
  const unionType = tokenPaths
    .map(pathStr => `'${pathStr}'`)
    .join(' | ')

  const typesFile = `
// Auto-generated types from Basalt tokens
// DO NOT EDIT — regenerated on build

export type TokenPath = ${unionType}

export interface Token {
  path: TokenPath
  value: string | number | object
}

export const tokens: Record<TokenPath, string | number | object> = {
${tokenPaths.map(pathStr => `  '${pathStr}': ${JSON.stringify(resolvedTokens[pathStr])}`).join(',\n')}
}

export default tokens
`

  return typesFile
}

// ============================================================================
// STEP 3: Generate CSS variables file
// ============================================================================

function generateCSS(tokens) {
  const flatTokens = flattenTokens(tokens)
  const resolvedTokens = resolveReferences(flatTokens)

  let css = ':root {\n'

  Object.entries(resolvedTokens).forEach(([pathStr, value]) => {
    const cssVarName = `--${pathStr.replace(/\./g, '-')}`
    const cssValue = typeof value === 'object' 
      ? JSON.stringify(value)
      : value
    
    css += `  ${cssVarName}: ${cssValue};\n`
  })
  
  css += '}\n'
  
  return css
}

// ============================================================================
// STEP 4: Generate Tailwind config plugin
// ============================================================================

function generateTailwindConfig(tokens) {
  const flatTokens = flattenTokens(tokens)
  const resolvedTokens = resolveReferences(flatTokens)

  const grouped = {}
  Object.entries(resolvedTokens).forEach(([pathStr, value]) => {
    const category = pathStr.split('.')[0]
    if (!grouped[category]) grouped[category] = {}
    grouped[category][pathStr] = value
  })

  const colorEntries = Object.entries(grouped.color || {})
    .map(([pathStr, value]) => `          '${pathStr}': '${value}',`)
    .join('\n')

  const spacingEntries = Object.entries(grouped.spacing || {})
    .map(([pathStr, value]) => `          '${pathStr}': '${value}',`)
    .join('\n')

  const radiusEntries = Object.entries(grouped.radius || {})
    .map(([pathStr, value]) => `          '${pathStr}': '${value}',`)
    .join('\n')

  const fontFamilyEntries = Object.entries(grouped.typography?.fontFamily || {})
    .map(([pathStr, value]) => {
      const fontList = Array.isArray(value) ? value.join(', ') : value
      return `          '${pathStr}': '${fontList}',`
    })
    .join('\n')

  const fontSizeEntries = Object.entries(grouped.typography?.fontSize || {})
    .map(([pathStr, value]) => `          '${pathStr}': '${value}',`)
    .join('\n')

  const shadowEntries = Object.entries(grouped.shadow || {})
    .map(([pathStr, value]) => {
      const shadowStr = typeof value === 'object'
        ? `${value.offsetX} ${value.offsetY} ${value.blur} ${value.spread} ${value.color}`
        : value
      return `          '${pathStr}': '${shadowStr}',`
    })
    .join('\n')

  const plugin = `
// Auto-generated Tailwind config from Basalt tokens
// Usage: plugins: [require('@basalt/design-system/tailwind')()]

module.exports = function() {
  return {
    theme: {
      extend: {
        colors: {
${colorEntries}
        },
        spacing: {
${spacingEntries}
        },
        borderRadius: {
${radiusEntries}
        },
        fontFamily: {
${fontFamilyEntries}
        },
        fontSize: {
${fontSizeEntries}
        },
        shadow: {
${shadowEntries}
        },
      }
    }
  }
}
`

  return plugin
}

// ============================================================================
// STEP 5: Generate ESM + CJS entry points
// ============================================================================

function generateIndex(tokens) {
  const flatTokens = flattenTokens(tokens)
  const resolvedTokens = resolveReferences(flatTokens)

  const esmContent = `
// Auto-generated from Basalt tokens
// Usage: import { tokens } from '@basalt/design-system'

export const tokens = ${JSON.stringify(resolvedTokens, null, 2)}

export default tokens
`

  const cjsContent = `
// Auto-generated from Basalt tokens (CommonJS)
const tokens = ${JSON.stringify(resolvedTokens, null, 2)}

module.exports = { tokens }
module.exports.default = tokens
`

  return { esm: esmContent, cjs: cjsContent }
}

// ============================================================================
// STEP 6: Write all files to dist
// ============================================================================

async function build() {
  console.log('📦 Building Basalt design system package...')
  
  try {
    const tokens = loadTokens()
    console.log('✓ Loaded tokens from /tokens')

    const tsContent = generateTypeScript(tokens)
    fs.writeFileSync(path.join(distDir, 'index.d.ts'), tsContent)
    console.log('✓ Generated TypeScript types (index.d.ts)')

    const { esm, cjs } = generateIndex(tokens)
    fs.writeFileSync(path.join(distDir, 'index.js'), esm)
    fs.writeFileSync(path.join(distDir, 'index.cjs'), cjs)
    console.log('✓ Generated ESM + CJS exports')

    const cssContent = generateCSS(tokens)
    fs.writeFileSync(path.join(distDir, 'tokens.css'), cssContent)
    console.log('✓ Generated CSS variables (tokens.css)')

    const tailwindContent = generateTailwindConfig(tokens)
    fs.writeFileSync(path.join(distDir, 'tailwind.config.js'), tailwindContent)
    console.log('✓ Generated Tailwind plugin (tailwind.config.js)')

    console.log('\n✨ Build complete! Ready to publish.')
    console.log(`   npm publish (or npm install github:basalt-run/design-system)`)

  } catch (error) {
    console.error('❌ Build failed:', error.message)
    process.exit(1)
  }
}

// Watch mode
if (process.argv.includes('--watch')) {
  const watch = (await import('node-watch')).default
  console.log('👁️  Watching /tokens for changes...')
  
  watch(tokensDir, { recursive: true }, () => {
    console.log('\n📝 Tokens changed. Rebuilding...')
    build()
  })
} else {
  build()
}
