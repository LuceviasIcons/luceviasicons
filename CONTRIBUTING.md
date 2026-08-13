# Contributing

Thanks for taking the time. The most useful contributions here are icons and
reports of icons that look wrong.

## Requesting an icon

Open an [icon request](https://github.com/LuceviasIcons/luceviasicons/issues/new?template=icon-request.yml).
Search the [catalog](https://luceviasicons.com) first — the set is larger than
it looks and the search understands synonyms, so `cart` finds `basket`.

Telling us **where you would use it** matters more than the name. An icon that
has to read at 16px in a table row is drawn differently from one that sits alone
on a landing page.

## Adding an icon

Icons live in `packages/core/svg/` — a folder per icon, a file per weight:

```
packages/core/svg/basket/
  Thin.svg  Light.svg  Regular.svg  Bold.svg
```

Requirements:

- **A 24×24 grid.** The `viewBox` comes from the file, and an icon drawn on
  another grid renders at the wrong size next to the rest.
- **Strokes, not outlines.** The build normalizes them to `currentColor` so the
  icon inherits the color of its container.
- **A kebab-case folder name.** It becomes the component name —
  `address-book` gives `AddressBook`.
- **All four weights**, if you can. A missing one falls back to `regular`
  rather than breaking, but an icon that only exists in one weight looks out of
  place in a set where the others switch.

Then give it a category in `packages/core/categories.json` — exactly one per
icon. Without it the icon works everywhere but disappears from the catalog
filter, and `npm run icons:check` will tell you so.

```bash
npm install
npm run icons:check   # names, weights, categories, duplicates
npm run build         # regenerate icons.json and the React package
```

Commit the regenerated `packages/core/assets/icons.json` — the site installs the
package straight from this repository and never runs the generators, so a stale
file means a stale catalog. CI checks this.

## Reporting a problem

An [issue](https://github.com/LuceviasIcons/luceviasicons/issues/new?template=bug.yml)
with the icon name and a screenshot is enough. "This looks off at 16px" is a
perfectly good report — optical problems are the ones worth hearing about.

## Code

The parsing of names, weights and viewBox lives in one place —
`scripts/svg-source.mjs` — and both generators import it. These rules were once
duplicated and drifted apart, so please do not start a third copy.

Comments in this codebase explain **why**, not what. If a decision was made
against an obvious alternative, the reason belongs next to it.
