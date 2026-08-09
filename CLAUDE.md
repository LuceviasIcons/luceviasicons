# LUCEVIAS — icons

The repository of icons and of the npm packages built from them. The catalog
site lives separately:
[LuceviasIcons/luceviasicons.com](https://github.com/LuceviasIcons/luceviasicons.com).
It is not part of this repo and is wired in through npm.

**Icons live in `packages/core/svg/`** — the single source of truth. Put new
SVGs only there.

## Two packages

| Package | Contents | Who installs it |
| --- | --- | --- |
| `@lucevias/core` (`packages/core`) | raw SVGs + generated `assets/icons.json` | the catalog site, third-party integrations |
| `lucevias` (`packages/icons`) | React components | application developers |

They are published together, under one version from a tag. The site needs the
raw markup itself (copying, PNG export, hashes for the "new" mark), and that
cannot be recovered from React components — hence two packages, not one.

## Commands

```bash
npm run core:build       # packages/core/assets/icons.json
npm run pkg:build        # React components + package build
npm run build            # both
npm run icons:optimize   # SVGO over packages/core/svg (edits files in place)
```

## Architecture

- `scripts/svg-source.mjs` — **all** of the folder-parsing logic: names, weights,
  viewBox, painting into currentColor, walking nested folders. Both generators
  import from here. These rules used to be duplicated and drifted apart — do not
  start a third copy.
- `scripts/build-core.mjs` — builds `icons.json` for `@lucevias/core`. Tags are
  picked up from the optional `packages/core/tags.json`, the category from
  `packages/core/categories.json`.
- `scripts/build-package.mjs` — generates React components into
  `packages/icons/src` (not committed, see .gitignore). Every component is marked
  `/* #__PURE__ */` — without it tree-shaking breaks and importing a single icon
  drags in the whole package (185 KB against 9 KB).

## How to add icons

A folder per icon, a file per weight:

```
packages/core/svg/
  acorn/     Thin.svg Light.svg Regular.svg Bold.svg
  address-book/ …
```

A missing weight falls back to regular, so an incomplete set breaks nothing.

`parsePath` from `svg-source.mjs` understands three layouts: `acorn/Regular.svg`
(the main one), `regular/bell.svg` (folder is the weight) and `bell-bold.svg`
(weight as a suffix). Do not mix them within one set — the same icon would end
up defined in two ways.

Component names are built by `componentName` from the same module:
`address-book` → `AddressBook`, no suffix. The price is collisions in imports:
`Anchor`, `Article` and `Circle` clash with the same-named import from
react-native-svg, recharts and the like. JSX is not broken by this; it is cured
by an alias on the app side.

For an icon to show up on the site a push to `main` is enough: the site clones
`packages/core` from that branch before every build (`scripts/fetch-icons.mjs`
in the site repository). No npm release is needed for that.

## Tags and categories

Two different files, and they should not be confused:

- `packages/core/tags.json` — search synonyms, an icon may have any number.
- `packages/core/categories.json` — the category for the catalog filter,
  **exactly one** per icon (`{ "acorn": "Nature" }`).

The category is deliberately not the first tag: tags serve the search, and a
category among them would make the "Arrows" filter indistinguishable from the
`arrow` query. One category per icon — so that the filter counts add up to the
total size of the set.

A new batch of icons without categories does not break the build but drops out
of the filter, so `core:build` prints a warning listing such names — deal with
it rather than ignoring it.

## Releasing

```bash
git tag v0.2.0 && git push --tags
```

The version from the tag is applied to both packages, core is published first.
Requires the `NPM_TOKEN` secret.

## The "new" and "updated" statuses

`packages/core/history.json` remembers **on which day** an icon appeared and when
its markup last changed (`YYYY-MM-DD`). The file is kept by
`scripts/build-history.mjs` (part of `core:build`) and is appended to rather than
rebuilt: the day of appearance is a historical fact and cannot be derived from
the current folder. That is why the file lives in git, and after a release the
workflow pushes the updated version back to `main`.

`build-core.mjs` puts a `latestDay` field into `icons.json` — the freshest date
from the history. The site compares each icon's `added`/`changed` against it: a
match means "new" or "updated", otherwise the icon is ordinary. Only the latest
batch is ever marked, and a batch landed on another day puts out the previous
one by itself.

**Not the package version.** The version is bumped only on a release, while icons
land in batches several times a week. While statuses were computed from the
version, the marks did not fade but piled up: by the fourth batch 349 icons out
of 686 were "new" — half the catalog, which tells the visitor nothing. A date
changes on its own, with no release, tag or manual action.

`latestDay` is taken from the history, not from the build date: a rebuild with no
new icons must not put out the marks of the current batch.

Deleted names are not purged from the history: a name may come back, and then it
matters that it has been here before.

## Security

The icon markup is entirely our own, from `packages/core/svg/`. If user-uploaded
SVGs ever appear, run them through DOMPurify or parse the paths into a structure.

## Working with the code

Before creating any file, check whether an analogue exists, whether something can
be reused, and whether the logic is being duplicated.

Forbidden: temporary files, duplicates, superfluous util functions, pointless
wrappers, dead code. Prefer changing existing code over writing new code.
