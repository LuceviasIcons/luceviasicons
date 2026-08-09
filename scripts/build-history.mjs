/**
 * Maintains `packages/core/history.json` — on which day an icon appeared and
 * when its markup was last edited.
 *
 * Why: the "new" and "updated" statuses on the site used to be computed from
 * a snapshot in every visitor's localStorage. The marks came out personal and
 * required a "mark as seen" button. Binding them to a date makes the status a
 * property of the set: the same for everyone, and it fades on its own.
 *
 * Why a date and not the package version. The version is bumped only on a
 * release, while icons land in batches several times a week. While the version
 * stayed put, the marks did not fade but piled up: by the fourth batch 349
 * icons out of 686 were "new" — half the catalog, which means nothing.
 * A date changes by itself, so the previous day batch fades without a release,
 * a tag or any manual action.
 *
 * The file is appended to, not rebuilt: the day of appearance is a historical
 * fact and cannot be derived from the current folder. That is why history.json
 * lives in git next to the icons.
 *
 * Run: part of `npm run core:build`, standalone — `npm run history:build`.
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { collectIcons, ROOT } from './svg-source.mjs'

const HISTORY = join(ROOT, 'packages/core/history.json')

/** Markup fingerprint: it shows that an icon has been redrawn. */
function fingerprint(variants) {
  const body = Object.keys(variants)
    .sort()
    .map((w) => `${w}:${variants[w]}`)
    .join('|')
  return createHash('sha1').update(body).digest('hex').slice(0, 12)
}

/** Today in UTC, `YYYY-MM-DD`: this is what a new batch gets stamped with. */
const today = new Date().toISOString().slice(0, 10)

let history = {}
let firstRun = false
try {
  history = JSON.parse(readFileSync(HISTORY, 'utf8'))
} catch {
  firstRun = true
}

/*
 * On the first run there is no history, and everything in the folder has
 * accumulated earlier. Such a set is recorded with the special date `0`,
 * meaning "has always been here". Had we stamped today, the whole catalog
 * would light up green even though nothing was added.
 */
const BASELINE = '0'

const icons = collectIcons()
let added = 0
let changed = 0

for (const { name, variants } of icons) {
  const hash = fingerprint(variants)
  const known = history[name]

  if (!known) {
    const day = firstRun ? BASELINE : today
    // added — day of appearance, changed — day of the last markup edit
    history[name] = { added: day, changed: day, hash }
    if (!firstRun) added++
  } else if (known.hash !== hash) {
    known.changed = today
    known.hash = hash
    changed++
  }
}

/*
 * Deleted icons are not purged from the history. A name may come back, and
 * then it matters that it has been here before: otherwise it lights up as new again.
 */

// keys are sorted: otherwise file diffs get noisy with reorderings
const sorted = Object.fromEntries(Object.keys(history).sort().map((k) => [k, history[k]]))
writeFileSync(HISTORY, `${JSON.stringify(sorted, null, 2)}\n`)

console.log(
  `History ${today}: +${added} new, ~${changed} changed, ${Object.keys(sorted).length} total`,
)
