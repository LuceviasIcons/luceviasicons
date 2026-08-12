/**
 * Reading the set and searching it — everything the tools in `index.mjs` need.
 *
 * The data comes from `@lucevias/core`, the same `icons.json` the site and the
 * Figma plugin use. There is no second copy of the set: an icon added to
 * `packages/core/svg` reaches the agent with the next release of core.
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

/** @type {{ version: string, latestDay?: string, icons: any[] }} */
const CORE = require('@lucevias/core/icons.json')

export const VERSION = CORE.version
export const LATEST_DAY = CORE.latestDay ?? ''
export const ICONS = CORE.icons

const BY_NAME = new Map(ICONS.map((icon) => [icon.name, icon]))

export const iconByName = (name) => BY_NAME.get(name)

/** Weights actually drawn in the set — not every one the package can serve. */
export const WEIGHTS = [...new Set(ICONS.flatMap((i) => Object.keys(i.variants)))]

/** Categories with counts, from the largest to the smallest. */
export function categories() {
  const counts = new Map()
  for (const { category } of ICONS) {
    if (category) counts.set(category, (counts.get(category) ?? 0) + 1)
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

/**
 * Exactness rank: the lower, the higher in the results.
 *
 * Repeats the ranking of the catalog (`src/icons/search.ts` on the site) so that
 * an agent and a person searching the same word get the same icon first. Without
 * it the query `arrow` could return `arrows-merge` before `arrow` itself.
 */
function exactness(icon, q) {
  const name = icon.name.toLowerCase()
  if (name === q) return 0
  if (name.startsWith(`${q}-`)) return 1
  if (name.startsWith(q)) return 2
  if (name.split('-').includes(q)) return 3
  if (icon.tags.some((t) => t.toLowerCase() === q)) return 4
  if (name.includes(q)) return 5
  if (icon.tags.some((t) => t.toLowerCase().includes(q))) return 6
  return 7
}

/**
 * Search by name and tags.
 *
 * Substring only, no fuzzy matching: an agent types a word deliberately rather
 * than with typos, and a fuzzy tail would only feed it icons that merely look
 * alike. What it does need is a strict order — hence the ranking above.
 */
export function search(query, { category, limit = 20 } = {}) {
  const q = String(query ?? '').trim().toLowerCase()
  const scope = category ? ICONS.filter((i) => i.category === category) : ICONS

  if (!q) return scope.slice(0, limit)

  return scope
    .map((icon) => ({ icon, rank: exactness(icon, q) }))
    .filter((r) => r.rank <= 6)
    .sort((a, b) => a.rank - b.rank || a.icon.name.localeCompare(b.icon.name))
    .slice(0, limit)
    .map((r) => r.icon)
}

/**
 * Names closest to the given one — for the "did you mean" of a wrong name.
 *
 * Here, unlike in `search`, fuzziness is exactly what is needed: the agent has
 * already produced a name that does not exist, usually a near miss
 * ("shoping-kart"), and a substring search returns nothing on it.
 *
 * The measure is the length of the longest common subsequence relative to the
 * longer of the two names. Enough to catch a swapped or dropped letter, and it
 * needs no dependency.
 */
export function suggest(name, limit = 5) {
  const q = String(name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!q) return []

  const score = (candidate) => {
    const c = candidate.replace(/[^a-z0-9]/g, '')
    let i = 0
    for (const ch of c) if (ch === q[i]) i++
    return i / Math.max(q.length, c.length)
  }

  return ICONS.map((icon) => ({ name: icon.name, s: score(icon.name) }))
    .filter((r) => r.s >= 0.55)
    .sort((a, b) => b.s - a.s || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((r) => r.name)
}

/**
 * What is returned about an icon in a list.
 *
 * Deliberately without `variants`: the markup of all four weights is a few
 * kilobytes per icon, and a list of twenty would eat the agent context for
 * nothing. The markup is served by `get_icon`, one icon at a time.
 */
export function brief(icon) {
  return {
    name: icon.name,
    category: icon.category,
    tags: icon.tags,
    weights: Object.keys(icon.variants),
  }
}
