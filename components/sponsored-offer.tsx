"use client"

import { useEffect, useRef } from "react"
import { ExternalLink } from "lucide-react"
import { track } from "@vercel/analytics"
import { ADS_ENABLED, SMARTLINK } from "@/lib/ads"

export function SponsoredOffer({ placement, className = "" }: { placement: string; className?: string }) {
  const ref = useRef<HTMLElement>(null)
  const viewed = useRef(false)

  useEffect(() => {
    if (!ref.current || !ADS_ENABLED || viewed.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        viewed.current = true
        track("sponsored_offer_view", { placement, smartlink: SMARTLINK.id })
        observer.disconnect()
      }
    }, { threshold: 0.5 })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [placement])

  return (
    <aside ref={ref} aria-label="Sponsored offers" className={`rounded-2xl border border-border/70 bg-card p-5 sm:p-6 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Sponsored · 18+</p>
          <h2 className="mt-2 font-serif text-xl font-semibold">Explore sponsored offers</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Third-party adult advertising. Opens in a new tab; your place in the gallery stays here.</p>
        </div>
        <a href={ADS_ENABLED ? SMARTLINK.url : undefined} aria-disabled={!ADS_ENABLED || undefined} target="_blank" rel="sponsored nofollow noopener noreferrer" onClick={(event) => {
          if (!ADS_ENABLED) { event.preventDefault(); return }
          track("sponsored_offer_click", { placement, smartlink: SMARTLINK.id })
        }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          View sponsored offers <ExternalLink className="size-4" aria-hidden="true" />
          <span className="sr-only"> (18+, opens a new tab)</span>
        </a>
      </div>
      {!ADS_ENABLED && <p className="mt-3 text-xs text-muted-foreground">Preview only · sponsored links are disabled</p>}
    </aside>
  )
}
