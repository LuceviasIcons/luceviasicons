import Fuse from 'fuse.js'
import type { IconDef } from './types'

/**
 * Поиск по каталогу на Fuse.js: терпит опечатки и находит `align-btm` по
 * `align-bottom`. Индекс строится один раз на набор иконок и переиспользуется,
 * пересборка на каждый ввод съедала бы выигрыш.
 */

let cache: { icons: IconDef[]; fuse: Fuse<IconDef> } | null = null

function indexOf(icons: IconDef[]): Fuse<IconDef> {
  if (cache && cache.icons === icons) return cache.fuse

  const fuse = new Fuse(icons, {
    // имя весит больше тегов: люди ищут по названию, теги — подстраховка
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'tags', weight: 0.3 },
    ],
    threshold: 0.35, // строже дефолта: иначе на 92 иконках находится половина каталога
    ignoreLocation: true, // совпадение в хвосте имени не хуже совпадения в начале
    minMatchCharLength: 2,
  })

  cache = { icons, fuse }
  return fuse
}

export function filterIcons(icons: IconDef[], query: string): IconDef[] {
  const q = query.trim()
  if (!q) return icons

  return indexOf(icons)
    .search(q)
    .map((r) => r.item)
}
