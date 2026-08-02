import { useEffect, useRef, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { STATUS_MARK, type IconDef, type IconStatus, type Weight } from '../icons/types'
import { downloadSvg, toPrettySvg } from '../icons/render'
import { TARGETS, buildSnippet, importLine, targetOf } from '../icons/snippets'
import { useCopy } from '../hooks/useCopy'
import { Icon } from './Icon'
import { StatusDot } from './IconGrid'

type Props = {
  icon: IconDef
  size: number
  color: string
  weight: Weight
  status: IconStatus
  onClose: () => void
}

/** Tags + по вкладке на каждую платформу из snippets.ts. */
const TABS = [{ id: 'tags', label: 'Tags' }, ...TARGETS.map((t) => ({ id: t.id, label: t.label }))]

export function DetailPanel({ icon, size, color, weight, status, onClose }: Props) {
  const [tab, setTab] = useState('react')
  const [leaving, setLeaving] = useState(false)
  const { copy, copied } = useCopy()
  const closeRef = useRef<HTMLButtonElement>(null)

  /**
   * Уход карточки: сначала играем 160ms прозрачности, потом размонтируем.
   * Без этого панель пропадает рывком — enter есть, exit нет.
   */
  const timerRef = useRef<number | undefined>(undefined)
  const close = () => {
    if (timerRef.current) return
    setLeaving(true)
    timerRef.current = window.setTimeout(onClose, 160)
  }
  // слушатель клавиш вешается один раз, а close меняется каждый рендер
  const closeFn = useRef(close)
  closeFn.current = close

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFn.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const opts = { size, color, weight }
  const snippet = tab === 'tags' ? '' : buildSnippet(tab, icon, opts)
  const imports = tab === 'tags' ? null : importLine(tab, icon)
  const target = targetOf(tab)

  return (
    /*
     * Плавающая панель внизу экрана. Управление каталогом переехало наверх,
     * поэтому здесь деталка стоит одна и держит собственное позиционирование.
     */
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-4"
      style={{ opacity: leaving ? 0 : 1, transition: 'opacity var(--dur-exit) ease-in' }}
    >
      <aside
        role="region"
        aria-label={`Icon ${icon.title}`}
        className="detail-sheet pointer-events-auto relative max-h-[60vh] w-full max-w-4xl overflow-y-auto rounded-2xl backdrop-blur-xl"
        style={{
          background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
          border: '1px solid var(--line)',
          boxShadow: '0 18px 48px -12px rgb(0 0 0 / 0.32)',
        }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Close panel"
          className="dock-close absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full text-sm leading-none"
          style={{ color: 'var(--muted)' }}
        >
          ✕
        </button>

        <div className="grid items-start gap-6 px-5 pb-5 pt-5 md:grid-cols-[minmax(0,150px)_minmax(0,1fr)]">
        {/* левая колонка: превью, имя, метаданные, действия */}
        <div className="min-w-0">
          {/*
            Превью и имя в одном контейнере темнее фона деталки. Имя внутри —
            длинные названия иначе не помещаются в узкую колонку и обрезаются.
          */}
          <div
            className="flex w-full max-w-[150px] flex-col items-center gap-2.5 rounded-xl px-3 py-4"
            style={{ background: 'var(--surface-2)' }}
          >
            <Icon icon={icon} size={44} color={color} weight={weight} />
            {/*
              Место под две строки резервируется всегда: иначе контейнер прыгает
              по высоте при переходе с короткого имени на длинное.
            */}
            <h2
              className="flex w-full items-center justify-center break-all text-center font-mono text-[11px]"
              style={{ minHeight: 'calc(2 * 1.25em)', lineHeight: 1.25 }}
            >
              {icon.title}
            </h2>
          </div>

          {status !== 'stable' && (
            <p
              className="mt-1.5 flex items-center gap-1.5 text-xs"
              style={{ color: 'var(--muted)' }}
            >
              <StatusDot status={status} />
              {STATUS_MARK[status].label}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-5">
            <ActionLink icon="download" hint="Download .svg file" onClick={() => downloadSvg(icon, opts)}>
              SVG
            </ActionLink>
            <ActionLink
              icon="copy"
              hint="Copy SVG markup to clipboard"
              onClick={() => copy(toPrettySvg(icon, opts), 'svg-quick')}
            >
              {copied === 'svg-quick' ? 'Copied' : 'SVG'}
            </ActionLink>
          </div>
        </div>

        <div className="min-w-0">
        <section>
          {/* вкладки: Tags + по одной на платформу */}
          <div
            className="flex items-center gap-1 overflow-x-auto"
            role="tablist"
            style={{ borderBottom: '1px solid var(--line)' }}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className="shrink-0 rounded-t-lg px-3 py-2 text-[13px]"
                style={{
                  color: tab === t.id ? 'var(--fg)' : 'var(--muted)',
                  background: tab === t.id ? 'var(--bg)' : 'transparent',
                  transition: 'color var(--dur-micro) ease-out, background-color var(--dur-micro) ease-out',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'tags' ? (
            <TagList tags={icon.tags} />
          ) : (
            <CodeRow
              code={snippet}
              copied={copied === tab}
              onCopy={() => copy(snippet, tab)}
              title={`${target.install}${imports ? `\n${imports}` : ''}`}
            />
          )}
        </section>
        </div>
        </div>
      </aside>
    </div>
  )
}

/**
 * Строка кода с кнопкой копирования. `prominent` — то, ради чего человек
 * открыл карточку (само использование), остальное подаётся тише.
 */
function CodeRow({
  code,
  copied,
  onCopy,
  title,
}: {
  code: string
  copied: boolean
  onCopy: () => void
  /** Подсказка с установкой и импортом — не занимает место в макете. */
  title?: string
}) {
  return (
    <div
      className="mt-3 flex items-center gap-3 rounded-xl px-4 py-3.5"
      style={{ background: 'var(--bg)' }}
      title={title}
    >
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[13px]">
        {code}
      </code>
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy"
        className="shrink-0 rounded px-1.5 py-0.5 text-[13px]"
        style={{ color: copied ? 'var(--fg)' : 'var(--muted)', transition: 'color var(--dur-micro) ease-out' }}
      >
        {copied ? '✓' : '⧉'}
      </button>
    </div>
  )
}

/** Вкладка Tags. Теги берутся из `src/icons/tags.json`, файл необязателен. */
function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return (
      <p className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
        No tags yet. Add <code className="font-mono">src/icons/tags.json</code> shaped like{' '}
        <code className="font-mono">{'{ "icon-name": ["tag", "synonym"] }'}</code> — they show up
        here and in search.
      </p>
    )
  }

  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className="rounded-md px-2 py-1 font-mono text-[11px]"
          style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
        >
          {t}
        </span>
      ))}
    </div>
  )
}

/** Значки действий: свои, чтобы не зависеть от состава библиотеки. */
const ACTION_GLYPH = {
  download: 'M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 20h16',
  copy: 'M9 9V5.5A1.5 1.5 0 0 1 10.5 4h8A1.5 1.5 0 0 1 20 5.5v8a1.5 1.5 0 0 1-1.5 1.5H15M5.5 9h8A1.5 1.5 0 0 1 15 10.5v8a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 4 18.5v-8A1.5 1.5 0 0 1 5.5 9Z',
} as const

/**
 * Действие в левой колонке: значок + подпись, как в референсе.
 * Пояснение уходит в тултип — Radix даёт задержку, клавиатуру и порталы даром.
 */
function ActionLink({
  children,
  icon,
  hint,
  onClick,
}: {
  children: React.ReactNode
  icon: keyof typeof ACTION_GLYPH
  hint: string
  onClick: () => void
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          onClick={onClick}
          className="action-link flex items-center gap-2.5 rounded-md px-1 py-1.5 text-left text-[13px]"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ color: 'var(--muted)' }}
          >
            <path d={ACTION_GLYPH[icon]} />
          </svg>
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content sideOffset={6} className="tooltip-content">
          {hint}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
