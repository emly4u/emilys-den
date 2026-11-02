'use client'

import { useEffect, useRef } from 'react'

interface Props {
  adKey: string
  width: number
  height: number
}

let loadQueue: Promise<void> = Promise.resolve()

export function AdsterraBanner({ adKey, width, height }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let cancelled = false
    let script: HTMLScriptElement | null = null

    const prev = loadQueue
    loadQueue = new Promise<void>((resolve) => {
      prev.then(() => {
        if (cancelled) { resolve(); return }
        ;(window as any).atOptions = { key: adKey, format: 'iframe', height, width, params: {} }
        script = document.createElement('script')
        script.setAttribute('data-cfasync', 'false')
        script.src = `https://brijmohan.org/22/${adKey}`
        const fallback = setTimeout(resolve, 1500)
        script.onload = () => { clearTimeout(fallback); setTimeout(resolve, 50) }
        script.onerror = () => { clearTimeout(fallback); resolve() }
        el.appendChild(script)
      })
    })

    return () => {
      cancelled = true
      script?.parentNode?.removeChild(script)
    }
  }, [adKey, width, height])

  return <div ref={ref} style={{ width, height, overflow: 'hidden', margin: '0 auto' }} />
}
