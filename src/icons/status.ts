import type { IconDef, IconStatus } from './types'

/**
 * Статусы «новая / обновлена» без ручной разметки.
 *
 * При каждой загрузке снимаем отпечаток папки (имя иконки → хеш разметки всех
 * весов) и сравниваем с прошлым снимком из localStorage:
 *
 *   имени не было раньше          → new
 *   имя было, но разметка другая  → updated
 *   всё совпало                   → stable
 *
 * Первый визит базы не имеет — тогда всё считается stable, иначе вся библиотека
 * загорелась бы зелёным. Снимок перезаписывается только когда пользователь
 * нажал «Отметить просмотренным»: иначе метки исчезали бы после перезагрузки,
 * не успев попасться на глаза.
 */

const SNAPSHOT_KEY = 'icon-library:snapshot'

type Snapshot = Record<string, string>

/** Быстрый нечувствительный к коллизиям хеш (FNV-1a): нужен только для «изменилось/нет». */
function hash(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

/** Отпечаток текущей папки: все веса иконки в стабильном порядке. */
function fingerprint(icons: IconDef[]): Snapshot {
  const snapshot: Snapshot = {}
  for (const icon of icons) {
    const body = Object.keys(icon.variants)
      .sort()
      .map((w) => `${w}:${icon.variants[w as keyof typeof icon.variants]}`)
      .join('|')
    snapshot[icon.name] = hash(body)
  }
  return snapshot
}

function readSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    return raw ? (JSON.parse(raw) as Snapshot) : null
  } catch {
    // приватный режим / повреждённый JSON — просто работаем без истории
    return null
  }
}

/** Считает статусы всех иконок относительно прошлого снимка. */
export function computeStatuses(icons: IconDef[]): Record<string, IconStatus> {
  const current = fingerprint(icons)
  const previous = readSnapshot()
  const statuses: Record<string, IconStatus> = {}

  for (const name of Object.keys(current)) {
    if (!previous) statuses[name] = 'stable'
    else if (!(name in previous)) statuses[name] = 'new'
    else if (previous[name] !== current[name]) statuses[name] = 'updated'
    else statuses[name] = 'stable'
  }

  return statuses
}

/** Фиксирует текущее состояние как базу — метки гаснут до следующих правок. */
export function markAllSeen(icons: IconDef[]) {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(fingerprint(icons)))
  } catch {
    // запись недоступна — метки просто останутся видимыми
  }
}

/** Есть ли снимок: на первом визите базы нет и «Отметить просмотренным» имеет смысл. */
export function hasBaseline(): boolean {
  return readSnapshot() !== null
}
