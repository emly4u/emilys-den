'use client'

import { useEffect, useRef } from 'react'

interface Props {
  adKey: string
  width: number
  height: number
}

export function AdsterraBanner({ adKey, width, height }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ;(window as any).atOptions = { key: adKey, format: 'iframe', height, width, params: {} }
    const s = document.createElement('script')
    s.setAttribute('data-cfasync', 'false')
    s.src = `https://brijmohan.org/22/${adKey}`
    ref.current.appendChild(s)
    return () => { s.parentNode?.removeChild(s) }
  }, [adKey, width, height])

  return <div ref={ref} style={{ width, height, overflow: 'hidden', margin: '0 auto' }} />
}
