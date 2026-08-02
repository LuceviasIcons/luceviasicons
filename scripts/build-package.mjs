/**
 * Собирает npm-пакет `lucevias`: React-компонент на каждую иконку плюс index
 * с реэкспортами.
 *
 * Источник — `packages/core/svg` через общий разбор в `svg-source.mjs`: пакет
 * и метаданные `@lucevias/core` растут из одних и тех же файлов.
 *
 * Запуск: `npm run pkg:generate`.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { collectIcons, pascal, ROOT, WEIGHTS } from './svg-source.mjs'

const SRC = join(ROOT, 'packages/icons/src')

/** kebab-атрибуты → camelCase для JSX. */
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

// --- базовый компонент --------------------------------------------------

writeFileSync(
  join(SRC, 'Icon.tsx'),
  `import { forwardRef, type SVGProps } from 'react'

export type Weight = ${WEIGHTS.map((w) => `'${w}'`).join(' | ')}

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'color'> & {
  /** Размер стороны в пикселях. */
  size?: number | string
  /** Цвет обводки/заливки. По умолчанию наследуется от родителя. */
  color?: string
  /** Начертание. Отсутствующий вес откатывается на regular. */
  weight?: Weight
}

type BaseProps = IconProps & {
  viewBox: string
  variants: Partial<Record<Weight, React.ReactNode>> & { regular: React.ReactNode }
}

/** Общая обёртка: все иконки пакета рендерятся через неё. */
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

// --- по компоненту на иконку -------------------------------------------

for (const { name, variants, viewBox } of icons) {
  const component = pascal(name)
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
 * \`#__PURE__\` обязателен: без него бандлер считает вызов forwardRef побочным
 * эффектом и тащит в сборку все иконки пакета вместо одной импортированной.
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

${names.map((n) => `export { ${pascal(n)} } from './icons/${pascal(n)}'`).join('\n')}
`,
)

console.log(`Сгенерировано ${names.length} компонентов в packages/icons/src`)
