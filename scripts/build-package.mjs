/**
 * Builds the `lucevias` npm package: a React component per icon plus an index
 * with re-exports.
 *
 * The source is `packages/core/svg` through the shared parsing in
 * `svg-source.mjs`: the package and the `@lucevias_icon/core` metadata grow from the same files.
 *
 * Run: `npm run pkg:generate`.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { collectIcons, componentName, ROOT, WEIGHTS } from './svg-source.mjs'

const SRC = join(ROOT, 'packages/icons/src')

/** kebab attributes → camelCase for JSX. */
const toJsxAttrs = (markup) =>
  markup
    .replace(/([a-z])-([a-z])/g, (m, a, b) =>
      /stroke|fill|clip|font|text|marker|stop|flood|paint/.test(m) ? a + b.toUpperCase() : m,
    )
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-dasharray=/g, 'strokeDasharray=')
    .replace(/fill-rule=/g, 'fillRule=')
    .replace(/clip-rule=/g, 'clipRule=')

const icons = collectIcons()

rmSync(SRC, { recursive: true, force: true })
mkdirSync(join(SRC, 'icons'), { recursive: true })

// --- base component -----------------------------------------------------

writeFileSync(
  join(SRC, 'Icon.tsx'),
  `import { forwardRef, type SVGProps } from 'react'

export type Weight = ${WEIGHTS.map((w) => `'${w}'`).join(' | ')}

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'color'> & {
  /** Side size in pixels. */
  size?: number | string
  /** Stroke/fill color. Inherited from the parent by default. */
  color?: string
  /** Weight. A missing one falls back to regular. */
  weight?: Weight
}

type BaseProps = IconProps & {
  viewBox: string
  variants: Partial<Record<Weight, React.ReactNode>> & { regular: React.ReactNode }
}

/** Shared wrapper: every icon in the package renders through it. */
export const IconBase = /* #__PURE__ */ forwardRef<SVGSVGElement, BaseProps>(function IconBase(
  { size = 24, color = 'currentColor', weight = 'regular', viewBox, variants, ...props },
  ref,
) {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      color={color}
      {...props}
    >
      {variants[weight] ?? variants.regular}
    </svg>
  )
})
`,
)

// --- one component per icon ---------------------------------------------

for (const { name, variants, viewBox } of icons) {
  const component = componentName(name)
  const entries = Object.entries(variants)
    .map(
      ([w, markup]) =>
        `  ${w}: (\n    <>\n      ${toJsxAttrs(markup).replace(/></g, '>\n      <')}\n    </>\n  ),`,
    )
    .join('\n')

  writeFileSync(
    join(SRC, 'icons', `${component}.tsx`),
    `import { forwardRef } from 'react'
import { IconBase, type IconProps } from '../Icon'

const variants = {
${entries}
}

/**
 * ${name}
 *
 * \`#__PURE__\` is mandatory: without it the bundler treats the forwardRef call
 * as a side effect and pulls every icon into the build instead of the imported one.
 */
export const ${component} = /* #__PURE__ */ forwardRef<SVGSVGElement, IconProps>(
  function ${component}(props, ref) {
    return <IconBase ref={ref} viewBox="${viewBox}" variants={variants} {...props} />
  },
)
`,
  )
}

// --- index --------------------------------------------------------------

const names = icons.map((i) => i.name)

writeFileSync(
  join(SRC, 'index.ts'),
  `export { IconBase } from './Icon'
export type { IconProps, Weight } from './Icon'

${names.map((n) => `export { ${componentName(n)} } from './icons/${componentName(n)}'`).join('\n')}
`,
)

console.log(`Generated ${names.length} components in packages/icons/src`)
