# LUCEVIAS

Icon library: 92 icons in a single grid, six weights, tree-shakeable React components.

**[Browse the catalog →](https://luceviasicons.github.io/luceviasicons/)**

## Install

```bash
npm i lucevias
```

```jsx
import { BoundingBox } from 'lucevias'

<BoundingBox size={32} />
```

Full API in [packages/icons/README.md](packages/icons/README.md).

## Repository layout

```
packages/icons/svg/    icons — the single source of truth
packages/icons/        npm package (components generated from the SVGs)
src/                   catalog site (Vite + React 19 + Tailwind v4)
scripts/               package generator, a11y check
```

Adding an icon means dropping an `.svg` into `packages/icons/svg/`. The site and
the package both pick it up on the next build — no code changes needed.

## Development

```bash
npm install
npm run dev              # catalog at localhost:5173
npm run build            # site
npm run pkg:build        # npm package
npm run icons:optimize   # run SVGO over the icon folder
npm run a11y             # axe-core against the running site
```

## Releasing

- **Site** deploys to GitHub Pages on every push to `main`.
- **Package** publishes to npm on a version tag: `git tag v0.1.0 && git push --tags`.
  Requires an `NPM_TOKEN` secret in the repository settings.

## License

MIT — free to use, including commercially.
