/**
 * Builds the metadata of the `@luceviasicons/core` package: `assets/icons.json`.
 *
 * The SVGs themselves are published as-is — they are the source of truth. The
 * JSON is for consumers (the catalog site first of all), so they can get the
 * icon list with ready markup in a single import, without walking the folder
 * or repeating the file-name parsing rules.
 *
 * Run: `npm run core:build`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { collectIcons, ROOT } from './svg-source.mjs'

const OUT = join(ROOT, 'packages/core/assets')

const icons = collectIcons()

/**
 * Search tags: the optional `packages/core/tags.json` shaped as
 * { "icon-name": ["tag", "synonym"] }. No file — icons simply carry no tags.
 */
let tags = {}
try {
  tags = JSON.parse(readFileSync(join(ROOT, 'packages/core/tags.json'), 'utf8'))
} catch {
  // no file — that is fine
}

/**
 * Categories for the catalog filter: the optional
 * `packages/core/categories.json` shaped as { "icon-name": "Arrows" }.
 *
 * A separate file rather than the first tag: tags are search synonyms, and a
 * category among them would make the query "arrow" indistinguishable from the
 * "Arrows" filter. One category per icon — then the filter counts add up to the total.
 */
let categories = {}
try {
  categories = JSON.parse(readFileSync(join(ROOT, 'packages/core/categories.json'), 'utf8'))
} catch {
  // no file — icons ship without categories, the filter just will not show up
}

/**
 * Version history from `packages/core/history.json` (kept by build-history.mjs).
 * The site shows "new" and "updated" from it: the status belongs to the set,
 * not to the visitor localStorage, so it is the same for everyone.
 */
let history = {}
try {
  history = JSON.parse(readFileSync(join(ROOT, 'packages/core/history.json'), 'utf8'))
} catch {
  // no history yet — icons ship without version marks
}

/*
 * The day the set was last extended — the site decides what to mark as new by
 * it. Taken from the history itself, not from the build date: a rebuild with
 * no new icons must not put out the marks of the current batch.
 *
 * `0` is the baseline "has always been here" stamp and never wins the max.
 */
const latestDay = Object.values(history)
  .flatMap(({ added, changed }) => [added, changed])
  .filter((d) => d && d !== '0')
  .sort()
  .at(-1)

const payload = {
  version: JSON.parse(readFileSync(join(ROOT, 'packages/core/package.json'), 'utf8')).version,
  // last extension date: added/changed of the icons are compared against it
  latestDay,
  icons: icons.map(({ name, viewBox, variants }) => ({
    name,
    viewBox,
    tags: tags[name] ?? [],
    category: categories[name],
    // day of appearance and day of the last markup edit
    added: history[name]?.added,
    changed: history[name]?.changed,
    variants,
  })),
}

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'icons.json'), JSON.stringify(payload))

console.log(`@luceviasicons/core: ${icons.length} icons → packages/core/assets/icons.json`)

// without a category an icon drops out of the catalog filter — never do that silently
const uncategorized = icons.filter(({ name }) => !categories[name]).map(({ name }) => name)
if (uncategorized.length > 0) {
  console.warn(
    `no category (${uncategorized.length}), add them to packages/core/categories.json: ` +
      uncategorized.join(', '),
  )
}
