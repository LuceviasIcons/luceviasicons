import { useEffect, useMemo, useRef, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { ICONS } from './icons/data'
import { filterIcons } from './icons/search'
import { computeStatuses, hasBaseline, markAllSeen } from './icons/status'
import { STATUS_MARK, type IconDef, type Weight } from './icons/types'
import { Controls } from './components/Controls'
import { IconGrid } from './components/IconGrid'
import { DetailPanel } from './components/DetailPanel'
import { Hero } from './components/Hero'

/** Дефолтный цвет иконок по темам — совпадает с --fg в index.css. */
const FG_LIGHT = '#22251c'
const FG_DARK = '#eeece4'

export default function App() {
  const [query, setQuery] = useState('')
  const [weight, setWeight] = useState<Weight>('regular')
  const [size, setSize] = useState(32)
  const [color, setColor] = useState(FG_LIGHT)
  const [selected, setSelected] = useState<IconDef | null>(null)
  // стартуем от системной настройки, иначе data-theme перебивает prefers-color-scheme
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  )

  const searchRef = useRef<HTMLInputElement>(null)

  // статусы считаются один раз за загрузку: снимок папки против прошлого визита
  const [statuses, setStatuses] = useState(() => computeStatuses(ICONS))
  const [baselineSet, setBaselineSet] = useState(hasBaseline)

  const results = useMemo(() => filterIcons(ICONS, query), [query])

  const changedCount = useMemo(
    () => Object.values(statuses).filter((s) => s !== 'stable').length,
    [statuses],
  )

  const handleMarkSeen = () => {
    markAllSeen(ICONS)
    setStatuses(computeStatuses(ICONS))
    setBaselineSet(true)
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    // дефолтный цвет должен читаться на обоих фонах; свой цвет не трогаем
    setColor((c) => {
      if (theme === 'dark' && c === FG_LIGHT) return FG_DARK
      if (theme === 'light' && c === FG_DARK) return FG_LIGHT
      return c
    })
  }, [theme])

  // «/» фокусирует поиск, как на phosphoricons.com
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    // skipDelayDuration: соседний тултип открывается мгновенно — тулбар
    // ощущается быстрее, при этом первый показ всё ещё с задержкой
    <Tooltip.Provider delayDuration={400} skipDelayDuration={300}>
    {/* отступ снизу резервируется только под открытую деталку */}
    <div className="min-w-0" style={{ paddingBottom: selected ? '22rem' : '3rem' }}>
      <main>
      {/* переключатель темы живёт узлом схемы — отдельной шапки у сайта нет */}
      <Hero theme={theme} onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))} />

      {/* фильтры между hero и сеткой, липнут к верху при прокрутке */}
      <Controls
        ref={searchRef}
        query={query}
        weight={weight}
        size={size}
        color={color}
        onQuery={setQuery}
        onWeight={setWeight}
        onSize={setSize}
        onColor={setColor}
      />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
            {results.length} of {ICONS.length}
          </p>
          <div className="flex items-center gap-4">
            <Legend />
            {(changedCount > 0 || !baselineSet) && (
              <button
                type="button"
                onClick={handleMarkSeen}
                className="rounded-full px-3 py-1 text-[11px] transition-colors"
                style={{ border: '1px solid var(--line)', color: 'var(--muted)' }}
                title={
                  changedCount > 0
                    ? 'Clear the new/updated marks'
                    : 'Remember the current set so future changes get marked'
                }
              >
                {changedCount > 0 ? `Mark as seen (${changedCount})` : 'Remember set'}
              </button>
            )}
          </div>
        </div>

        <IconGrid
          icons={results}
          size={size}
          color={color}
          weight={weight}
          statuses={statuses}
          selected={selected?.name ?? null}
          onSelect={(icon) => setSelected((cur) => (cur?.name === icon.name ? null : icon))}
        />

      </div>
      </main>

      {/* внизу плавает только деталка выбранной иконки */}
      {selected && (
        <DetailPanel
          icon={selected}
          size={size}
          color={color}
          weight={weight}
          status={statuses[selected.name] ?? 'stable'}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
    </Tooltip.Provider>
  )
}

/** Расшифровка кружков — иначе цвета читаются как украшение. */
function Legend() {
  return (
    <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--muted)' }}>
      {(Object.keys(STATUS_MARK) as (keyof typeof STATUS_MARK)[]).map((key) => (
        <span key={key} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: STATUS_MARK[key].color }}
          />
          {STATUS_MARK[key].label}
        </span>
      ))}
    </div>
  )
}
