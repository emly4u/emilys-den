'use client'

import { useEffect } from 'react'

interface Props {
  adKey: string
  width: number
  height: number
}

export function AdsterraBanner({ adKey, width, height }: Props) {
  useEffect(() => {
    ;(window as any).atOptions = { key: adKey, format: 'iframe', height, width, params: {} }
    const s = document.createElement('script')
    s.setAttribute('data-cfasync', 'false')
    s.src = `https://brijmohan.org/22/${adKey}`
    document.body.appendChild(s)
    return () => { s.parentNode?.removeChild(s) }
  }, [adKey, width, height])

  return <div style={{ width, height, overflow: 'hidden', margin: '0 auto' }} />
}
