"use client"

import Image from "next/image"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Heart, ThumbsDown, X } from "lucide-react"
import { reactToImage } from "@/app/actions/gallery"
import type { ImageWithCount } from "@/lib/images"

export function GalleryCarousel({ images, onClose }: { images: ImageWithCount[]; onClose: () => void }) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * images.length))
  const [votes, setVotes] = useState<Record<number, "like" | "dislike">>({})
  const image = images[index]

  function move(delta: number) {
    setIndex((current) => (current + delta + images.length) % images.length)
  }

  async function vote(vote: "like" | "dislike") {
    setVotes((current) => ({ ...current, [image.id]: vote }))
    await reactToImage(image.id, vote)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Random gallery">
      <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full border border-border bg-card p-3 text-muted-foreground hover:text-foreground" aria-label="Close gallery"><X className="size-5" /></button>
      <button type="button" onClick={() => move(-1)} className="absolute left-3 rounded-full border border-border bg-card p-3" aria-label="Previous image"><ChevronLeft className="size-6" /></button>
      <div className="flex max-h-[90vh] max-w-5xl flex-col items-center gap-4">
        <Image src={image.blobUrl || "/placeholder.svg"} alt={image.name} width={1200} height={1200} unoptimized className="max-h-[72vh] w-auto rounded-2xl object-contain" priority />
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => vote("like")} aria-pressed={votes[image.id] === "like"} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${votes[image.id] === "like" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}><Heart className="size-4" /> Like</button>
          <button type="button" onClick={() => vote("dislike")} aria-pressed={votes[image.id] === "dislike"} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${votes[image.id] === "dislike" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}><ThumbsDown className="size-4" /> Dislike</button>
          <span className="text-sm text-muted-foreground">{index + 1} / {images.length}</span>
        </div>
        <p className="max-w-xl truncate text-sm text-muted-foreground">{image.name}</p>
      </div>
      <button type="button" onClick={() => move(1)} className="absolute right-3 rounded-full border border-border bg-card p-3" aria-label="Next image"><ChevronRight className="size-6" /></button>
    </div>
  )
}

export function GalleryModeButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Gallery mode</button>
}

export function GalleryMode({ images }: { images: ImageWithCount[] }) {
  const [open, setOpen] = useState(false)
  return <>{open ? <GalleryCarousel images={images} onClose={() => setOpen(false)} /> : null}<GalleryModeButton onClick={() => setOpen(true)} /></>
}

export function GalleryModeControls({ images }: { images: ImageWithCount[] }) { return <GalleryMode images={images} /> }

export default GalleryCarousel
