/**
 * Собирает npm-пакет с иконками из `packages/icons/svg/`.
 *
 * На каждый SVG генерируется React-компонент, плюс общий index с реэкспортами.
 * Запускается в CI перед публикацией: `node scripts/build-package.mjs`.
 *
 * Источник иконок один и тот же и для сайта, и для пакета — добавил файл в
 * папку, он появился в обоих местах.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SVG_DIR = join(ROOT, 'packages/icons/svg')
const OUT = join(ROOT, 'packages/icons')
const SRC = join(OUT, 'src')

const WEIGHTS = ['thin', 'light', 'regular', 'bold', 'fill', 'duotone']

const pascal = (name) =>
  name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')

/** Внутренности <svg> без обёртки, комментариев и xml-пролога. */
function innerSvg(source) {
  const match = source.match(/<svg[^>]*>([\s\S]*)<\/svg>/i)
  return (match ? match[1] : source)
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()
}

const viewBoxOf = (source) => source.match(/<svg[^>]*\sviewBox="([^"]+)"/i)?.[1]?.trim() ?? '0 0 256 256'

/** Красим в currentColor, чтобы работал проп color. */
const normalizeColors = (markup) =>
  markup.replace(/(fill|stroke)="((?!none|currentColor)[^"]*)"/gi, '$1="currentColor"')

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

/** Разбирает имя файла в пару «иконка + вес», как это делает сайт. */
function parseName(file) {
  const base = file.replace(/\.svg$/i, '')
  const suffix = base.match(/[.-]([a-z]+)$/i)?.[1]?.toLowerCase()
  const weight = suffix && WEIGHTS.includes(suffix) ? suffix : undefined
  return {
    name: weight ? base.slice(0, base.length - suffix.length - 1) : base,
    weight: weight ?? 'regular',
  }
}

// --- сбор ---------------------------------------------------------------

const files = readdirSync(SVG_DIR).filter((f) => f.toLowerCase().endsWith('.svg'))
if (files.length === 0) {
  console.error('Нет ни одного SVG в packages/icons/svg — нечего публиковать.')
  process.exit(1)
}

const icons = new Map()
for (const file of files) {
  const source = readFileSync(join(SVG_DIR, file), 'utf8')
  const { name, weight } = parseName(file)
  const entry = icons.get(name) ?? { variants: {}, viewBox: viewBoxOf(source) }
  entry.variants[weight] = toJsxAttrs(normalizeColors(innerSvg(source)))
  if (weight === 'regular') entry.viewBox = viewBoxOf(source)
  icons.set(name, entry)
}

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

const names = [...icons.keys()].sort()
for (const name of names) {
  const { variants, viewBox } = icons.get(name)
  const component = pascal(name)
  const entries = Object.entries(variants)
    .map(([w, markup]) => `  ${w}: (\n    <>\n      ${markup.replace(/></g, '>\n      <')}\n    </>\n  ),`)
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

writeFileSync(
  join(SRC, 'index.ts'),
  `export { IconBase } from './Icon'
export type { IconProps, Weight } from './Icon'

${names.map((n) => `export { ${pascal(n)} } from './icons/${pascal(n)}'`).join('\n')}
`,
)

console.log(`Сгенерировано ${names.length} компонентов в packages/icons/src`)
