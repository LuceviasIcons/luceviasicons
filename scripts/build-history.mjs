/**
 * Ведёт `packages/core/history.json` — в какой версии иконка появилась и в
 * какой её разметку правили последний раз.
 *
 * Зачем: статусы «новая» и «обновлена» на сайте раньше считались от снимка в
 * localStorage у каждого посетителя. Это давало метки, которые у всех разные
 * и требуют кнопки «отметить просмотренным». Привязка к версии делает статус
 * свойством релиза: иконка, добавленная в 1.0, помечена новой до выхода 1.1,
 * и так для всех одинаково.
 *
 * Файл дописывается, а не пересобирается: версия появления — исторический
 * факт, его нельзя пересчитать из текущей папки. Поэтому history.json лежит
 * в гите рядом с иконками.
 *
 * Запуск: входит в `npm run core:build`, отдельно — `npm run history:build`.
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { collectIcons, ROOT } from './svg-source.mjs'

const HISTORY = join(ROOT, 'packages/core/history.json')

/** Отпечаток разметки: по нему видно, что иконку перерисовали. */
function fingerprint(variants) {
  const body = Object.keys(variants)
    .sort()
    .map((w) => `${w}:${variants[w]}`)
    .join('|')
  return createHash('sha1').update(body).digest('hex').slice(0, 12)
}

const version = JSON.parse(
  readFileSync(join(ROOT, 'packages/core/package.json'), 'utf8'),
).version

let history = {}
let firstRun = false
try {
  history = JSON.parse(readFileSync(HISTORY, 'utf8'))
} catch {
  firstRun = true
}

/*
 * На первом запуске истории нет, и всё, что лежит в папке, накопилось за
 * прошлые релизы. Записываем такой набор особой версией `0`: это значит
 * «было всегда». Проставь мы текущую версию — весь каталог загорелся бы
 * зелёным, хотя новых иконок в релизе нет.
 */
const BASELINE = '0'

const icons = collectIcons()
let added = 0
let changed = 0

for (const { name, variants } of icons) {
  const hash = fingerprint(variants)
  const known = history[name]

  if (!known) {
    const v = firstRun ? BASELINE : version
    // added — версия появления, changed — версия последней правки разметки
    history[name] = { added: v, changed: v, hash }
    if (!firstRun) added++
  } else if (known.hash !== hash) {
    known.changed = version
    known.hash = hash
    changed++
  }
}

/*
 * Удалённые иконки из истории не вычищаются. Имя может вернуться, и тогда
 * важно знать, что оно уже было: иначе иконка второй раз загорится новой.
 */

// ключи сортируются: иначе диффы файла шумят перестановками
const sorted = Object.fromEntries(Object.keys(history).sort().map((k) => [k, history[k]]))
writeFileSync(HISTORY, `${JSON.stringify(sorted, null, 2)}\n`)

console.log(
  `История ${version}: +${added} новых, ~${changed} изменённых, всего ${Object.keys(sorted).length}`,
)
