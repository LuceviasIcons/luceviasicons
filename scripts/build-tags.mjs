/**
 * Генерирует `packages/core/tags.json` — теги для поиска по каталогу.
 *
 * Теги строятся из имени иконки, а не пишутся руками на каждую из 382 штук:
 * список иконок растёт, и ручной файл разошёлся бы с папкой на первой же
 * партии. Правила ниже покрывают три случая:
 *
 *   1. части составного имени      (`arrow-circle-down` → arrow, circle, down)
 *   2. синонимы к частям           (`trash` → delete, remove, bin)
 *   3. тема по ключевому слову     (`file-js` → code, development)
 *
 * Только английский: каталог англоязычный, и смешанные языки в одном индексе
 * ухудшают ранжирование Fuse — запрос латиницей начинает цеплять кириллицу.
 *
 * Запуск: `npm run tags:build` (входит в `npm run build`).
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { collectIcons, ROOT } from './svg-source.mjs'

/** Синонимы к отдельным словам имени. Ключ — слово, значение — что добавить. */
const SYNONYMS = {
  airplane: ['plane', 'flight', 'travel', 'aviation'],
  alarm: ['clock', 'time', 'wake', 'reminder'],
  alien: ['ufo', 'space', 'extraterrestrial'],
  align: ['layout', 'position', 'distribute'],
  ambulance: ['emergency', 'medical', 'hospital'],
  anchor: ['ship', 'nautical', 'marine'],
  angle: ['geometry', 'corner', 'degree'],
  aperture: ['camera', 'photo', 'lens'],
  archive: ['box', 'storage', 'backup'],
  armchair: ['furniture', 'seat', 'chair'],
  arrow: ['direction', 'pointer', 'navigation'],
  arrows: ['direction', 'pointer', 'navigation'],
  asterisk: ['star', 'footnote', 'wildcard'],
  atom: ['science', 'physics', 'molecule'],
  avocado: ['food', 'fruit', 'healthy'],
  axe: ['tool', 'chop', 'weapon'],
  baby: ['child', 'infant', 'kid'],
  backpack: ['bag', 'school', 'travel', 'hiking'],
  backspace: ['delete', 'erase', 'keyboard', 'undo'],
  bag: ['shopping', 'purse', 'store', 'purchase'],
  balloon: ['party', 'celebration', 'birthday', 'float'],
  bandaids: ['plaster', 'medical', 'injury', 'first aid'],
  bank: ['finance', 'money', 'building', 'institution'],
  barbell: ['gym', 'fitness', 'weight', 'workout'],
  barcode: ['scan', 'product', 'retail', 'code'],
  barn: ['farm', 'agriculture', 'rural', 'building'],
  barricade: ['block', 'roadblock', 'construction', 'barrier'],
  baseball: ['sport', 'ball', 'game'],
  basket: ['shopping', 'cart', 'store', 'container'],
  basketball: ['sport', 'ball', 'game', 'hoop'],
  bathtub: ['bath', 'bathroom', 'wash', 'tub'],
  battery: ['power', 'charge', 'energy'],
  beach: ['sea', 'summer', 'vacation', 'sand'],
  beanie: ['hat', 'winter', 'clothing', 'cap'],
  bed: ['sleep', 'bedroom', 'hotel', 'rest'],
  beer: ['drink', 'alcohol', 'bar', 'pub'],
  behance: ['logo', 'brand', 'portfolio', 'design'],
  bell: ['notification', 'alert', 'ring'],
  belt: ['clothing', 'accessory', 'waist'],
  bezier: ['curve', 'vector', 'path', 'design'],
  bicycle: ['bike', 'cycling', 'transport', 'ride'],
  binary: ['code', 'data', 'digital', 'bits'],
  biohazard: ['danger', 'warning', 'toxic', 'hazard'],
  bird: ['animal', 'fly', 'nature', 'wing'],
  blueprint: ['plan', 'design', 'architecture', 'draft'],
  bluetooth: ['wireless', 'connection', 'pairing', 'signal'],
  boat: ['ship', 'sail', 'water', 'transport'],
  bomb: ['explosive', 'danger', 'blast', 'destroy'],
  bone: ['skeleton', 'anatomy', 'dog', 'medical'],
  book: ['read', 'library', 'literature', 'study'],
  bookmark: ['save', 'favorite', 'mark', 'remember'],
  bookmarks: ['save', 'favorites', 'marks', 'collection'],
  books: ['library', 'read', 'study', 'collection'],
  boot: ['shoe', 'footwear', 'clothing'],
  boules: ['petanque', 'game', 'sport', 'ball'],
  bounding: ['box', 'frame', 'select'],
  bowl: ['food', 'dish', 'kitchen', 'meal'],
  bowling: ['sport', 'game', 'strike', 'ball'],
  boxing: ['sport', 'fight', 'glove', 'punch'],
  brackets: ['code', 'syntax', 'programming', 'parentheses'],
  brain: ['mind', 'think', 'intelligence', 'neuro'],
  brandy: ['drink', 'alcohol', 'glass', 'bar'],
  bread: ['food', 'bakery', 'loaf', 'eat'],
  bridge: ['cross', 'connect', 'structure', 'architecture'],
  briefcase: ['work', 'business', 'bag', 'office'],
  broadcast: ['signal', 'stream', 'radio', 'transmit'],
  broom: ['clean', 'sweep', 'housework'],
  browser: ['web', 'internet', 'window', 'site'],
  browsers: ['web', 'internet', 'windows', 'tabs'],
  calendar: ['date', 'schedule', 'event', 'month'],
  caret: ['arrow', 'chevron', 'triangle', 'expand'],
  circle: ['round', 'shape', 'ellipse'],
  circles: ['round', 'shape', 'group'],
  clock: ['time', 'schedule', 'watch', 'hour'],
  columns: ['layout', 'grid', 'table', 'split'],
  compass: ['navigation', 'direction', 'tool'],
  crop: ['cut', 'trim', 'image', 'edit'],
  cube: ['3d', 'box', 'shape', 'volume'],
  cylinder: ['3d', 'shape', 'database', 'volume'],
  diamonds: ['shape', 'gem', 'cards'],
  drop: ['water', 'liquid', 'droplet', 'opacity'],
  eraser: ['delete', 'remove', 'clear', 'edit'],
  exclude: ['boolean', 'shape', 'subtract', 'path'],
  eye: ['view', 'visibility', 'see', 'preview'],
  file: ['document', 'page', 'paper'],
  files: ['documents', 'pages', 'copy'],
  flip: ['mirror', 'reverse', 'transform'],
  folder: ['directory', 'storage', 'files'],
  folders: ['directories', 'storage', 'files'],
  grid: ['layout', 'table', 'gallery'],
  hexagon: ['shape', 'polygon', 'six'],
  hourglass: ['time', 'wait', 'loading', 'timer'],
  intersect: ['boolean', 'shape', 'overlap', 'path'],
  layout: ['grid', 'template', 'arrange', 'design'],
  number: ['digit', 'numeric', 'count'],
  octagon: ['shape', 'polygon', 'eight', 'stop'],
  parallelogram: ['shape', 'geometry', 'skew'],
  pen: ['write', 'draw', 'edit', 'design'],
  pencil: ['write', 'draw', 'edit'],
  pentagon: ['shape', 'polygon', 'five'],
  pentagram: ['star', 'shape', 'occult'],
  perspective: ['3d', 'transform', 'view'],
  placeholder: ['empty', 'blank', 'stub'],
  rectangle: ['shape', 'square', 'box'],
  recycle: ['reuse', 'environment', 'sustainability'],
  resize: ['scale', 'transform', 'size'],
  rows: ['layout', 'table', 'list', 'split'],
  selection: ['select', 'marquee', 'highlight'],
  sidebar: ['panel', 'menu', 'navigation', 'layout'],
  square: ['shape', 'box', 'rectangle'],
  squares: ['shape', 'grid', 'boxes'],
  stack: ['layers', 'pile', 'group'],
  subtract: ['boolean', 'minus', 'shape', 'path'],
  timer: ['time', 'countdown', 'stopwatch'],
  triangle: ['shape', 'polygon', 'three'],
  unite: ['boolean', 'merge', 'combine', 'shape'],
  vector: ['path', 'design', 'graphics'],
  vignette: ['photo', 'filter', 'effect'],
  watch: ['time', 'clock', 'wearable'],
  acorn: ['nut', 'oak', 'nature', 'autumn'],
  address: ['contact', 'book', 'phone'],
  airplay: ['cast', 'stream', 'screen', 'apple'],
  amazon: ['brand', 'logo', 'shop'],
  android: ['brand', 'logo', 'mobile', 'google'],
  angular: ['brand', 'logo', 'framework', 'code'],
  apple: ['brand', 'logo'],
  approximate: ['math', 'equals', 'roughly'],
  article: ['news', 'text', 'read', 'blog'],
  asclepius: ['medical', 'health', 'snake', 'doctor'],
  at: ['email', 'mention', 'address'],
  carriage: ['stroller', 'pram', 'child'],
  charging: ['power', 'energy', 'plug'],
  check: ['done', 'tick', 'confirm', 'success'],
  clockwise: ['rotate', 'turn', 'redo'],
  closed: ['shut', 'hidden'],
  code: ['development', 'programming', 'source'],
  countdown: ['timer', 'time', 'wait'],
  dashed: ['dotted', 'outline', 'border'],
  dot: ['point', 'bullet', 'circle'],
  dots: ['points', 'menu', 'more'],
  down: ['bottom', 'south', 'below'],
  empty: ['blank', 'none', 'zero'],
  full: ['complete', 'max', 'filled'],
  half: ['partial', 'fifty'],
  heart: ['love', 'favorite', 'like'],
  high: ['max', 'top', 'level'],
  horizontal: ['x', 'width', 'row'],
  in: ['inside', 'enter', 'collapse'],
  inverse: ['invert', 'opposite', 'reverse'],
  left: ['west', 'back', 'previous'],
  lock: ['secure', 'private', 'password'],
  low: ['min', 'bottom', 'level'],
  magnifying: ['search', 'zoom', 'find', 'glass'],
  medium: ['mid', 'level', 'brand'],
  merge: ['combine', 'join', 'union'],
  minus: ['remove', 'subtract', 'delete', 'less'],
  notch: ['loading', 'spinner', 'progress'],
  open: ['unlock', 'expand', 'unfold'],
  out: ['outside', 'exit', 'expand'],
  plus: ['add', 'new', 'create', 'more'],
  right: ['east', 'forward', 'next'],
  ringing: ['alert', 'notification', 'sound'],
  simple: ['minimal', 'basic', 'plain'],
  slash: ['off', 'disabled', 'mute', 'none'],
  split: ['divide', 'separate', 'half'],
  star: ['favorite', 'bookmark', 'rating'],
  takeoff: ['departure', 'launch', 'start'],
  landing: ['arrival', 'land', 'descend'],
  three: ['3'],
  tilt: ['angle', 'rotate', 'skew'],
  top: ['up', 'above', 'north'],
  transparent: ['opacity', 'alpha', 'clear'],
  two: ['2'],
  up: ['top', 'north', 'above'],
  user: ['person', 'account', 'profile', 'avatar'],
  vertical: ['y', 'height', 'column'],
  warning: ['alert', 'caution', 'error'],
  x: ['close', 'cancel', 'remove', 'cross'],
  z: ['sleep', 'snooze', 'mute'],
}

/** Тема по ключевому слову: одно попадание — весь набор тегов у иконки. */
const THEMES = [
  { when: ['file', 'folder', 'files', 'folders'], tags: ['document', 'storage'] },
  { when: ['arrow', 'arrows', 'caret'], tags: ['direction', 'navigation'] },
  { when: ['circle', 'square', 'triangle', 'hexagon', 'octagon', 'pentagon', 'rectangle', 'parallelogram'], tags: ['shape', 'geometry'] },
  { when: ['align', 'columns', 'rows', 'grid', 'layout', 'sidebar'], tags: ['layout', 'design'] },
  { when: ['battery'], tags: ['device', 'status'] },
  { when: ['calendar', 'clock', 'timer', 'hourglass', 'alarm', 'watch'], tags: ['time'] },
  { when: ['number'], tags: ['number', 'digit'] },
  { when: ['airplane'], tags: ['travel', 'transport'] },
  { when: ['logo'], tags: ['brand', 'logo'] },
  { when: ['selection', 'crop', 'eraser', 'pen', 'pencil', 'bezier'], tags: ['editor', 'tool'] },
  { when: ['unite', 'subtract', 'intersect', 'exclude'], tags: ['boolean', 'path'] },
]

/**
 * Расширения в именах вроде `file-js`: сами по себе они ничего не говорят
 * поиску, поэтому раскрываются в язык и общую тему разработки.
 */
const EXTENSIONS = {
  js: ['javascript', 'code', 'development'],
  jsx: ['javascript', 'react', 'code', 'development'],
  ts: ['typescript', 'code', 'development'],
  tsx: ['typescript', 'react', 'code', 'development'],
  vue: ['javascript', 'code', 'development', 'framework'],
  py: ['python', 'code', 'development'],
  rs: ['rust', 'code', 'development'],
  cpp: ['c++', 'code', 'development'],
  css: ['stylesheet', 'code', 'web'],
  html: ['markup', 'code', 'web'],
  sql: ['database', 'query', 'code'],
  md: ['markdown', 'text', 'readme'],
  ini: ['config', 'settings', 'text'],
  csv: ['spreadsheet', 'data', 'table'],
  xls: ['spreadsheet', 'excel', 'data'],
  ppt: ['presentation', 'slides'],
  doc: ['word', 'text', 'document'],
  pdf: ['document', 'acrobat'],
  txt: ['text', 'plain'],
  svg: ['vector', 'image', 'graphics'],
  png: ['image', 'bitmap', 'picture'],
  jpg: ['image', 'photo', 'picture'],
  zip: ['archive', 'compressed'],
}

/** Цифры словами — чтобы `number-3` находил `number-three`. */
const DIGITS = {
  zero: '0', one: '1', two: '2', three: '3', four: '4',
  five: '5', six: '6', seven: '7', eight: '8', nine: '9',
}

const collator = new Intl.Collator('en')

function tagsFor(name) {
  const parts = name.split('-').filter(Boolean)
  const tags = new Set()

  for (const part of parts) {
    // само слово тегом не делаем: оно уже есть в name, по которому Fuse ищет
    // с большим весом — дубль только размывал бы ранжирование
    for (const syn of SYNONYMS[part] ?? []) tags.add(syn)
    if (DIGITS[part]) tags.add(DIGITS[part])
    // расширение раскрываем только у файловых иконок: `file-c`, но не `arrow-in`
    if (parts[0] === 'file' && EXTENSIONS[part]) {
      for (const t of EXTENSIONS[part]) tags.add(t)
    }
  }

  for (const { when, tags: themed } of THEMES) {
    if (when.some((w) => parts.includes(w))) for (const t of themed) tags.add(t)
  }

  /*
   * Заголовки: `text-h-one` ищут как «h1», а не «text h one» — в вёрстке
   * они так и называются. Правило отдельное, потому что склеивает две части
   * имени в одно слово, чего не делает ни один из общих проходов выше:
   * DIGITS даёт «1», но «h» и «1» так и остаются порознь.
   */
  if (parts[0] === 'text' && parts[1] === 'h') {
    tags.add('heading').add('header').add('title')
    const digit = DIGITS[parts[2]]
    if (digit) {
      tags.add(`h${digit}`)
      tags.add(`h ${digit}`)
      tags.add(`heading ${digit}`)
    }
  }

  // многословное имя целиком: `address-book` найдётся по `address book`
  if (parts.length > 1) tags.add(parts.join(' '))

  return [...tags].filter((t) => /^[a-z0-9 ]+$/.test(t)).sort(collator.compare)
}

const icons = collectIcons()
const out = {}
for (const { name } of icons) {
  const tags = tagsFor(name)
  if (tags.length) out[name] = tags
}

writeFileSync(join(ROOT, 'packages/core/tags.json'), JSON.stringify(out, null, 2) + '\n')

const total = Object.values(out).reduce((n, t) => n + t.length, 0)
const without = icons.length - Object.keys(out).length
console.log(
  `Теги: ${total} на ${Object.keys(out).length} иконок` +
    (without ? ` (без тегов: ${without})` : ''),
)
