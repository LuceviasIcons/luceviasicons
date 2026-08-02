import type { IconDef, Weight } from './types'
import { WEIGHTS } from './types'

/**
 * Загрузка иконок из `packages/icons/svg/` — единого источника для пакета и сайта.
 *
 * Файлы подхватываются автоматически при сборке — достаточно положить SVG в папку.
 * Имя файла задаёт имя иконки и вес:
 *
 *   bell.svg            → иконка `bell`, вес regular
 *   bell-bold.svg       → иконка `bell`, вес bold
 *   bell.duotone.svg    → иконка `bell`, вес duotone
 *   bold/bell.svg       → иконка `bell`, вес bold (вес папкой)
 *
 * Веса без своего файла откатываются на regular.
 */

// eager + raw: содержимое файлов попадает в бандл строками на этапе сборки
const FILES = import.meta.glob('../../packages/icons/svg/**/*.svg', { eager: true, query: '?raw', import: 'default' })

/**
 * Теги для поиска и вкладки Tags. Необязательный файл `src/icons/tags.json`
 * вида { "имя-иконки": ["tag", "синоним"] }. Нет файла — иконки просто без
 * тегов, ничего не ломается.
 */
const TAG_FILES = import.meta.glob('./tags.json', { eager: true, import: 'default' })

const TAGS: Record<string, string[]> = Object.values(TAG_FILES)[0] as Record<string, string[]> ?? {}

const WEIGHT_SET = new Set<string>(WEIGHTS)

/** viewBox исходного файла — иконки бывают нарисованы не в 256×256. */
function parseViewBox(source: string): string | undefined {
  return source.match(/<svg[^>]*\sviewBox="([^"]+)"/i)?.[1]?.trim()
}

/** Достаёт внутренности <svg>…</svg>: рендер подставляет свою обёртку с viewBox. */
function stripSvgWrapper(source: string): string {
  const match = source.match(/<svg[^>]*>([\s\S]*)<\/svg>/i)
  const inner = match ? match[1] : source
  return inner
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()
}

/**
 * Красит разметку в currentColor, чтобы работал выбор цвета в интерфейсе.
 * Значения `none` и уже проставленный currentColor не трогаем.
 */
function normalizeColors(markup: string): string {
  return markup.replace(/(fill|stroke)="((?!none|currentColor)[^"]*)"/gi, '$1="currentColor"')
}

/** Разбирает путь файла в пару «имя иконки + вес». */
function parsePath(path: string): { name: string; weight: Weight } {
  const segments = path.replace('../../packages/icons/svg/', '').replace(/\.svg$/i, '').split('/')
  const file = segments.pop() as string
  // вес может быть задан папкой: svg/bold/bell.svg
  const folderWeight = segments.find((s) => WEIGHT_SET.has(s.toLowerCase()))

  // …либо суффиксом файла: bell-bold.svg / bell.bold.svg
  const suffix = file.match(/[.-]([a-z]+)$/i)?.[1]?.toLowerCase()
  const fileWeight = suffix && WEIGHT_SET.has(suffix) ? suffix : undefined
  const name = fileWeight ? file.slice(0, file.length - suffix!.length - 1) : file

  // имя файла сохраняем как есть — в каталоге показывается оригинальное название
  return {
    name,
    weight: ((fileWeight ?? folderWeight ?? 'regular') as Weight),
  }
}

/**
 * Собирает иконки из папки. Пустой массив — значит папка пуста,
 * и вызывающий код показывает плейсхолдеры.
 */
export function loadIconsFromFolder(): IconDef[] {
  const byName = new Map<string, Partial<Record<Weight, string>>>()
  const viewBoxes = new Map<string, string>()

  for (const [path, source] of Object.entries(FILES)) {
    if (typeof source !== 'string') continue
    const { name, weight } = parsePath(path)
    const markup = normalizeColors(stripSvgWrapper(source))
    if (!markup) continue

    const variants = byName.get(name) ?? {}
    variants[weight] = markup
    byName.set(name, variants)

    // сетку берём из regular, иначе из первого попавшегося веса
    const viewBox = parseViewBox(source)
    if (viewBox && (weight === 'regular' || !viewBoxes.has(name))) {
      viewBoxes.set(name, viewBox)
    }
  }

  const icons: IconDef[] = []

  for (const [name, variants] of byName) {
    // regular обязателен по типу — если его нет, берём любой доступный вес
    const regular = variants.regular ?? WEIGHTS.map((w) => variants[w]).find(Boolean)
    if (!regular) continue

    icons.push({
      name,
      // оригинальное название файла, без переименования в Title Case
      title: name,
      tags: TAGS[name] ?? [],
      variants: { ...variants, regular },
      viewBox: viewBoxes.get(name),
    })
  }

  return icons.sort((a, b) => a.name.localeCompare(b.name))
}
