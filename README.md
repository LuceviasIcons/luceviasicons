<div align="center">

<!--
  The wordmark is an image, not a heading: GitHub strips CSS from a README, so a
  custom font cannot be applied to text. Two files because a README is read in
  both themes — picture/source swaps them by prefers-color-scheme.
-->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/logo-dark.svg">
  <img src=".github/assets/logo-light.svg" alt="LuceviasIcons" width="300">
</picture>

<br>
<br>

**A growing open-source icon library on a single 24×24 grid.**

Four weights · tree-shakeable React components · MIT

<br>

[**Browse the catalog →**](https://luceviasicons.com)

<br>

<!--
  The npm badge comes back with the first release: while the package is not
  published shields.io renders a red "package not found", which reads as a
  broken project rather than an unreleased one.
-->
[![one icon](https://img.shields.io/badge/one%20icon-~9%20KB-black)](#tree-shaking)
[![weights](https://img.shields.io/badge/weights-4-black)](#weights)
[![license](https://img.shields.io/badge/license-MIT-black)](LICENSE)

</div>

<br>

---

## Install

> **The packages are not on npm yet** — the first release is coming. Until then
> the whole set can be downloaded from the
> [catalog](https://luceviasicons.com), or used through the Figma plugin and the
> MCP server below.

```bash
npm i lucevias
```

```jsx
import { Basket } from 'lucevias'

<Basket size={24} />
```

Every icon is a component named after the icon in PascalCase — `address-book`
becomes `AddressBook`. The catalog shows the exact name for each one.

<br>

## Usage

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `number \| string` | `24` | Side of the square, in pixels |
| `color` | `string` | `currentColor` | Stroke and fill color |
| `weight` | `'thin' \| 'light' \| 'regular' \| 'bold'` | `'regular'` | Line weight |

Anything else is forwarded to the `<svg>` element, so `className`, `onClick`,
`aria-label`, `ref` and the rest work as expected.

### Color follows the text

Icons are painted in `currentColor`, so they inherit the color of their
container — no prop needed for the common case:

```jsx
<button className="text-red-500">
  <Basket size={20} />
  Remove
</button>
```

### Weights

```jsx
<Basket weight="thin" />
<Basket weight="light" />
<Basket />              {/* regular */}
<Basket weight="bold" />
```

A weight that has not been drawn yet falls back to `regular` instead of
rendering nothing.

<br>

## Use it with an AI agent

Ask for an icon in your own words and the agent writes the import for you —
picking from the real library instead of inventing a name that does not exist.

```bash
claude mcp add lucevias -- npx -y @lucevias/mcp
```

> **You:** add a basket icon to the header
>
> **Agent:** *searches the set, finds `basket`, writes:*
> ```jsx
> import { Basket } from 'lucevias'
>
> <Basket size={24} />
> ```

An [MCP](https://modelcontextprotocol.io) server ships with the set and gives
the agent three tools:

| Tool | What it does |
| --- | --- |
| `search_icons` | Finds icons by name and tags — returns the names that exist |
| `get_icon` | Returns one icon: React, HTML and raw SVG, in any weight and size |
| `list_categories` | Lists the categories, for when a whole group is needed |

A wrong name is answered rather than refused: a typo (`basekt`) comes back with
`did_you_mean: ["basket"]`, and a name that is not in the set at all
(`shopping-cart`) comes back with what is — `bag`, `basket`.

The server reads the same metadata as everything else here, so an icon added to
the set is available to the agent with the next release.

<details>
<summary>Cursor, Claude Desktop, VS Code and other clients</summary>

<br>

Any MCP client runs the same command. For the config-file ones:

```json
{
  "mcpServers": {
    "lucevias": {
      "command": "npx",
      "args": ["-y", "@lucevias/mcp"]
    }
  }
}
```

- **Cursor** — `.cursor/mcp.json` in the project, or `~/.cursor/mcp.json` globally
- **Claude Desktop** — `claude_desktop_config.json` (Settings → Developer → Edit Config)
- **VS Code** — `.vscode/mcp.json`, with `servers` instead of `mcpServers`

Full documentation in [packages/mcp](packages/mcp).

</details>

<br>

## Use it in Figma

The **Lucevias Icons** plugin puts the same set inside Figma: search, filter by
category, switch the weight, click to insert as an editable vector.

It reads the icons straight from this repository, so new ones appear in the
plugin as soon as they are drawn — no plugin update required.

<br>

## Beyond React

<table>
<tr><td>

**Raw SVG and metadata**

```bash
npm i @lucevias/core
```

```js
import { icons } from '@lucevias/core/icons.json'
```

For custom bindings, your own catalog, or a design-tool plugin.
See [packages/core](packages/core).

</td><td>

**A single file**

Every icon can also be copied straight from the
[catalog](https://luceviasicons.com) as SVG, PNG or JSX — or the whole set
downloaded as a zip.

</td></tr>
</table>

<br>

## Packages

| Package | Contents | Who installs it |
| --- | --- | --- |
| [`lucevias`](packages/icons) | React components generated from the SVGs | Application developers |
| [`@lucevias/core`](packages/core) | Raw SVGs and `icons.json` metadata | Custom bindings, catalogs, plugins |
| [`@lucevias/mcp`](packages/mcp) | MCP server over the same metadata | Anyone coding with an AI agent |

All three are published from this repository under one version.

<br>

## Tree-shaking

Importing one icon costs about **9 KB**, not the whole library. Every generated
component is marked `/* #__PURE__ */` — without it a bundler treats the
`forwardRef` call as a side effect and keeps all of them, which is the
difference between 9 KB and 185 KB.

Nothing to configure: any modern bundler (Vite, webpack 5, Rollup, esbuild)
drops the unused ones on its own.

<br>

## Contributing

Icons live in `packages/core/svg/` — a folder per icon, a file per weight:

```
packages/core/svg/basket/
  Thin.svg  Light.svg  Regular.svg  Bold.svg
```

Drop an `.svg` in and every package picks it up on the next build; no code
changes needed. Files are expected on a 24×24 grid, with strokes that the build
normalizes to `currentColor`.

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

The reasoning behind each decision is kept in the comments next to the code
rather than in a separate document, so it stays true when the code changes.

<br>

## Releasing

```bash
git tag v0.3.0 && git push --tags
```

The version from the tag is applied to all three packages, which are published to
npm in dependency order. Requires the `NPM_TOKEN` secret.

<br>

---

<div align="center">

**MIT** — free to use, including commercially.

If the library helps you out, [support its development](https://github.com/sponsors/LuceviasIcons).

</div>
