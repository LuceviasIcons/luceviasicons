import type { IconDef, Weight } from './types'
import { loadIconsFromFolder } from './load'

/**
 * ВРЕМЕННЫЕ ДАННЫЕ.
 *
 * Пока настоящих SVG нет, каждая иконка — квадрат-плейсхолдер. Веса отличаются
 * толщиной обводки (и заливкой у fill/duotone), ровно как в Phosphor, чтобы
 * переключатель веса было видно в работе.
 *
 * Когда появятся свои SVG: замените `placeholder()` на объект `variants` с
 * реальной разметкой путей (viewBox 0 0 256 256). Остальной код менять не надо.
 */

const STROKE: Record<Weight, number> = {
  thin: 8,
  light: 12,
  regular: 16,
  bold: 24,
  fill: 16,
  duotone: 16,
}

/** Квадрат со скруглением; r масштабируется, чтобы толстые веса не слипались. */
function square(weight: Weight): string {
  const sw = STROKE[weight]
  const inset = sw / 2 + 32
  const size = 256 - inset * 2
  const rect = (extra: string) =>
    `<rect x="${inset}" y="${inset}" width="${size}" height="${size}" rx="16" ${extra}/>`

  if (weight === 'fill') {
    return rect('fill="currentColor" stroke="none"')
  }
  if (weight === 'duotone') {
    return [
      rect('fill="currentColor" opacity="0.2" stroke="none"'),
      rect(
        `fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linejoin="round"`,
      ),
    ].join('')
  }
  return rect(
    `fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linejoin="round"`,
  )
}

function placeholder(): IconDef['variants'] {
  return {
    thin: square('thin'),
    light: square('light'),
    regular: square('regular'),
    bold: square('bold'),
    fill: square('fill'),
    duotone: square('duotone'),
  }
}

type Seed = { name: string; title: string; tags: string[] }

const SEEDS: Seed[] = [
  { name: 'house', title: 'House', tags: ['home', 'дом', 'главная', 'начало'] },
  { name: 'user', title: 'User', tags: ['person', 'профиль', 'аккаунт', 'человек'] },
  { name: 'users', title: 'Users', tags: ['group', 'команда', 'группа', 'люди'] },
  { name: 'gear', title: 'Gear', tags: ['settings', 'настройки', 'шестерёнка'] },
  { name: 'magnifying-glass', title: 'Magnifying Glass', tags: ['search', 'поиск', 'лупа'] },
  { name: 'bell', title: 'Bell', tags: ['notification', 'уведомление', 'колокол'] },
  { name: 'heart', title: 'Heart', tags: ['like', 'избранное', 'сердце', 'лайк'] },
  { name: 'star', title: 'Star', tags: ['favorite', 'звезда', 'рейтинг', 'оценка'] },
  { name: 'folder', title: 'Folder', tags: ['directory', 'папка', 'каталог'] },
  { name: 'file', title: 'File', tags: ['document', 'файл', 'документ'] },
  { name: 'image', title: 'Image', tags: ['photo', 'картинка', 'фото', 'изображение'] },
  { name: 'camera', title: 'Camera', tags: ['photo', 'камера', 'съёмка'] },
  { name: 'play', title: 'Play', tags: ['video', 'воспроизвести', 'плей', 'старт'] },
  { name: 'chat', title: 'Chat', tags: ['message', 'сообщение', 'чат', 'диалог'] },
  { name: 'envelope', title: 'Envelope', tags: ['mail', 'почта', 'письмо', 'конверт'] },
  { name: 'phone', title: 'Phone', tags: ['call', 'звонок', 'телефон'] },
  { name: 'shopping-cart', title: 'Shopping Cart', tags: ['cart', 'корзина', 'покупки'] },
  { name: 'credit-card', title: 'Credit Card', tags: ['payment', 'карта', 'оплата'] },
  { name: 'lock', title: 'Lock', tags: ['secure', 'замок', 'защита', 'пароль'] },
  { name: 'shield', title: 'Shield', tags: ['security', 'щит', 'защита'] },
]

/** Иконки из `src/icons/svg/`. Пока папка пуста — показываем плейсхолдеры. */
const FROM_FOLDER = loadIconsFromFolder()

export const ICONS: IconDef[] =
  FROM_FOLDER.length > 0
    ? FROM_FOLDER
    : SEEDS.map((seed) => ({ ...seed, variants: placeholder() }))
