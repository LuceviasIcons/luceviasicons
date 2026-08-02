/**
 * Проверка доступности каталога: `npm run a11y` (нужен запущенный `npm run dev`).
 *
 * Гоняет axe-core в headless-браузере по живой странице — сначала по сетке,
 * затем с открытой деталкой, потому что половина интерактива живёт в ней.
 * Падает с ненулевым кодом, если есть нарушения serious/critical.
 */
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')

const URL = process.env.URL ?? 'http://localhost:5173/'
const PORT = 9333

/** Находит скачанный Playwright-браузер; без него проверку не запустить. */
function chromeBinary() {
  const base = `${process.env.HOME}/Library/Caches/ms-playwright`
  const candidates = [
    `${base}/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell`,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ]
  return candidates.find((p) => {
    try {
      readFileSync(p)
      return true
    } catch {
      return false
    }
  })
}

const BIN = chromeBinary()
if (!BIN) {
  console.error('Не найден headless-браузер. Установите: npx playwright install chromium')
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const chrome = spawn(BIN, [
  `--remote-debugging-port=${PORT}`,
  '--headless',
  '--disable-gpu',
  '--window-size=1440,900',
  'about:blank',
])

await sleep(1500)

const { webSocketDebuggerUrl } = await fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) =>
  r.json(),
)
const ws = new WebSocket(webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))

let id = 0
const pending = new Map()
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result)
    pending.delete(msg.id)
  }
}
const send = (method, params = {}, sessionId) =>
  new Promise((res) => {
    const msgId = ++id
    pending.set(msgId, res)
    ws.send(JSON.stringify({ id: msgId, method, params, sessionId }))
  })

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
await send('Page.enable', {}, sessionId)
await send('Runtime.enable', {}, sessionId)
await send('Page.navigate', { url: URL }, sessionId)
await sleep(2500)

const evaluate = (expression) =>
  send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId)

await evaluate(AXE)

/** Прогон axe и разбор нарушений. */
async function audit(label) {
  const { result } = await evaluate(`
    axe.run(document, { resultTypes: ['violations'] })
      .then(r => JSON.stringify(r.violations.map(v => ({
        id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length,
      }))))
  `)
  const violations = JSON.parse(result.value ?? '[]')
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')

  console.log(`\n${label}: ${violations.length === 0 ? 'нарушений нет' : `${violations.length} нарушений`}`)
  for (const v of violations) {
    console.log(`  [${v.impact}] ${v.id} — ${v.help} (${v.nodes} эл.)`)
  }
  return serious.length
}

let failures = await audit('Каталог')

// деталка: открываем первую иконку и проверяем ещё раз
await evaluate(`document.querySelector('.icon-tile')?.click()`)
await sleep(600)
failures += await audit('Деталка')

ws.close()
chrome.kill()

if (failures > 0) {
  console.error(`\nЕсть ${failures} нарушений уровня serious/critical.`)
  process.exit(1)
}
console.log('\nПроверка пройдена.')
