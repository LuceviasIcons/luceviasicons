/**
 * Sanity checks over the icon set: `npm run icons:check`.
 *
 * Catches the mistakes a batch of icons actually arrives with, which the build
 * itself is happy to swallow:
 *
 *   - a weight file misnamed ("Reglar.svg"), so the weight silently disappears
 *   - an icon with no category, which drops out of the catalog filter
 *   - two icons whose markup is identical — a duplicate exported twice
 *   - markup that lost `currentColor` and would ignore the color prop
 *
 * Every one of these has happened at least once. The build reports none of them
 * because none of them break the build.
 *
 * Exits non-zero on a problem, so CI stops on it.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { collectIcons, ROOT, WEIGHTS } from './svg-source.mjs'

/** Edit distance, just enough to tell "Ligth" from "Light". */
function levenshtein(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
  }
  return d[a.length][b.length]
}

const icons = collectIcons()
const problems = []
const warnings = []

/** Categories are optional for the build, but an icon without one is invisible in the filter. */
let categories = {}
try {
  categories = JSON.parse(readFileSync(join(ROOT, 'packages/core/categories.json'), 'utf8'))
} catch {
  warnings.push('categories.json is missing — the catalog filter will be empty')
}

const seen = new Map()

for (const { name, variants } of icons) {
  const weights = Object.keys(variants)

  // regular is what every other weight falls back to
  if (!variants.regular) {
    problems.push(`${name}: no regular weight (has ${weights.join(', ') || 'nothing'})`)
  }

  /*
   * A weight that is missing everywhere is fine — the set is drawn in batches.
   * A weight missing from one icon while its neighbours have it is usually a
   * misnamed file, which is exactly what "Reglar.svg" was.
   */
  const missing = ['thin', 'light', 'bold'].filter((w) => !variants[w])
  if (missing.length && missing.length < 3) {
    warnings.push(`${name}: no ${missing.join(', ')} — check the file names`)
  }

  for (const [weight, markup] of Object.entries(variants)) {
    if (!WEIGHTS.includes(weight)) {
      problems.push(`${name}: unknown weight "${weight}"`)
    }
    if (!markup.includes('currentColor')) {
      problems.push(`${name}/${weight}: no currentColor — the color prop will do nothing`)
    }

    // identical markup in two icons means the same drawing was exported twice
    const hash = createHash('sha1').update(markup).digest('hex')
    const key = `${weight}:${hash}`
    const first = seen.get(key)
    if (first && first !== name) {
      warnings.push(`${name} and ${first} have identical ${weight} markup`)
    } else {
      seen.set(key, name)
    }
  }

  /*
   * A single-weight icon whose name looks like a misspelled weight is not a new
   * icon at all — it is a typo in a file name ("Ligth.svg"), which the parser
   * dutifully turned into an icon of its own.
   */
  const looksLikeWeight = WEIGHTS.some(
    (w) => w !== name.toLowerCase() && levenshtein(w, name.toLowerCase()) <= 2,
  )
  if (weights.length === 1 && looksLikeWeight) {
    problems.push(`${name}: looks like a misspelled weight file, not an icon`)
    continue
  }

  if (!categories[name]) {
    problems.push(`${name}: no category — it will drop out of the catalog filter`)
  }
}

for (const w of warnings) console.warn(`warning  ${w}`)
for (const p of problems) console.error(`error    ${p}`)

const weights = [...new Set(icons.flatMap((i) => Object.keys(i.variants)))].sort()
console.log(
  `\n${icons.length} icons, ${weights.join('/')} — ` +
    `${problems.length} errors, ${warnings.length} warnings`,
)

if (problems.length) process.exit(1)
