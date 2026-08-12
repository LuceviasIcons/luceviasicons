<div align="center">

# Lucevias

**759 open-source icons on a single 24×24 grid.**
Four weights, tree-shakeable React components, MIT.

[**Browse the catalog →**](https://luceviasicons.com)

[![npm](https://img.shields.io/npm/v/lucevias?label=lucevias)](https://www.npmjs.com/package/lucevias)
[![license](https://img.shields.io/badge/license-MIT-black)](LICENSE)
[![icons](https://img.shields.io/badge/icons-759-black)](https://luceviasicons.com)

</div>

---

## Install

```bash
npm i lucevias
```

```jsx
import { Basket } from 'lucevias'

<Basket size={24} />
```

Every icon is a component; the name is the icon name in PascalCase. Props:
`size`, `color`, `weight` (`thin` · `light` · `regular` · `bold`), plus anything
`<svg>` takes — `className`, `onClick`, `aria-*`, `ref`.

```jsx
// the color is inherited from the parent
<span style={{ color: 'tomato' }}>
  <Basket size={20} weight="bold" />
</span>
```

Full API in [packages/icons](packages/icons).

## Use it with an AI agent

An MCP server ships with the set, so an agent in your editor picks icons from the
real library instead of guessing names that do not exist:

```bash
claude mcp add lucevias -- npx -y @lucevias/mcp
```

> *“add a basket icon to the header”* — the agent finds `basket` and writes the
> import for you.

Configs for Cursor, Claude Desktop, VS Code and other clients are in
[packages/mcp](packages/mcp).

## Packages

| Package | Contents | Who installs it |
| --- | --- | --- |
| [`lucevias`](packages/icons) | React components generated from the SVGs | Application developers |
| [`@lucevias/core`](packages/core) | Raw SVGs and `icons.json` metadata | The catalog site, custom bindings |
| [`@lucevias/mcp`](packages/mcp) | MCP server over the same metadata | Anyone coding with an AI agent |

All three are published from this repository under one version.

## Repository layout

```
packages/core/svg/     the icons — the single source of truth
packages/core/         @lucevias/core (raw SVGs + generated icons.json)
packages/icons/        lucevias (React components, generated — not committed)
packages/mcp/          @lucevias/mcp (MCP server for AI agents)
scripts/               svg-source.mjs (shared parsing) + the generators
```

Adding an icon means dropping an `.svg` into `packages/core/svg/` — a folder per
icon, a file per weight:

```
packages/core/svg/basket/
  Thin.svg  Light.svg  Regular.svg  Bold.svg
```

All three packages pick it up on the next build; no code changes needed. A
missing weight falls back to `regular`, so an incomplete set breaks nothing.

## Development

```bash
npm install
npm run core:build       # generate packages/core/assets/icons.json
npm run pkg:build        # generate and build the React package
npm run build            # both
npm run icons:optimize   # run SVGO over the icon folder
```

The parsing of names, weights and viewBox lives in one place —
`scripts/svg-source.mjs` — and both generators import it. These rules used to be
duplicated and drifted apart, so please do not start a third copy.

Design decisions and the reasoning behind them are in [CLAUDE.md](CLAUDE.md).

## Releasing

```bash
git tag v0.3.0 && git push --tags
```

The version from the tag is applied to all three packages, and they are published
to npm in dependency order. Requires the `NPM_TOKEN` secret.

## License

MIT — free to use, including commercially. If the library helps you out,
[support its development](https://github.com/sponsors/LuceviasIcons).
