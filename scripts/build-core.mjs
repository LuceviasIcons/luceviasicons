/**
 * Собирает метаданные пакета `@lucevias/core`: `assets/icons.json`.
 *
 * Сами SVG публикуются как есть — они и есть источник истины. JSON нужен
 * потребителям (в первую очередь сайту-каталогу), чтобы получить список иконок
 * с готовой разметкой одним импортом, не обходя папку и не повторяя правила
 * разбора имён файлов.
 *
 * Запуск: `npm run core:build`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { collectIcons, ROOT } from './svg-source.mjs'

const OUT = join(ROOT, 'packages/core/assets')

const icons = collectIcons()

/**
 * Теги для поиска: необязательный `packages/core/tags.json` вида
 * { "имя-иконки": ["tag", "синоним"] }. Нет файла — иконки просто без тегов.
 */
let tags = {}
try {
  tags = JSON.parse(readFileSync(join(ROOT, 'packages/core/tags.json'), 'utf8'))
} catch {
  // файла нет — это норма
}

/**
 * История версий из `packages/core/history.json` (её ведёт build-history.mjs).
 * По ней сайт показывает «новая» и «обновлена»: статус живёт в релизе, а не
 * в localStorage посетителя, поэтому одинаков для всех.
 */
let history = {}
try {
  history = JSON.parse(readFileSync(join(ROOT, 'packages/core/history.json'), 'utf8'))
} catch {
  // истории ещё нет — иконки поедут без пометок о версиях
}

const payload = {
  version: JSON.parse(readFileSync(join(ROOT, 'packages/core/package.json'), 'utf8')).version,
  icons: icons.map(({ name, viewBox, variants }) => ({
    name,
    viewBox,
    tags: tags[name] ?? [],
    // версия появления и версия последней правки разметки
    added: history[name]?.added,
    changed: history[name]?.changed,
    variants,
  })),
}

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'icons.json'), JSON.stringify(payload))

console.log(`@lucevias/core: ${icons.length} иконок → packages/core/assets/icons.json`)
