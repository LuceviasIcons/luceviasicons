import { VIEW_BOX, type IconDef, type Weight } from './types'

export type RenderOpts = {
  size: number
  color: string
  weight: Weight
}

/** Внутренности <svg> для конкретного веса, с откатом на regular. */
export function variantBody(icon: IconDef, weight: Weight): string {
  return icon.variants[weight] ?? icon.variants.regular
}

/** Сетка иконки: своя (из исходного файла) либо общая 256×256. */
export function viewBoxOf(icon: IconDef): string {
  return icon.viewBox ?? VIEW_BOX
}

/** Полный SVG-документ — то, что копируется и скачивается. */
export function toSvgString(icon: IconDef, opts: RenderOpts): string {
  const { size, color, weight } = opts
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"`,
    ` viewBox="${viewBoxOf(icon)}" fill="none" color="${color}">`,
    variantBody(icon, weight),
    '</svg>',
  ].join('')
}

/** То же, но отформатировано в несколько строк — удобнее вставлять в код. */
export function toPrettySvg(icon: IconDef, opts: RenderOpts): string {
  const raw = toSvgString(icon, opts)
  return raw
    .replace(/></g, '>\n  <')
    .replace(/\n {2}<\/svg>/, '\n</svg>')
}

const pascal = (name: string) =>
  name
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')

/** React-компонент как готовый сниппет. */
export function toJsx(icon: IconDef, opts: RenderOpts): string {
  const body = variantBody(icon, opts.weight)
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/fill-rule=/g, 'fillRule=')
    .replace(/clip-rule=/g, 'clipRule=')
    .replace(/></g, '>\n      <')

  return `export function ${pascal(icon.name)}Icon({ size = ${opts.size}, color = '${opts.color}', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="${viewBoxOf(icon)}"
      fill="none"
      color={color}
      {...props}
    >
      ${body}
    </svg>
  )
}`
}

export function toDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function downloadSvg(icon: IconDef, opts: RenderOpts) {
  const blob = new Blob([toPrettySvg(icon, opts)], { type: 'image/svg+xml' })
  triggerDownload(URL.createObjectURL(blob), `${icon.name}-${opts.weight}.svg`, true)
}

/** PNG через canvas. `scale` — множитель к размеру превью (1x / 2x / 4x). */
export async function downloadPng(icon: IconDef, opts: RenderOpts, scale = 4) {
  const px = Math.max(16, Math.round(opts.size * scale))
  const svg = toSvgString(icon, { ...opts, size: px })

  const img = new Image()
  img.crossOrigin = 'anonymous'

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Не удалось отрисовать SVG'))
    img.src = toDataUri(svg)
  })

  const canvas = document.createElement('canvas')
  canvas.width = px
  canvas.height = px
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas недоступен')
  ctx.drawImage(img, 0, 0, px, px)

  const url = canvas.toDataURL('image/png')
  triggerDownload(url, `${icon.name}-${opts.weight}-${px}.png`, false)
}

function triggerDownload(url: string, filename: string, revoke: boolean) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  if (revoke) setTimeout(() => URL.revokeObjectURL(url), 1000)
}
