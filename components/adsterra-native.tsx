'use client'

import { useEffect } from 'react'

const NATIVE_ID = '3a7c471205865254ca4cfe9c423be27d'

export function AdsterraNative() {
  useEffect(() => {
    const s = document.createElement('script')
    s.async = true
    s.setAttribute('data-cfasync', 'false')
    s.src = `https://brijmohan.org/21/${NATIVE_ID}`
    document.body.appendChild(s)
    return () => { s.parentNode?.removeChild(s) }
  }, [])

  return <div id={`container-${NATIVE_ID}`} />
}
