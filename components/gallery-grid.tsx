"use client"

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Eye, Heart, Images, Loader2, MessageCircle, ThumbsDown, X } from "lucide-react"
import { MotionImage } from "@/components/animation-toggle"
import { loadMoreImages, reactToImage } from "@/app/actions/gallery"
import { IMAGES_PAGE_SIZE, type ImageSort, type ImageWithCount } from "@/lib/images"
import { buttonVariants } from "@/components/ui/button"

function ReactionButton({ direction, count, active, pending, onClick }: { direction: "like" | "dislike"; count: number; active: boolean; pending: boolean; onClick: () => void }) {
  const isLike = direction === "like"
  return <button type="button" aria-label={`${isLike ? "Like" : "Dislike"} image (${count})`} aria-pressed={active} disabled={pending} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onClick() }} className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border px-3 text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60 ${active ? "border-primary bg-primary text-primary-foreground" : "border-border/80 bg-background/85 text-foreground backdrop-blur-md hover:border-primary/70 hover:bg-primary/15"}`}>
    {isLike ? <Heart className={active ? "fill-current" : ""} aria-hidden="true" /> : <ThumbsDown aria-hidden="true" />}
    <span>{count}</span>
  </button>
}

function tiltCard(event: ReactPointerEvent<HTMLElement>) {
  const card = event.currentTarget
  const bounds = card.getBoundingClientRect()
  const rotateX = ((event.clientY - bounds.top) / bounds.height - 0.5) * -7
  const rotateY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 7
  card.style.transform = `perspective(1000px) translateY(-8px) scale(1.015) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
}

function resetCardTilt(event: ReactPointerEvent<HTMLElement>) {
  event.currentTarget.style.removeProperty("transform")
}

export function GalleryGrid({ initialImages, initialHasMore, sort }: { initialImages: ImageWithCount[]; initialHasMore: boolean; sort: ImageSort }) {
  const [images, setImages] = useState(initialImages)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [pendingReaction, setPendingReaction] = useState<number | null>(null)
  const [reactionState, setReactionState] = useState<Record<number, "like" | "dislike">>({})
  const [cachedCount, setCachedCount] = useState(0)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)
  const preloadedUrls = useRef(new Set<string>())

  useEffect(() => { setImages(initialImages); setHasMore(initialHasMore) }, [initialImages, initialHasMore])
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return
    loadingRef.current = true; setLoading(true)
    try { const page = await loadMoreImages(sort, images.length); setImages((prev) => { const seen = new Set(prev.map((i) => i.id)); return [...prev, ...page.images.filter((i) => !seen.has(i.id))] }); setHasMore(page.hasMore) } finally { loadingRef.current = false; setLoading(false) }
  }, [hasMore, images.length, sort])
  useEffect(() => { const el = sentinelRef.current; if (!el || !hasMore) return; const observer = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) loadMore() }, { rootMargin: "600px" }); observer.observe(el); return () => observer.disconnect() }, [hasMore, loadMore])

  useEffect(() => {
    let cancelled = false
    async function preloadAll() {
      if (!("caches" in window)) return
      const cache = await caches.open("emilys-den-images-v1")
      const urls = images.map((image) => image.blobUrl).filter(Boolean) as string[]
      let count = 0
      for (const url of urls) {
        if (cancelled) return
        if (!preloadedUrls.current.has(url)) {
          preloadedUrls.current.add(url)
          try { if (!(await cache.match(url))) await cache.add(url) } catch { /* a single unavailable image should not stop the queue */ }
        }
        count += 1
        setCachedCount(count)
      }
    }
    preloadAll()
    return () => { cancelled = true }
  }, [images])

  async function react(imageId: number, direction: "like" | "dislike") {
    if (pendingReaction === imageId) return
    const previous = images.find((image) => image.id === imageId)
    if (!previous) return
    setPendingReaction(imageId)
    setReactionState((current) => ({ ...current, [imageId]: direction }))
    setImages((current) => current.map((image) => image.id === imageId ? { ...image, likeCount: image.likeCount + (direction === "like" ? 1 : 0), dislikeCount: image.dislikeCount + (direction === "dislike" ? 1 : 0) } : image))
    try {
      const result = await reactToImage(imageId, direction)
      setImages((current) => current.map((image) => image.id === imageId ? { ...image, likeCount: result.like, dislikeCount: result.dislike } : image))
    } catch {
      setImages((current) => current.map((image) => image.id === imageId ? previous : image))
    } finally { setPendingReaction(null) }
  }

  const active = images[activeIndex]
  function move(delta: number) { setActiveIndex((index) => (index + delta + images.length) % images.length) }

  return <>
    {cachedCount > 0 && <div className="fixed bottom-6 right-6 z-40 flex max-w-[calc(100vw-3rem)] items-center gap-4 rounded-3xl border border-primary/40 bg-card/85 p-3 pr-5 text-sm text-foreground/80 opacity-45 shadow-2xl shadow-background/50 backdrop-blur-xl transition-all duration-300 hover:border-primary/70 hover:bg-card/95 hover:opacity-100 hover:shadow-primary/15"><span className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/20 shadow-lg"><img src="/img/background.gif" alt="" aria-hidden="true" className="size-full object-cover" /></span><span><strong className="block text-foreground">Preloading the den</strong><span>{cachedCount} images stored in cache</span></span><Check className="ml-auto shrink-0 text-primary" aria-hidden="true" /></div>}
    <div className="mb-6 flex justify-end"><button type="button" onClick={() => { setActiveIndex(0); setGalleryOpen(true) }} className={buttonVariants({ variant: "outline", className: "gap-2 border-border/80 bg-card/80 px-4 py-2.5 shadow-sm hover:border-primary/70 hover:bg-primary/10" })}><Images aria-hidden="true" /> Gallery mode</button></div>
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {images.map((image, index) => <article key={image.id} data-gallery-card onPointerMove={tiltCard} onPointerLeave={resetCardTilt} className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md transition-[transform,box-shadow,border-color] duration-200 ease-out [transform-style:preserve-3d] will-change-transform hover:z-10 hover:border-primary/80 hover:shadow-2xl hover:shadow-primary/25">
        <Link href={`/image/${image.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"><MotionImage><Image src={image.blobUrl || "/placeholder.svg"} alt={image.name} width={900} height={1100} sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" loading={index < IMAGES_PAGE_SIZE ? "eager" : "lazy"} priority={index < 4} fetchPriority={index < 4 ? "high" : "auto"} unoptimized className="h-auto max-h-[76vh] min-h-80 w-full object-cover" /></MotionImage></Link>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-background via-background/80 to-transparent p-4 pt-16"><Link href={`/image/${image.id}`} className="min-w-0"><span className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">{image.name}</span><span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><Eye aria-hidden="true" />{image.views}<MessageCircle aria-hidden="true" />{image.commentCount}</span></Link><div className="flex shrink-0 gap-2"><ReactionButton direction="like" count={image.likeCount} active={reactionState[image.id] === "like"} pending={pendingReaction === image.id} onClick={() => react(image.id, "like")} /><ReactionButton direction="dislike" count={image.dislikeCount} active={reactionState[image.id] === "dislike"} pending={pendingReaction === image.id} onClick={() => react(image.id, "dislike")} /></div></div>
      </article>)}
    </div>
    {hasMore && <div ref={sentinelRef} className="flex items-center justify-center py-12 text-muted-foreground" aria-live="polite">{loading && <span className="flex items-center gap-2 text-sm"><Loader2 className="animate-spin" aria-hidden="true" />Loading more images</span>}</div>}
    {galleryOpen && active && <div role="dialog" aria-modal="true" aria-label="Gallery mode" className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-md" onKeyDown={(event) => { if (event.key === "Escape") setGalleryOpen(false); if (event.key === "ArrowLeft") move(-1); if (event.key === "ArrowRight") move(1) }} tabIndex={-1} autoFocus><button type="button" aria-label="Close gallery" onClick={() => setGalleryOpen(false)} className="absolute right-5 top-5 rounded-full border border-border bg-card p-3 text-foreground shadow-lg hover:border-primary"><X aria-hidden="true" /></button><button type="button" aria-label="Previous image" onClick={() => move(-1)} className="absolute left-4 rounded-full border border-border bg-card p-4 text-foreground shadow-lg hover:border-primary"><ArrowLeft aria-hidden="true" /></button><div className="flex max-h-full max-w-6xl flex-col items-center gap-4"><div className="relative max-h-[80vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"><Image src={active.blobUrl || "/placeholder.svg"} alt={active.name} width={1400} height={1400} unoptimized className="max-h-[80vh] w-auto object-contain" /></div><div className="flex flex-wrap items-center justify-center gap-3 text-center"><span className="max-w-[35vw] truncate font-medium">{active.name}</span><ReactionButton direction="like" count={active.likeCount} active={false} pending={pendingReaction === active.id} onClick={() => react(active.id, "like")} /><ReactionButton direction="dislike" count={active.dislikeCount} active={false} pending={pendingReaction === active.id} onClick={() => react(active.id, "dislike")} /><Link href={`/image/${active.id}`} className="rounded-full border border-border px-4 py-2 text-sm underline-offset-4 hover:border-primary hover:underline">Open details</Link></div></div><button type="button" aria-label="Next image" onClick={() => move(1)} className="absolute right-4 rounded-full border border-border bg-card p-4 text-foreground shadow-lg hover:border-primary"><ArrowRight aria-hidden="true" /></button></div>}
  </>
}
