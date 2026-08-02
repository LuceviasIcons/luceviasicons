import type { RenderOpts } from './render'
import type { IconDef } from './types'

/**
 * Сниппеты использования иконки — то, что показывают вкладки в карточке.
 *
 * Показываем ровно то, что человек вставит в свой код после подключения
 * библиотеки: одна строка, а не полотно SVG. Инструкция по установке живёт
 * рядом с вкладками, в карточке.
 *
 * Чтобы добавить платформу — дописать элемент в TARGETS, UI ничего про
 * конкретные цели не знает.
 */

export type SnippetTarget = {
  id: string
  label: string
  /** Как ставится библиотека для этой платформы. */
  install: string
  build: (icon: IconDef, opts: RenderOpts) => string
}

/** Имя пакета. Одно место на весь проект: и сниппеты, и README. */
export const PACKAGE_NAME = 'lucevias'

const pascal = (name: string) =>
  name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')

/** Веса кроме regular передаются явно; regular — значение по умолчанию. */
const weightProp = (opts: RenderOpts, syntax: 'jsx' | 'vue' | 'html') => {
  if (opts.weight === 'regular') return ''
  return syntax === 'html' ? ` data-weight="${opts.weight}"` : ` weight="${opts.weight}"`
}

export const TARGETS: SnippetTarget[] = [
  {
    id: 'react',
    label: 'React',
    install: `npm i ${PACKAGE_NAME}`,
    build: (icon, opts) =>
      `<${pascal(icon.name)} size={${opts.size}}${weightProp(opts, 'jsx')} />`,
  },
  {
    id: 'web',
    label: 'Web',
    install: `<script src="https://unpkg.com/${PACKAGE_NAME}"></script>`,
    build: (icon, opts) =>
      `<i data-icon="${icon.name}" data-size="${opts.size}"${weightProp(opts, 'html')}></i>`,
  },
  {
    id: 'vue',
    label: 'Vue',
    install: `npm i ${PACKAGE_NAME}-vue`,
    build: (icon, opts) =>
      `<${pascal(icon.name)} :size="${opts.size}"${weightProp(opts, 'vue')} />`,
  },
  {
    id: 'flutter',
    label: 'Flutter',
    install: `flutter pub add ${PACKAGE_NAME}`,
    build: (icon, opts) =>
      `Icon(Lucevias.${pascal(icon.name).charAt(0).toLowerCase() + pascal(icon.name).slice(1)}, size: ${opts.size})`,
  },
  {
    id: 'elm',
    label: 'Elm',
    install: `elm install LuceviasIcons/lucevias`,
    build: (icon, opts) =>
      `Icons.${pascal(icon.name)}.view ${opts.size} "${opts.color}"`,
  },
  {
    id: 'swift',
    label: 'Swift',
    install: `.package(url: "https://github.com/LuceviasIcons/lucevias-swift", from: "1.0.0")`,
    build: (icon, opts) => `${pascal(icon.name)}Icon(size: ${opts.size})`,
  },
]

export function targetOf(id: string): SnippetTarget {
  return TARGETS.find((t) => t.id === id) ?? TARGETS[0]
}

/** Строка импорта — показывается над сниппетом использования. */
export function importLine(id: string, icon: IconDef): string | null {
  const component = pascal(icon.name)
  switch (id) {
    case 'react':
      return `import { ${component} } from '${PACKAGE_NAME}'`
    case 'vue':
      return `import { ${component} } from '${PACKAGE_NAME}-vue'`
    case 'elm':
      return `import Icons.${component}`
    case 'swift':
      return `import Lucevias`
    case 'flutter':
      return `import 'package:lucevias/lucevias.dart';`
    default:
      return null
  }
}

export function buildSnippet(id: string, icon: IconDef, opts: RenderOpts): string {
  return targetOf(id).build(icon, opts)
}
