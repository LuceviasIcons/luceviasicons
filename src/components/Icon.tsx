import type { IconDef, Weight } from '../icons/types'
import { variantBody, viewBoxOf } from '../icons/render'

type Props = {
  icon: IconDef
  size?: number
  color?: string
  weight?: Weight
}

/**
 * Плейсхолдерная разметка полностью наша (см. icons/data.ts), внешний ввод сюда
 * не попадает, поэтому dangerouslySetInnerHTML здесь безопасен. Если начнёте
 * подгружать SVG из загруженных пользователем файлов — сначала прогоните их
 * через санитайзер (DOMPurify) или парсите пути в структуру.
 */
export function Icon({ icon, size = 32, color = 'currentColor', weight = 'regular' }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBoxOf(icon)}
      fill="none"
      color={color}
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: variantBody(icon, weight) }}
    />
  )
}
