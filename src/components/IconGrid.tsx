import { memo, useEffect, useState } from 'react'
import { STATUS_MARK, type IconDef, type IconStatus, type Weight } from '../icons/types'
import { Icon } from './Icon'

type Props = {
  icons: IconDef[]
  size: number
  color: string
  weight: Weight
  selected: string | null
  onSelect: (icon: IconDef) => void
  statuses: Record<string, IconStatus>
}

/** Кружок в углу карточки: зелёный — новая, янтарный — обновлённая. */
export function StatusDot({ status, size = 8 }: { status: IconStatus; size?: number }) {
  if (status === 'stable') return null
  const mark = STATUS_MARK[status]
  return (
    <span
      role="img"
      aria-label={mark.label}
      title={mark.label}
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: mark.color }}
    />
  )
}

export const IconGrid = memo(function IconGrid({
  icons,
  size,
  color,
  weight,
  selected,
  onSelect,
  statuses,
}: Props) {
  // Волна появления — только на первой отрисовке. При фильтрации сетка
  // перестраивается молча, иначе ввод в поиск мигает всеми плитками сразу.
  const [introDone, setIntroDone] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 700)
    return () => clearTimeout(t)
  }, [])

  if (icons.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Nothing found. Try a different query.
        </p>
      </div>
    )
  }

  return (
    <ul
      className="grid gap-2"
      style={{
        // Ячейка фиксированная: слайдер меняет размер иконки и код,
        // но сетка не перекомпоновывается под каждым движением ползунка.
        gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))',
      }}
    >
      {icons.map((icon, index) => {
        const isActive = selected === icon.name
        const status = statuses[icon.name] ?? 'stable'
        return (
          <li
            key={icon.name}
            className={introDone ? undefined : 'tile-in'}
            style={introDone ? undefined : ({ '--i': index } as React.CSSProperties)}
          >
            <button
              type="button"
              onClick={() => onSelect(icon)}
              aria-pressed={isActive}
              className="icon-tile flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-xl p-3"
              data-active={isActive || undefined}
            >
              {/* превью упирается в размер ячейки, сам size при этом любой */}
              <span className="flex h-16 items-center justify-center">
                <Icon icon={icon} size={Math.min(size, 64)} color={color} weight={weight} />
              </span>
              {/*
                Имена вроде align-center-horizontal-simple различаются только
                хвостом, поэтому переносим в две строки вместо обрезки.
              */}
              <span className="flex max-w-full items-center gap-1.5">
                <span
                  className="line-clamp-2 break-all text-center font-mono text-[11px] leading-tight"
                  style={{ color: 'var(--muted)' }}
                >
                  {icon.title}
                </span>
                <StatusDot status={status} size={6} />
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
})
