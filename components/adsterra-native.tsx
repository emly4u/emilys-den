'use client'

import { useEffect, useRef } from 'react'

const NATIVE_ID = '3a7c471205865254ca4cfe9c423be27d'

export function AdsterraNative() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const s = document.createElement('script')
    s.async = true
    s.setAttribute('data-cfasync', 'false')
    s.src = `https://brijmohan.org/21/${NATIVE_ID}`
    ref.current.appendChild(s)
    return () => { s.parentNode?.removeChild(s) }
  }, [])

  return <div ref={ref} id={`container-${NATIVE_ID}`} />
}
