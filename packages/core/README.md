# @lucevias_icon/core

Raw SVG assets and metadata for [Lucevias](https://luceviasicons.com) — the
source of truth every other package in the set is generated from.

Most applications want [`lucevias`](https://www.npmjs.com/package/lucevias)
instead: it gives you React components. Install this one if you are building
your own bindings, a catalog, or a design-tool plugin.

> **Not published to npm yet** — the first release is coming.
> Until then the set can be used from the [catalog](https://luceviasicons.com),
> the Figma plugin, or by cloning this repository.

```bash
npm i @lucevias_icon/core
```

## Metadata

```js
import icons from '@lucevias_icon/core/icons.json' with { type: 'json' }

icons.icons[0]
// {
//   name: 'acorn',
//   viewBox: '0 0 24 24',
//   category: 'Nature',
//   tags: ['autumn', 'nature', 'nut', 'oak'],
//   added: '0',        // '0' means "has always been here"
//   changed: '0',
//   variants: {
//     thin: '<path … />',
//     light: '<path … />',
//     regular: '<path … />',
//     bold: '<path … />'
//   }
// }
```

| Field | What it is |
| --- | --- |
| `name` | kebab-case identifier, unique across the set |
| `viewBox` | The icon's own grid — usually `0 0 24 24` |
| `category` | Exactly one per icon, for catalog filters |
| `tags` | Search synonyms: `basket` also answers to `cart` |
| `added` / `changed` | The day the icon appeared and was last redrawn |
| `variants` | Markup per weight |

The file itself also carries `version` and `latestDay` — the freshest date in
the set, which is what the catalog compares against to mark an icon as new.

### Rendering a variant

`variants` holds the markup *inside* `<svg>`, so you supply the wrapper and the
`viewBox`:

```js
const icon = icons.icons.find((i) => i.name === 'basket')

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" ` +
  `viewBox="${icon.viewBox}" fill="none">${icon.variants.regular}</svg>`
```

Strokes and fills are already normalized to `currentColor`, so the icon inherits
color from its container. Weights are `thin`, `light`, `regular` and `bold`;
only those actually drawn are present, so fall back to `regular` when one is
missing.

> **Note**
> `currentColor` is a CSS keyword. Tools that are not browsers — Figma, for
> instance — do not understand it and will drop such a stroke, so replace it with
> a literal color before handing the markup over.

## Raw files

The `.svg` files ship as they are, a folder per icon and a file per weight:

```
svg/basket/Thin.svg
svg/basket/Light.svg
svg/basket/Regular.svg
svg/basket/Bold.svg
```

```js
import basket from '@lucevias_icon/core/svg/basket/Regular.svg'
```

## License

MIT.
