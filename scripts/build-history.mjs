/**
 * Ведёт `packages/core/history.json` — в какой день иконка появилась и когда
 * её разметку правили последний раз.
 *
 * Зачем: статусы «новая» и «обновлена» на сайте раньше считались от снимка в
 * localStorage у каждого посетителя. Метки получались личными и требовали
 * кнопки «отметить просмотренным». Привязка к дате делает статус свойством
 * набора: он одинаков у всех и гаснет сам.
 *
 * Почему дата, а не версия пакета. Версия поднимается только на релизе, а
 * иконки заливаются партиями по несколько раз в неделю. Пока версия стояла
 * на месте, метки не гасли, а копились: к четвёртой партии «новыми» висели
 * 349 иконок из 686 — то есть половина каталога, что не значит ничего.
 * Дата же меняется сама собой, и партия предыдущего дня гаснет без релиза,
 * тега и ручных действий.
 *
 * Файл дописывается, а не пересобирается: день появления — исторический
 * факт, из текущей папки его не вычислить. Поэтому history.json лежит
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

/** Сегодняшний день в UTC, `YYYY-MM-DD`: этим помечается новая партия. */
const today = new Date().toISOString().slice(0, 10)

let history = {}
let firstRun = false
try {
  history = JSON.parse(readFileSync(HISTORY, 'utf8'))
} catch {
  firstRun = true
}

/*
 * На первом запуске истории нет, и всё, что лежит в папке, накопилось
 * раньше. Записываем такой набор особой датой `0`: это значит «было
 * всегда». Проставь мы сегодняшний день — весь каталог загорелся бы
 * зелёным, хотя ничего не добавляли.
 */
const BASELINE = '0'

const icons = collectIcons()
let added = 0
let changed = 0

for (const { name, variants } of icons) {
  const hash = fingerprint(variants)
  const known = history[name]

  if (!known) {
    const day = firstRun ? BASELINE : today
    // added — день появления, changed — день последней правки разметки
    history[name] = { added: day, changed: day, hash }
    if (!firstRun) added++
  } else if (known.hash !== hash) {
    known.changed = today
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
  `История ${today}: +${added} новых, ~${changed} изменённых, всего ${Object.keys(sorted).length}`,
)
