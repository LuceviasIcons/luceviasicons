/**
 * Parsing of the `packages/core/svg` folder — the single place this logic lives.
 *
 * Both generators use it: the `@lucevias_icon/core` metadata and the React
 * components of the `lucevias` package. The naming rules used to be duplicated
 * in each of them and drifted apart on the first edit.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const WEIGHTS = ['thin', 'light', 'regular', 'bold', 'fill', 'duotone']

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const SVG_DIR = join(ROOT, 'packages/core/svg')

export const DEFAULT_VIEW_BOX = '0 0 256 256'

/** The insides of <svg>, without the wrapper, comments or xml prolog. */
export function innerSvg(source) {
  const match = source.match(/<svg[^>]*>([\s\S]*)<\/svg>/i)
  return (match ? match[1] : source)
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()
}

/** viewBox of the source — icons are not always drawn on a 256×256 grid. */
export const viewBoxOf = (source) =>
  source.match(/<svg[^>]*\sviewBox="([^"]+)"/i)?.[1]?.trim() ?? DEFAULT_VIEW_BOX

/** Paint into currentColor so that the `color` prop works. */
export const normalizeColors = (markup) =>
  markup.replace(/(fill|stroke)="((?!none|currentColor)[^"]*)"/gi, '$1="currentColor"')

export const pascal = (name) =>
  name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')

/**
 * React component name: `address-book` → `AddressBook`.
 *
 * There is no `Icon` suffix: the icon name is the component name. Snippets on
 * the site build the name by this very rule.
 *
 * The price is collisions with foreign names in imports. The current set has
 * three: `Anchor`, `Article`, `Circle`. They do not break JSX (the lowercase
 * `<article>` and `<circle>` differ in case), but they will clash with an
 * import of the same name from react-native-svg, recharts and similar
 * libraries. Cured by an alias on the app side: `import { Circle as CircleIcon }`.
 */
export const componentName = (name) => pascal(name)

/**
 * Parses a file path into an "icon name + weight" pair. Three layouts are
 * supported:
 *
 *   `acorn/Regular.svg` — folder is the name, file is the weight (the main one)
 *   `regular/bell.svg`  — folder is the weight, file is the name
 *   `bell-bold.svg`     — weight as a suffix in the file name
 *
 * The order of checks matters. The name is taken from the file only when the
 * file itself is not named after a weight: otherwise `acorn/Regular.svg` yields
 * an icon called "Regular", and the whole set collapses into four icons named
 * after the weights.
 */
export function parsePath(relPath) {
  const segments = relPath.replace(/\.svg$/i, '').split(sep)
  const file = segments.pop()
  const folderWeight = segments.map((s) => s.toLowerCase()).find((s) => WEIGHTS.includes(s))

  // file is named after a weight → the name is in the nearest non-weight folder
  const fileIsWeight = WEIGHTS.includes(file.toLowerCase())
  if (fileIsWeight) {
    const folderName = [...segments].reverse().find((s) => !WEIGHTS.includes(s.toLowerCase()))
    if (folderName) return { name: folderName, weight: file.toLowerCase() }
  }

  const suffix = file.match(/[.-]([a-z]+)$/i)?.[1]?.toLowerCase()
  const fileWeight = suffix && WEIGHTS.includes(suffix) ? suffix : undefined
  const name = fileWeight ? file.slice(0, file.length - suffix.length - 1) : file

  return { name, weight: fileWeight ?? folderWeight ?? 'regular' }
}

/** Recursive walk: weights may live in nested directories. */
function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.name.toLowerCase().endsWith('.svg')) out.push(full)
  }
  return out
}

/**
 * Collects icons from the folder: `[{ name, viewBox, variants }]`, sorted by
 * name. `variants` is markup without the <svg> wrapper, painted into
 * currentColor.
 */
export function collectIcons() {
  const files = walk(SVG_DIR)
  if (files.length === 0) {
    console.error('No SVG files in packages/core/svg — nothing to build.')
    process.exit(1)
  }

  const icons = new Map()
  for (const full of files) {
    const source = readFileSync(full, 'utf8')
    const { name, weight } = parsePath(relative(SVG_DIR, full))
    const markup = normalizeColors(innerSvg(source))
    if (!markup) continue

    const entry = icons.get(name) ?? { name, variants: {}, viewBox: viewBoxOf(source) }
    entry.variants[weight] = markup
    // take the grid from regular, otherwise it sticks from whichever weight came first
    if (weight === 'regular') entry.viewBox = viewBoxOf(source)
    icons.set(name, entry)
  }

  return [...icons.values()]
    .filter((icon) => Object.keys(icon.variants).length > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
}
