# lucevias

React components for the [Lucevias](https://luceviasicons.com) icon set — a
growing open-source library drawn on a single 24×24 grid, in four weights.

**[Browse the catalog →](https://luceviasicons.com)**

> **Not published to npm yet** — the first release is coming.
> Until then the set can be used from the [catalog](https://luceviasicons.com),
> the Figma plugin, or by cloning this repository.

```bash
npm i lucevias
```

`react >= 18` is required as a peer dependency.

## Usage

```jsx
import { Basket } from 'lucevias'

<Basket size={24} />
```

Every icon is a component named after the icon in PascalCase: `address-book`
becomes `AddressBook`, `basket` becomes `Basket`. The catalog shows the exact
name for each one.

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
container — for the common case no prop is needed at all:

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

A weight that has not been drawn yet falls back to `regular` rather than
rendering nothing.

## Tree-shaking

Importing one icon costs about **9 KB**, not the whole library. Every component
is marked `/* #__PURE__ */`, without which a bundler treats the `forwardRef`
call as a side effect and keeps all of them — the difference between 9 KB and
185 KB.

Nothing to configure: any modern bundler (Vite, webpack 5, Rollup, esbuild)
drops the unused ones on its own.

## Name collisions

Component names carry no `Icon` suffix, so a few of them — `Anchor`, `Article`,
`Circle` — clash with same-named imports from libraries like react-native-svg or
recharts. JSX itself is fine (lowercase `<article>` differs by case); rename on
import when it comes up:

```jsx
import { Circle as CircleIcon } from 'lucevias'
```

## Elsewhere

- **[@lucevias/core](https://www.npmjs.com/package/@lucevias/core)** — raw SVGs
  and metadata, for your own bindings
- **[@lucevias/mcp](https://www.npmjs.com/package/@lucevias/mcp)** — an MCP
  server, so AI agents pick icons from the real set
- **Lucevias Icons** — the Figma plugin

## License

MIT — free to use, including commercially. If the library helps you out,
[support its development](https://github.com/sponsors/LuceviasIcons).
