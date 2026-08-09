# LUCEVIAS

Icons on a single grid. Six weights, tree-shakeable React components.

The catalog with every icon and ready-made snippets: **[open the site](https://luceviasicons.github.io/luceviasicons/)**

## Install

```bash
npm i lucevias
```

`react >= 18` is required as a peer dependency.

## Usage

```jsx
import { BoundingBox } from 'lucevias'

<BoundingBox size={32} />
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `size` | `number \| string` | `24` | Side in pixels |
| `color` | `string` | `currentColor` | Color; inherited from the parent by default |
| `weight` | `'thin' \| 'light' \| 'regular' \| 'bold' \| 'fill' \| 'duotone'` | `'regular'` | Weight |

The remaining props go to `<svg>`, so `className`, `onClick`, `aria-*` and `ref` all work.

```jsx
// the color is inherited from the parent
<span style={{ color: 'tomato' }}>
  <BoundingBox size={20} />
</span>
```

## Weight

Weights other than `regular` are available only if a file of that weight sits next
to the icon (`bounding-box-bold.svg`). A missing weight silently falls back to `regular`.

## License

MIT — use it freely, including in commercial projects.
If the library helps you out, [support its development](https://github.com/sponsors/LuceviasIcons).
