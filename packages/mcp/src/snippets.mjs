/**
 * Ready-to-paste code for an icon.
 *
 * The point of the server is not to hand the agent raw markup but to hand it
 * exactly what compiles: the right component name, the right import, the right
 * prop for the weight. Guessing all of that from a name is where an agent
 * usually goes wrong.
 */
export const PACKAGE_NAME = 'lucevias'

/**
 * React component name: `address-book` -> `AddressBook`, no suffix.
 *
 * Repeats `componentName` from `scripts/svg-source.mjs`, which generates the
 * package. Importing it is not an option: `scripts/` stays in the repository and
 * does not ship with the published package, so a relative path would break for
 * anyone installing @luceviasicons/mcp from npm.
 *
 * If the rule changes there, it has to change here too — otherwise the server
 * would hand out code that does not compile.
 */
export const componentName = (name) =>
  name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')

/** regular is the default, so it is not passed explicitly. */
const weightProp = (weight) => (weight && weight !== 'regular' ? ` weight="${weight}"` : '')

/**
 * A full SVG document from the markup of one weight.
 *
 * currentColor is kept: it is what makes the icon follow the text color, and it
 * is the reason the set can be recolored with plain CSS.
 */
export function toSvg(icon, { weight = 'regular', size = 24 } = {}) {
  const markup = icon.variants[weight] ?? icon.variants.regular
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="${icon.viewBox}" fill="none">${markup}</svg>`
  )
}

/** Snippets per platform, the same set of targets as the tabs on the site. */
export function snippets(icon, { weight = 'regular', size = 24 } = {}) {
  const component = componentName(icon.name)
  return {
    react: {
      install: `npm i ${PACKAGE_NAME}`,
      import: `import { ${component} } from '${PACKAGE_NAME}'`,
      usage: `<${component} size={${size}}${weightProp(weight)} />`,
    },
    html: {
      install: `<script src="https://unpkg.com/${PACKAGE_NAME}"></script>`,
      usage: `<i data-icon="${icon.name}" data-size="${size}"></i>`,
    },
    svg: {
      usage: toSvg(icon, { weight, size }),
    },
  }
}
