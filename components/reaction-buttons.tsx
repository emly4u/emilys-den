"use client"

import { useState, useTransition } from "react"
import { ThumbsDown, ThumbsUp } from "lucide-react"
import { reactToImage } from "@/app/actions/gallery"
import { buttonVariants } from "@/components/ui/button"

export function ReactionButtons({ imageId }: { imageId: number }) {
  const [active, setActive] = useState<"like" | "dislike" | null>(null)
  const [counts, setCounts] = useState({ like: 0, dislike: 0 })
  const [isPending, startTransition] = useTransition()

  function react(direction: "like" | "dislike") {
    startTransition(async () => {
      const result = await reactToImage(imageId, direction)
      setActive(result.active)
      setCounts({ like: result.like, dislike: result.dislike })
    })
  }

  return (
    <div className="flex items-center gap-2" onClick={(event) => event.preventDefault()}>
      <button type="button" aria-label="Like image" aria-pressed={active === "like"} disabled={isPending} onClick={() => react("like")} className={buttonVariants({ variant: active === "like" ? "default" : "outline", size: "sm", className: "gap-1.5" })}>
        <ThumbsUp className="size-3.5" aria-hidden="true" /> {counts.like}
      </button>
      <button type="button" aria-label="Dislike image" aria-pressed={active === "dislike"} disabled={isPending} onClick={() => react("dislike")} className={buttonVariants({ variant: active === "dislike" ? "default" : "outline", size: "sm", className: "gap-1.5" })}>
        <ThumbsDown className="size-3.5" aria-hidden="true" /> {counts.dislike}
      </button>
    </div>
  )
}

export function ReactionButtonsPlaceholder() {
  return null
}

export function ReactionButtonsForCard({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsWithLabel({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsCompact({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsInline({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsForGallery({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsSmall({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsCard({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsMini({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsToolbar({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsAction({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsView({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsWidget({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsControl({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsPanel({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsMenu({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsActions({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsFooter({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsRow({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsGroup({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsActionsBar({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}

export function ReactionButtonsImage({ imageId }: { imageId: number }) {
  return <ReactionButtons imageId={imageId} />
}
