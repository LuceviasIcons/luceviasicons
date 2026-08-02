/**
 * Разбор папки `packages/core/svg` — единственное место, где живёт эта логика.
 *
 * Ей пользуются оба генератора: метаданные `@lucevias/core` и React-компоненты
 * пакета `lucevias`. Раньше правила имён были продублированы в каждом из них и
 * расходились при первой же правке.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const WEIGHTS = ['thin', 'light', 'regular', 'bold', 'fill', 'duotone']

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const SVG_DIR = join(ROOT, 'packages/core/svg')

export const DEFAULT_VIEW_BOX = '0 0 256 256'

/** Внутренности <svg> без обёртки, комментариев и xml-пролога. */
export function innerSvg(source) {
  const match = source.match(/<svg[^>]*>([\s\S]*)<\/svg>/i)
  return (match ? match[1] : source)
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()
}

/** viewBox исходника — иконки бывают нарисованы не в 256×256. */
export const viewBoxOf = (source) =>
  source.match(/<svg[^>]*\sviewBox="([^"]+)"/i)?.[1]?.trim() ?? DEFAULT_VIEW_BOX

/** Красим в currentColor, чтобы работал проп color. */
export const normalizeColors = (markup) =>
  markup.replace(/(fill|stroke)="((?!none|currentColor)[^"]*)"/gi, '$1="currentColor"')

export const pascal = (name) =>
  name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')

/**
 * Имя React-компонента: `address-book` → `AddressBookIcon`.
 *
 * Суффикс обязателен — без него имена вроде `Link`, `Image` или `Text`
 * сталкиваются с элементами DOM и компонентами роутеров прямо в импортах.
 * Сниппеты на сайте собирают имя по этому же правилу.
 */
export const componentName = (name) => `${pascal(name)}Icon`

/**
 * Разбирает путь файла в пару «имя иконки + вес».
 * Вес задаётся суффиксом (`bell-bold.svg`, `bell.bold.svg`) или папкой (`bold/bell.svg`).
 */
export function parsePath(relPath) {
  const segments = relPath.replace(/\.svg$/i, '').split(sep)
  const file = segments.pop()
  const folderWeight = segments.map((s) => s.toLowerCase()).find((s) => WEIGHTS.includes(s))

  const suffix = file.match(/[.-]([a-z]+)$/i)?.[1]?.toLowerCase()
  const fileWeight = suffix && WEIGHTS.includes(suffix) ? suffix : undefined
  const name = fileWeight ? file.slice(0, file.length - suffix.length - 1) : file

  return { name, weight: fileWeight ?? folderWeight ?? 'regular' }
}

/** Рекурсивный обход папки: веса могут лежать во вложенных директориях. */
function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.name.toLowerCase().endsWith('.svg')) out.push(full)
  }
  return out
}

/**
 * Собирает иконки из папки: `[{ name, viewBox, variants }]`, отсортированные по имени.
 * `variants` — разметка без обёртки <svg>, покрашенная в currentColor.
 */
export function collectIcons() {
  const files = walk(SVG_DIR)
  if (files.length === 0) {
    console.error('Нет ни одного SVG в packages/core/svg — нечего собирать.')
    process.exit(1)
  }

  const icons = new Map()
  for (const full of files) {
    const source = readFileSync(full, 'utf8')
    const { name, weight } = parsePath(relative(SVG_DIR, full))
    const markup = normalizeColors(innerSvg(source))
    if (!markup) continue

    const entry = icons.get(name) ?? { name, variants: {}, viewBox: viewBoxOf(source) }
    entry.variants[weight] = markup
    // сетку берём из regular, иначе остаётся от первого попавшегося веса
    if (weight === 'regular') entry.viewBox = viewBoxOf(source)
    icons.set(name, entry)
  }

  return [...icons.values()]
    .filter((icon) => Object.keys(icon.variants).length > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
}
