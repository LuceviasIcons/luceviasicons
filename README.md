# Lucevias

Icon library: icons in a single grid, six weights, tree-shakeable React components.

**[Browse the catalog →](https://luceviasicons.com)**



## Install

```bash
npm i lucevias
```

```jsx
import { BoundingBox } from 'lucevias'

<BoundingBox size={32} />
```

Full API in [packages/icons/README.md](packages/icons/README.md).

## Packages

| Package | Contents | Who installs it |
| --- | --- | --- |
| [`@lucevias/core`](packages/core) | Raw SVGs and `icons.json` metadata | The catalog site, and anyone building their own bindings |
| [`lucevias`](packages/icons) | React components generated from those SVGs | Application developers |
| [`@lucevias/mcp`](packages/mcp) | MCP server over the same metadata | Anyone writing code with an AI agent |

All three are published from this repository under the same version.

## Using it with an AI agent

The icon set plugs into Claude Code, Cursor, Claude Desktop and any other MCP
client, so the agent picks icons from the real set instead of guessing names:

```bash
claude mcp add lucevias -- npx -y @lucevias/mcp
```

Configs for the other clients are in [packages/mcp](packages/mcp).

## Repository layout

```
packages/core/svg/     icons — the single source of truth
packages/core/         @lucevias/core (raw SVGs + generated icons.json)
packages/icons/        lucevias (React components, generated — not committed)
packages/mcp/          @lucevias/mcp (MCP server for AI agents)
scripts/               svg-source.mjs (shared parsing) + both generators
```

Adding an icon means dropping an `.svg` into `packages/core/svg/`. Both packages
pick it up on the next build — no code changes needed.

## Development

```bash
npm install
npm run core:build       # generate packages/core/assets/icons.json
npm run pkg:build        # generate and build the React package
npm run build            # both
npm run icons:optimize   # run SVGO over the icon folder
```

## Releasing

```bash
git tag v0.2.0 && git push --tags
```

The tag version is applied to both packages and both are published to npm.
Requires the `NPM_TOKEN` secret.

## License

MIT — free to use, including commercially.
