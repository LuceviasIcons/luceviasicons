# Security

## Reporting a vulnerability

Please report privately through
[GitHub Security Advisories](https://github.com/LuceviasIcons/luceviasicons/security/advisories/new),
not as a public issue.

Expect a first reply within a few days. This is a small project maintained by
one person, so please allow reasonable time before disclosing publicly.

## Scope

What is worth reporting:

- **`@lucevias/mcp`** — the server runs on a developer's machine and reads a
  file over the network. Anything that turns that into code execution or into
  reading files it should not.
- **The packages** — a supply-chain problem: a build step, a dependency, or
  markup that behaves differently from what the source suggests.
- **The Figma plugin** — it fetches the icon set at runtime; anything that lets
  that fetch reach the document or the user's data.

## The icon markup

Icons ship as raw SVG. The set is drawn in-house and nothing user-supplied ever
enters it, so the markup is trusted by construction.

If you render **user-uploaded** SVG in your own application, sanitize it —
DOMPurify, or parsing the paths into a structure. That is true of any SVG, not
of this set in particular, but it is the mistake an icon library most often
gets blamed for.
