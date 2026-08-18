# @lucevias_icon/mcp

An MCP server for the [Lucevias](https://luceviasicons.com) icon set. It lets an
AI agent in your editor find an icon by meaning and write code that compiles —
the right component name, the right import, the right props.

Without it the agent guesses names from memory and produces imports of icons that
do not exist.

> **Not published to npm yet** — the first release is coming, and the `npx`
> command below starts working the moment it lands.

## Connect

<details open>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add lucevias -- npx -y @lucevias_icon/mcp
```

</details>

<details>
<summary><b>Cursor</b></summary>

`.cursor/mcp.json` in the project, or `~/.cursor/mcp.json` for all projects:

```json
{
  "mcpServers": {
    "lucevias": {
      "command": "npx",
      "args": ["-y", "@lucevias_icon/mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Claude Desktop</b></summary>

`claude_desktop_config.json` (Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "lucevias": {
      "command": "npx",
      "args": ["-y", "@lucevias_icon/mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>VS Code (Copilot)</b></summary>

`.vscode/mcp.json`:

```json
{
  "servers": {
    "lucevias": {
      "command": "npx",
      "args": ["-y", "@lucevias_icon/mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Windsurf, Zed and other clients</b></summary>

Any client that speaks MCP over stdio runs the same command:

```
npx -y @lucevias_icon/mcp
```

</details>

## What it can do

| Tool | What it is for |
| --- | --- |
| `search_icons` | Find icons by name and tags. Returns exact names, without markup. |
| `get_icon` | One icon by name: React, HTML and raw SVG, in any weight and size. |
| `list_categories` | The categories of the set with counts — when a whole group is needed. |

Ask in your own words:

> add a basket icon to the header

The agent calls `search_icons`, gets `basket`, then `get_icon`, and writes:

```jsx
import { Basket } from 'lucevias'

<Basket size={24} />
```

## Why the tools are split

`search_icons` returns names, categories and tags **without markup**: the four
weights of an icon are a few kilobytes, and a list of twenty would eat the agent
context for nothing. The markup is served by `get_icon`, one icon at a time.

A wrong name is answered rather than refused. On a typo (`basekt`) the server
replies with `did_you_mean: ["basket"]`; when there is no such icon at all
(`shopping-cart`), it suggests what does exist — `bag`, `basket`.

## The data

The set comes from `@lucevias_icon/core` — the same `icons.json` the catalog site and
the Figma plugin read. There is no second copy: an icon added to
`packages/core/svg` reaches the agent with the next release of core.

## License

MIT.
