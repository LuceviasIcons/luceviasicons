import { useCallback, useEffect, useRef, useState } from 'react'

/** Копирование в буфер с подтверждением на пару секунд и фолбэком для http. */
export function useCopy(resetMs = 1600) {
  const [copied, setCopied] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = useCallback(
    async (text: string, key = 'default') => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text)
        } else {
          const ta = document.createElement('textarea')
          ta.value = text
          ta.style.position = 'fixed'
          ta.style.opacity = '0'
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          ta.remove()
        }
        setCopied(key)
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setCopied(null), resetMs)
        return true
      } catch {
        return false
      }
    },
    [resetMs],
  )

  return { copy, copied }
}
