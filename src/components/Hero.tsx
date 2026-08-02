import { useEffect, useMemo, useRef } from 'react'
import { ICONS } from '../icons/data'
import { Icon } from './Icon'

/**
 * Hero: схема труб-блюпринта, по которой едут сигналы, а на узлах живут иконки
 * из библиотеки — продукт участвует в композиции, а не иллюстрируется точкой.
 *
 * Вся анимация на SMIL и CSS: она предопределена, ничем не управляется из JS и
 * потому не отъедает главный поток. Параллакс — единственное, что слушает мышь.
 */

/** Маршруты сигналов. Один и тот же путь рисуется и служит траекторией. */
const PIPES = [
  {
    d: 'M -40 300 L 300 300 Q 340 300 340 260 L 340 150 Q 340 110 380 110 L 700 110 Q 740 110 740 150 L 740 250 Q 740 290 780 290 L 1240 290',
    dur: 9,
    delay: 0,
  },
  {
    d: 'M -40 180 L 160 180 Q 200 180 200 220 L 200 340 Q 200 380 240 380 L 560 380 Q 600 380 600 340 L 600 250 Q 600 210 640 210 L 1240 210',
    dur: 13,
    delay: 2.2,
  },
  {
    d: 'M 1240 380 L 900 380 Q 860 380 860 340 L 860 190 Q 860 150 820 150 L 480 150 Q 440 150 440 190 L 440 260 Q 440 300 400 300 L -40 300',
    dur: 16,
    delay: 5,
  },
  {
    // нижний маршрут: заполняет низ высокого блока
    d: 'M -40 440 L 240 440 Q 280 440 280 400 L 280 330 Q 280 290 320 290 L 700 290 Q 740 290 740 330 L 740 400 Q 740 440 780 440 L 1240 440',
    dur: 11,
    delay: 3.4,
  },
]

/** Ответвления — только рисунок, сигналы по ним не идут. */
const BRANCHES = [
  'M 340 200 L 180 200 Q 140 200 140 240 L 140 380',
  'M 740 200 L 900 200 Q 940 200 940 160 L 940 60',
  'M 520 110 L 520 30',
  'M 1020 290 L 1020 460',
  'M 200 260 L 60 260',
  'M 660 380 L 660 470',
  // нижний ярус: без него низ высокого блока остаётся пустым
  'M -40 460 L 300 460 Q 340 460 340 420 L 340 380',
  'M 780 440 L 1240 440',
  'M 460 470 L 460 380',
]

/**
 * Узлы с иконками. Держатся по краям схемы: центр отдан заголовку, иначе
 * иконка наезжает на текст и оба становятся нечитаемыми.
 */
const NODES = [
  { x: 140, y: 240, size: 30 },
  { x: 200, y: 380, size: 24 },
  { x: 340, y: 110, size: 26 },
  { x: 940, y: 105, size: 28 },
  { x: 1020, y: 330, size: 26 },
  { x: 1080, y: 200, size: 22 },
  { x: 280, y: 400, size: 24 },
  { x: 740, y: 440, size: 28 },
]

/** Узел с переключателем темы: в правом верхнем углу, где раньше была шапка. */
const THEME_NODE = { x: 1100, y: 90, size: 26 }

const VIEW_W = 1200
// холст выше самих маршрутов (они живут в 60..380): запас сверху и снизу не даёт
// slice срезать схему по бокам, когда блок становится высоким
const VIEW_H = 560

/** Маршруты нарисованы для холста 440 — опускаем их к центру нового. */
const PIPE_SHIFT = 60

type Props = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function Hero({ theme, onToggleTheme }: Props) {
  const ref = useRef<HTMLElement>(null)

  /**
   * Набор иконок для узлов выбирается один раз на загрузку страницы. Каждое
   * обновление даёт новую подборку, но во время просмотра схема стабильна —
   * мигающие иконки мешали бы читать заголовок.
   */
  const nodeIcons = useMemo(() => {
    if (ICONS.length === 0) return []
    const start = Math.floor(Math.random() * ICONS.length)
    // шаг 7 взаимно прост с длиной набора чаще, чем 1 — иконки не идут подряд
    return NODES.map((_, i) => ICONS[(start + i * 7) % ICONS.length])
  }, [])

  /**
   * Параллакс пишет CSS-переменные напрямую в DOM, без setState: ререндер
   * восьми узлов на каждое движение мыши — то, из-за чего эффект лагал.
   * Координаты копятся и применяются раз в кадр через rAF.
   */
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // на тач-устройствах курсора нет — слушать нечего
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let frame = 0
    let px = 0
    let py = 0

    const apply = () => {
      frame = 0
      el.style.setProperty('--px', String(px))
      el.style.setProperty('--py', String(py))
    }

    const onMove = (e: MouseEvent) => {
      const { width, height, top, left } = el.getBoundingClientRect()
      // -1..1 от центра секции, дальше умножается на амплитуду слоя
      px = ((e.clientX - left) / width - 0.5) * 2
      py = ((e.clientY - top) / height - 0.5) * 2
      if (!frame) frame = requestAnimationFrame(apply)
    }

    const onLeave = () => {
      px = 0
      py = 0
      if (!frame) frame = requestAnimationFrame(apply)
    }

    el.addEventListener('mousemove', onMove, { passive: true })
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <section
      ref={ref}
      className="relative overflow-hidden"
      style={{ borderBottom: '1px solid var(--line)' }}
      aria-labelledby="hero-title"
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        style={{ color: 'var(--line)' }}
      >
        <defs>
          <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
          {/* гасим схему только у самого низа — иначе нижний ярус пропадает */}
          <linearGradient id="hero-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bg)" stopOpacity="0" />
            <stop offset="82%" stopColor="var(--bg)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--bg)" stopOpacity="1" />
          </linearGradient>
          {/* мягкое свечение под сигналом */}
          <radialGradient id="hero-glow">
            <stop offset="0%" stopColor="#22c550" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#22c550" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* дальний слой: сетка, двигается слабее всех */}
        <g className="hero-layer hero-layer-far">
          <rect x="-40" y="-40" width={VIEW_W + 80} height={VIEW_H + 80} fill="url(#hero-grid)" opacity="0.6" />
        </g>

        {/* средний слой: сами трубы. PIPE_SHIFT центрирует их на высоком холсте */}
        <g className="hero-layer hero-layer-mid" style={{ '--shift': `${PIPE_SHIFT}px` } as React.CSSProperties}>
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            {BRANCHES.map((d) => (
              <path key={d} d={d} strokeWidth="10" opacity="0.45" />
            ))}
            {PIPES.map(({ d }) => (
              // двойная обводка даёт «трубу»: широкая внешняя + светлая внутренняя
              <g key={d}>
                <path d={d} strokeWidth="14" />
                <path d={d} strokeWidth="8" stroke="var(--bg)" />
              </g>
            ))}
          </g>

          {/* бегущая подсветка внутри трубы — маршрут читается до прихода сигнала */}
          {PIPES.map(({ d, dur, delay }) => (
            <path
              key={`trace-${d}`}
              d={d}
              pathLength={100}
              fill="none"
              stroke="#22c550"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.5"
              className="hero-trace"
              style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
            />
          ))}

          {/* сигналы: свечение + ядро + пульсирующее кольцо */}
          {PIPES.map(({ d, dur, delay }) => (
            <g key={`ball-${d}`} className="hero-ball">
              <circle r="26" fill="url(#hero-glow)" />
              <circle r="7" fill="#22c550" />
              <circle r="7" fill="none" stroke="#22c550" strokeWidth="1.5" opacity="0.4">
                <animate attributeName="r" values="7;18;7" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="1.8s" repeatCount="indefinite" />
              </circle>
              <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" path={d} />
            </g>
          ))}
        </g>

        <rect width={VIEW_W} height={VIEW_H} fill="url(#hero-fade)" />
      </svg>

      {/* ближний слой: иконки на узлах, поверх заливки, двигаются сильнее всех */}
      {ICONS.length > 0 && (
        <div className="hero-layer hero-layer-near pointer-events-none absolute inset-0">
          {/*
            Переключатель темы — такой же узел схемы, но с постоянной иконкой:
            меняющийся символ у элемента управления читался бы как сбой.
          */}
          <ThemeNode
            theme={theme}
            onToggle={onToggleTheme}
            x={THEME_NODE.x}
            y={THEME_NODE.y + PIPE_SHIFT}
            size={THEME_NODE.size}
          />

          {nodeIcons.map((icon, i) => {
            const node = NODES[i]
            return (
              <span
                key={i}
                aria-hidden="true"
                className="hero-node absolute flex items-center justify-center rounded-full"
                style={{
                  left: `${(node.x / VIEW_W) * 100}%`,
                  top: `${((node.y + PIPE_SHIFT) / VIEW_H) * 100}%`,
                  width: node.size * 2.1,
                  height: node.size * 2.1,
                  animationDelay: `${i * 90}ms`,
                }}
              >
                <Icon icon={icon} size={node.size} color="var(--fg)" weight="regular" />

                {/* выноска с именем: появляется при наведении на hero */}
                <span className="hero-node-label">
                  <span className="hero-node-line" />
                  <span className="hero-node-name font-mono">{icon.name}</span>
                </span>
              </span>
            )
          })}
        </div>
      )}

      {/* min-h держит высоту блока, py — воздух вокруг текста */}
      {/*
        pointer-events-none: блок текста растянут на всю ширину и иначе
        перехватывает мышь у кружков со схемы — подписи не появлялись.
        Самому тексту события возвращаются ниже, чтобы его можно было выделить.
      */}
      <div className="pointer-events-none relative mx-auto flex min-h-[68vh] max-w-6xl flex-col justify-center px-6 py-36 text-center">
        {/* h1 страницы: имя продукта. Крупная строка ниже — визуальный заголовок */}
        <h1 className="hero-eyebrow pointer-events-auto mb-6 font-mono text-xs font-normal" style={{ color: 'var(--muted)' }}>
          LUCEVIAS · {ICONS.length} icons
        </h1>
        <h2
          id="hero-title"
          className="hero-title pointer-events-auto text-[clamp(2.25rem,6vw,3.75rem)] font-light leading-[1.05]"
          style={{ letterSpacing: '-0.03em' }}
        >
          Icons, ready to ship
        </h2>
        <p
          className="hero-sub pointer-events-auto mx-auto mt-6 max-w-lg text-[18px]"
          style={{ color: 'var(--muted)' }}
        >
          {ICONS.length} icons, six weights, export to SVG, PNG and code for six platforms.
        </p>
      </div>
    </section>
  )
}

/**
 * Узел-переключатель темы. Выглядит как остальные кружки схемы, но иконка в нём
 * постоянная (солнце/месяц), а клик запускает круговое раскрытие новой темы
 * через View Transitions API — там, где он есть.
 */
function ThemeNode({
  theme,
  onToggle,
  x,
  y,
  size,
}: {
  theme: 'light' | 'dark'
  onToggle: () => void
  x: number
  y: number
  size: number
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const isDark = theme === 'dark'

  const handleClick = () => {
    const el = ref.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!el || reduced || !('startViewTransition' in document)) {
      onToggle()
      return
    }

    // координаты снимаем до перехода: внутри колбэка слой уже может сместиться
    const { top, left, width, height } = el.getBoundingClientRect()
    const cx = left + width / 2
    const cy = top + height / 2
    // радиус до дальнего угла: круг обязан накрыть весь экран
    const end = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy))

    const transition = document.startViewTransition(onToggle)

    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${end}px at ${cx}px ${cy}px)`] },
          {
            duration: 460,
            easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        )
      })
      // если переход сорвался (быстрый повторный клик), тема всё равно применена
      .catch(() => {})
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
      className="hero-node-theme absolute flex items-center justify-center rounded-full"
      style={{
        left: `${(x / VIEW_W) * 100}%`,
        top: `${(y / VIEW_H) * 100}%`,
        width: size * 2.1,
        height: size * 2.1,
      }}
    >
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <mask id="hero-theme-mask">
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <circle
            cx={isDark ? 10 : 24}
            cy={isDark ? 6 : 0}
            r="6"
            fill="black"
            style={{ transition: 'cx 400ms var(--ease-snap), cy 400ms var(--ease-snap)' }}
          />
        </mask>

        <circle
          cx="12"
          cy="12"
          r={isDark ? 8 : 5}
          fill="currentColor"
          mask="url(#hero-theme-mask)"
          style={{ transition: 'r 400ms var(--ease-snap)' }}
        />

        <g
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          style={{
            opacity: isDark ? 0 : 1,
            transform: isDark ? 'rotate(-25deg) scale(0.6)' : 'none',
            transformOrigin: 'center',
            transition: 'opacity 400ms var(--ease-snap), transform 400ms var(--ease-snap)',
          }}
        >
          <path d="M12 1.5v2M12 20.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1.5 12h2M20.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </g>
      </svg>
    </button>
  )
}
