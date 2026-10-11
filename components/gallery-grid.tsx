"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ArrowUpRight, Eye, Heart, Images, Loader2, MessageCircle, ThumbsDown, X } from "lucide-react"
import { MotionImage } from "@/components/animation-toggle"
import { loadMoreImages, reactToImage } from "@/app/actions/gallery"
import { IMAGES_PAGE_SIZE, type ImageSort, type ImageWithCount } from "@/lib/images"
import { buttonVariants } from "@/components/ui/button"

export function GalleryGrid({ initialImages, initialHasMore, sort }: { initialImages: ImageWithCount[]; initialHasMore: boolean; sort: ImageSort }) {
  const [images, setImages] = useState(initialImages)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
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
  useEffect(() => { const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-gallery-card]")); const observer = new IntersectionObserver((entries) => { for (const entry of entries) { if (!entry.isIntersecting) continue; const url = entry.target.getAttribute("data-image-url"); if (!url || preloadedUrls.current.has(url)) continue; preloadedUrls.current.add(url); const image = new window.Image(); image.decoding = "async"; image.src = url; observer.unobserve(entry.target) } }, { rootMargin: "1000px 0px" }); cards.forEach((card) => observer.observe(card)); return () => observer.disconnect() }, [images])

  async function react(imageId: number, direction: "like" | "dislike") { const result = await reactToImage(imageId, direction); setImages((current) => current.map((image) => image.id === imageId ? { ...image, likeCount: result.like, dislikeCount: result.dislike } : image)) }
  const active = images[activeIndex]
  function move(delta: number) { setActiveIndex((index) => (index + delta + images.length) % images.length) }

  return <>
    <div className="mb-5 flex justify-end"><button type="button" onClick={() => { setActiveIndex(0); setGalleryOpen(true) }} className={buttonVariants({ variant: "outline", className: "gap-2" })}><Images className="size-4" aria-hidden="true" /> Gallery mode</button></div>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {images.map((image, index) => <div key={image.id} data-gallery-card data-image-url={image.blobUrl || undefined} className="group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
        <Link href={`/image/${image.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"><MotionImage><Image src={image.blobUrl || "/placeholder.svg"} alt={image.name} width={600} height={600} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" loading={index < IMAGES_PAGE_SIZE ? "eager" : "lazy"} priority={index < 4} fetchPriority={index < 4 ? "high" : "auto"} unoptimized className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" /></MotionImage></Link>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-foreground/90 to-transparent p-3 pt-10 text-background"><Link href={`/image/${image.id}`} className="min-w-0"><span className="line-clamp-2 text-sm font-semibold leading-5">{image.name}</span><span className="mt-1 flex items-center gap-2 text-xs text-background/80"><Eye className="size-3.5" aria-hidden="true" />{image.views}<MessageCircle className="size-3.5" aria-hidden="true" />{image.commentCount}</span></Link><div className="flex shrink-0 gap-1"><button type="button" aria-label={`Like ${image.name}`} onClick={() => react(image.id, "like")} className="rounded-full bg-background/15 p-2 backdrop-blur hover:bg-background/30"><Heart className="size-4" aria-hidden="true" /><span className="sr-only">{image.likeCount}</span></button><button type="button" aria-label={`Dislike ${image.name}`} onClick={() => react(image.id, "dislike")} className="rounded-full bg-background/15 p-2 backdrop-blur hover:bg-background/30"><ThumbsDown className="size-4" aria-hidden="true" /><span className="sr-only">{image.dislikeCount}</span></button></div></div>
      </div>)}
    </div>
    {hasMore && <div ref={sentinelRef} className="flex items-center justify-center py-12 text-muted-foreground" aria-live="polite">{loading && <span className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" aria-hidden="true" />Loading more images</span>}</div>}
    {galleryOpen && active && <div role="dialog" aria-modal="true" aria-label="Gallery mode" className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90 p-4" onKeyDown={(event) => { if (event.key === "Escape") setGalleryOpen(false); if (event.key === "ArrowLeft") move(-1); if (event.key === "ArrowRight") move(1) }} tabIndex={-1} autoFocus><button type="button" aria-label="Close gallery" onClick={() => setGalleryOpen(false)} className="absolute right-5 top-5 rounded-full bg-background/15 p-3 text-background hover:bg-background/30"><X className="size-5" /></button><button type="button" aria-label="Previous image" onClick={() => move(-1)} className="absolute left-4 rounded-full bg-background/15 p-3 text-background hover:bg-background/30"><ArrowLeft className="size-6" /></button><div className="flex max-h-full max-w-5xl flex-col items-center gap-4"><div className="relative max-h-[75vh] overflow-hidden rounded-2xl bg-card"><Image src={active.blobUrl || "/placeholder.svg"} alt={active.name} width={1200} height={1200} unoptimized className="max-h-[75vh] w-auto object-contain" /></div><div className="flex items-center gap-4 text-center text-background"><span className="font-medium">{active.name}</span><button type="button" aria-label="Like current image" onClick={() => react(active.id, "like")}><Heart className="size-5" /></button><button type="button" aria-label="Dislike current image" onClick={() => react(active.id, "dislike")}><ThumbsDown className="size-5" /></button><Link href={`/image/${active.id}`} className="underline underline-offset-4">Open details</Link></div></div><button type="button" aria-label="Next image" onClick={() => move(1)} className="absolute right-4 rounded-full bg-background/15 p-3 text-background hover:bg-background/30"><ArrowRight className="size-6" /></button></div>}
  </>
}
