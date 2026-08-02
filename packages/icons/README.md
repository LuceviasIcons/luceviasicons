# LUCEVIAS

Иконки в единой сетке. Шесть весов, tree-shakeable React-компоненты.

Каталог со всеми иконками и готовыми сниппетами: **[открыть сайт](https://lucevias.github.io/lucevias/)**

## Установка

```bash
npm i lucevias
```

`react >= 18` нужен как peer-зависимость.

## Использование

```jsx
import { BoundingBox } from 'lucevias'

<BoundingBox size={32} />
```

### Пропсы

| Проп | Тип | По умолчанию | Описание |
|---|---|---|---|
| `size` | `number \| string` | `24` | Сторона в пикселях |
| `color` | `string` | `currentColor` | Цвет; по умолчанию наследуется от родителя |
| `weight` | `'thin' \| 'light' \| 'regular' \| 'bold' \| 'fill' \| 'duotone'` | `'regular'` | Начертание |

Остальные пропсы уходят на `<svg>`, поэтому работают `className`, `onClick`, `aria-*` и `ref`.

```jsx
// цвет наследуется от родителя
<span style={{ color: 'tomato' }}>
  <BoundingBox size={20} />
</span>
```

## Вес

Веса кроме `regular` доступны, только если рядом с иконкой лежит файл этого веса
(`bounding-box-bold.svg`). Отсутствующий вес молча откатывается на `regular`.

## Лицензия

MIT — пользуйтесь свободно, в том числе в коммерческих проектах.
Если библиотека выручает, [поддержите разработку](https://github.com/sponsors/lucevias).
