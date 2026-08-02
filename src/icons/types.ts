export const WEIGHTS = ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'] as const

export type Weight = (typeof WEIGHTS)[number]

/**
 * Один вариант отрисовки иконки. `paths` — содержимое <svg>, без обёртки.
 * viewBox фиксирован 0 0 256 256 (как у Phosphor), чтобы сетка была единой.
 */
export type IconVariant = string

export type IconDef = {
  /** kebab-case, уникальный. Используется в URL и в именах файлов. */
  name: string
  /** Человеческое имя для карточки. */
  title: string
  /** Синонимы для поиска. */
  tags: string[]
  /** Отрисовка по весам. Отсутствующий вес откатывается на regular. */
  variants: Partial<Record<Weight, IconVariant>> & { regular: IconVariant }
  /** Своя сетка иконки, если она нарисована не в 256×256 (например, «0 0 24 24»). */
  viewBox?: string
}

export const VIEW_BOX = '0 0 256 256'

/**
 * Статус иконки относительно прошлого визита (см. `icons/status.ts`).
 * `stable` — была и не менялась, метка не рисуется.
 */
export type IconStatus = 'new' | 'updated' | 'stable'

/** Кружок-маркер: цвет и подпись. Единый источник для сетки и карточки. */
export const STATUS_MARK: Record<
  Exclude<IconStatus, 'stable'>,
  { color: string; label: string }
> = {
  new: { color: '#16a34a', label: 'New' },
  updated: { color: '#f59e0b', label: 'Updated' },
}
