"use client"

import { useEffect, useRef, useState } from "react"
import { AD_SCRIPT_ORIGIN, ADS_ENABLED, BANNER_UNITS, NATIVE_KEY, bannerForWidth, type BannerUnit } from "@/lib/ads"

// Hidden and off-screen slots never request an ad. Measure the actual available
// width: a desktop viewport can still contain a narrow sidebar or gallery.
function useAdSpace() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [nearby, setNearby] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const resize = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    resize.observe(element)
    const visibility = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && element.getBoundingClientRect().width > 0) {
        setNearby(true)
        visibility.disconnect()
      }
    }, { rootMargin: "200px" })
    visibility.observe(element)
    return () => { resize.disconnect(); visibility.disconnect() }
  }, [])

  return { ref, width, nearby }
}

export function BannerAd({ unit, className }: { unit?: BannerUnit; className?: string }) {
  const { ref, width, nearby } = useAdSpace()
  const selected = unit ? (width >= unit.width ? unit : null) : bannerForWidth(width)
  const height = selected?.height ?? unit?.height ?? 90
  // Parser-inserted scripts inside srcDoc support document.write and give every
  // banner its own atOptions, avoiding races between simultaneously loaded units.
  const srcDoc = selected ? `<!doctype html><html><head><meta name="referrer" content="strict-origin-when-cross-origin"></head><body style="margin:0;overflow:hidden;background:transparent"><script>var atOptions=${JSON.stringify({ key: selected.key, format: "iframe", height: selected.height, width: selected.width, params: {} })};</script><script data-cfasync="false" src="${AD_SCRIPT_ORIGIN}/22/${selected.key}"></script></body></html>` : undefined

  return (
    <div ref={ref} className={className} data-ad-slot="banner" data-ad-width={selected?.width} aria-label="Advertisement">
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Advertisement</p>
      <div className="flex items-center justify-center overflow-hidden rounded-xl bg-muted/30" style={{ minHeight: height }}>
        {nearby && selected && ADS_ENABLED ? (
          <iframe key={selected.key} title={`Advertisement ${selected.width} × ${selected.height}`} srcDoc={srcDoc} width={selected.width} height={selected.height} scrolling="no" loading="lazy" className="block border-0 [color-scheme:light]" />
        ) : !ADS_ENABLED ? (
          <span className="px-4 text-center text-xs text-muted-foreground">Ad preview · live ads are disabled</span>
        ) : null}
      </div>
    </div>
  )
}

export function ResponsiveBannerAd({ className }: { className?: string }) {
  return <BannerAd className={className} />
}

export function RectangleAd({ className }: { className?: string }) {
  return <BannerAd unit={BANNER_UNITS.rectangle} className={className} />
}

export function RailAd({ side }: { side: "left" | "right" }) {
  return <BannerAd unit={side === "left" ? BANNER_UNITS.leftRail : BANNER_UNITS.rightRail} className="w-40" />
}

export function NativeBannerAd({ className }: { className?: string }) {
  const { ref, width, nearby } = useAdSpace()
  const containerRef = useRef<HTMLDivElement>(null)
  const canLoad = nearby && width > 0 && ADS_ENABLED

  useEffect(() => {
    const container = containerRef.current
    if (!container || !canLoad) return
    const script = document.createElement("script")
    script.async = true
    script.dataset.cfasync = "false"
    script.src = `${AD_SCRIPT_ORIGIN}/21/${NATIVE_KEY}`
    container.appendChild(script)
    return () => { script.remove(); container.replaceChildren() }
  }, [canLoad])

  return (
    <div ref={ref} className={className} data-ad-slot="native" aria-label="Advertisement">
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Advertisement</p>
      <div className="min-h-24 rounded-xl bg-muted/30 p-3">
        <div ref={containerRef} id={`container-${NATIVE_KEY}`} />
        {!ADS_ENABLED && <p className="py-6 text-center text-xs text-muted-foreground">Native ad preview · live ads are disabled</p>}
      </div>
    </div>
  )
}
