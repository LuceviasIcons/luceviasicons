# @lucevias/core

Raw SVG assets and metadata for [LUCEVIAS](https://luceviasicons.com) — the source
of truth every other LUCEVIAS package is generated from.

Most applications want [`lucevias`](https://www.npmjs.com/package/lucevias)
(React components) instead. Install this package if you are building your own
bindings, a catalog, or a design-tool plugin.

```bash
npm i @lucevias/core
```

## Metadata

```js
import { icons, version } from '@lucevias/core/icons.json'

icons[0]
// {
//   name: 'align-bottom',
//   viewBox: '0 0 24 24',
//   tags: [],
//   variants: { regular: '<path … />' }
// }
```

`variants` holds the markup *inside* `<svg>` — you supply your own wrapper and
`viewBox`. Strokes and fills are already normalized to `currentColor`, so the
icon inherits its color from the surrounding element.

Weights: `thin`, `light`, `regular`, `bold`, `fill`, `duotone`. Only the weights
that actually have a file are present; fall back to `regular` when one is missing.

## Raw files

The `.svg` files ship as-is and can be imported by path:

```js
import bell from '@lucevias/core/svg/bell.svg'
```

## License

MIT
