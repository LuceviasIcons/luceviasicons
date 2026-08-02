import { forwardRef, useRef, useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { WEIGHTS, type Weight } from '../icons/types'

const WEIGHT_LABEL: Record<Weight, string> = {
  thin: 'Thin',
  light: 'Light',
  regular: 'Regular',
  bold: 'Bold',
  fill: 'Fill',
  duotone: 'Duotone',
}

type Props = {
  query: string
  weight: Weight
  size: number
  onQuery: (q: string) => void
  onWeight: (w: Weight) => void
  color: string
  onSize: (s: number) => void
  onColor: (c: string) => void
}

/**
 * Панель управления между hero и сеткой: поиск, вес, размер.
 * Липнет к верху при прокрутке — фильтры нужны, пока листаешь каталог.
 */
export const Controls = forwardRef<HTMLInputElement, Props>(function Controls(
  { query, weight, size, color, onQuery, onWeight, onSize, onColor },
  searchRef,
) {
  return (
    /*
     * section, а не toolbar: нужен именно landmark, иначе содержимое панели
     * оказывается вне областей и недостижимо landmark-навигацией скринридера.
     */
    <section
      aria-label="Catalog controls"
      className="sticky top-0 z-30 backdrop-blur-xl"
      style={{
        background: 'color-mix(in srgb, var(--bg) 90%, transparent)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-y-2 overflow-x-auto px-6 py-3">
        <Group className="dock-search h-11 !px-3.5">
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search…"
            aria-label="Search icons"
            className="w-48 min-w-0 border-0 bg-transparent text-[13.5px] outline-none"
          />
          <kbd
            className="rounded px-1.5 py-0.5 font-mono text-[10px]"
            style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
          >
            /
          </kbd>
        </Group>

        <Group>
          {/* веса выпадающим списком: шесть кнопок занимали половину дока */}
          <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="dock-trigger flex h-11 w-[104px] items-center justify-between gap-2 rounded-xl px-3 text-[13px]"
                aria-label={`Weight: ${WEIGHT_LABEL[weight]}`}
              >
                {WEIGHT_LABEL[weight]}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ color: 'var(--muted)' }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              {/*
                modal=false на Root: иначе Radix вешает overflow:hidden на body,
                и страница перестаёт скроллиться, пока меню открыто.
              */}
              <DropdownMenu.Content
                side="top"
                sideOffset={8}
                className="dock-menu"
                // Radix возвращает фокус на триггер, и браузер считает это
                // фокусом с клавиатуры — оставалась жирная рамка после выбора
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                {WEIGHTS.map((w) => (
                  <DropdownMenu.Item
                    key={w}
                    onSelect={() => onWeight(w)}
                    className="dock-menu-item"
                    data-active={w === weight || undefined}
                  >
                    {WEIGHT_LABEL[w]}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </Group>

        <Group>
          <DragNumber value={size} min={16} max={96} step={2} onChange={onSize} label="Size" />
        </Group>

        <Group>
          {/* цвет: свотч открывает системный пикер, рядом — ручной ввод hex */}
          <div className="dock-color flex h-11 items-center gap-2 rounded-xl px-2.5">
            <label
              className="relative block size-6 shrink-0 cursor-pointer overflow-hidden rounded-lg"
              style={{ background: color, border: '1px solid var(--line)' }}
              title="Pick color"
            >
              <input
                type="color"
                value={color}
                onChange={(e) => onColor(e.target.value)}
                aria-label="Icon color"
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
            <HexInput color={color} onColor={onColor} />
          </div>
        </Group>
      </div>
    </section>
  )
})

/**
 * Поле-слайдер как в панелях свойств Figma и Blender: заливка показывает
 * позицию в диапазоне, число правится с клавиатуры, перетаскивание по
 * горизонтали меняет значение. Три способа ввода в одном контроле.
 */
function DragNumber({
  value,
  min,
  max,
  step,
  label,
  onChange,
}: {
  value: number
  min: number
  max: number
  step: number
  label: string
  onChange: (v: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState<string | null>(null)

  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step))
  const pct = ((value - min) / (max - min)) * 100

  /** Перетаскивание: значение считается от позиции курсора внутри поля. */
  const startDrag = (e: React.PointerEvent) => {
    // клик по полю ввода не должен превращаться в перетаскивание
    if ((e.target as HTMLElement).tagName === 'INPUT') return
    const el = ref.current
    if (!el) return

    e.preventDefault()
    el.setPointerCapture(e.pointerId)

    const apply = (clientX: number) => {
      const { left, width } = el.getBoundingClientRect()
      onChange(clamp(min + ((clientX - left) / width) * (max - min)))
    }
    apply(e.clientX)

    const onMove = (ev: PointerEvent) => apply(ev.clientX)
    const onUp = () => {
      el.releasePointerCapture(e.pointerId)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
  }

  const commit = (raw: string) => {
    const n = Number(raw.replace(/[^\d.-]/g, ''))
    if (Number.isFinite(n)) onChange(clamp(n))
    setDraft(null)
  }

  return (
    <div
      ref={ref}
      onPointerDown={startDrag}
      className="drag-number relative flex h-11 w-[186px] shrink-0 cursor-ew-resize items-center overflow-hidden rounded-xl text-[13px]"
    >
      {/* заливка — позиция в диапазоне */}
      <span
        aria-hidden
        className="drag-number-fill absolute inset-y-0 left-0"
        style={{ width: `${pct}%` }}
      />
      <span className="relative select-none pl-3.5 pr-3" style={{ color: 'var(--muted)' }}>
        {label}
      </span>
      {/* разделители внутри поля, а не по его краям */}
      <span aria-hidden className="drag-number-sep relative" />
      <span className="relative ml-auto flex items-baseline font-mono tabular-nums">
        <input
          value={draft ?? String(value)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            // стрелки меняют значение шагом, как у нативного слайдера
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              onChange(clamp(value + step))
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              onChange(clamp(value - step))
            }
          }}
          role="spinbutton"
          aria-label={label}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          inputMode="numeric"
          className="w-9 min-w-0 border-0 bg-transparent text-right outline-none"
        />
        <span aria-hidden className="drag-number-sep relative mx-3" />
        <span className="pr-3.5" style={{ color: 'var(--muted)' }}>
          px
        </span>
      </span>
    </div>
  )
}

/**
 * Ручной ввод цвета. Держит собственный черновик: применять каждое нажатие
 * нельзя (цвет скакал бы на неполном hex), а писать в поле только валидное
 * значение — значит запретить стирать символы.
 */
function HexInput({ color, onColor }: { color: string; onColor: (c: string) => void }) {
  const [draft, setDraft] = useState(color)

  // цвет мог смениться пикером или темой — подхватываем, пока поле не в фокусе
  const [focused, setFocused] = useState(false)
  if (!focused && draft.toLowerCase() !== color.toLowerCase()) setDraft(color)

  return (
    <input
      type="text"
      value={draft}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        setDraft(color)
      }}
      onChange={(e) => {
        const raw = e.target.value
        const v = raw.startsWith('#') ? raw : `#${raw}`
        setDraft(v)
        if (/^#[0-9a-f]{6}$/i.test(v)) onColor(v.toLowerCase())
      }}
      aria-label="Color hex"
      spellCheck={false}
      maxLength={7}
      className="w-[72px] min-w-0 border-0 bg-transparent font-mono text-[12.5px] uppercase outline-none"
    />
  )
}

/** Секция дока. Подложки нет — секции разделены делителями. */
function Group({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex shrink-0 items-center gap-2 px-2 ${className ?? ''}`}>{children}</div>
  )
}
