import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { after } from "next/server"
import { ArrowLeft, Eye } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { CopyLink } from "@/components/copy-link"
import { CommentSection } from "@/components/comment-section"
import { ImageActions } from "@/components/image-actions"
import { ImageContextMenu } from "@/components/image-context-menu"
import { ImageMotionButton, MotionImage } from "@/components/animation-toggle"
import { WindCanvas } from "@/components/wind-image"
import { AdsterraBanner } from "@/components/adsterra-banner"
import { buttonVariants } from "@/components/ui/button"
import { incrementView } from "@/app/actions/gallery"
import { getComments, getImage } from "@/lib/queries"
import { getPublicImageUrl } from "@/lib/images"

export const dynamic = "force-dynamic"

// Shared promo tags/handle embedded in every image's metadata for indexing.
const TAGS = [
  "emly4u",
  "emly_kate",
  "emily_kate",
  "emily4u",
  "just_emly4u",
  "just_emily4u",
  "justemily4u",
  "justemly4u",
  "Emily Kate",
  "Emly Kate",
  "Hot Emily Kate",
  "Cute Emily Kate",
  "Goth Girl Emily",
  "AI wife",
]
const X_HANDLE = "@just_emly4u"
const X_URL = "https://x.com/just_emly4u"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const imageId = Number(id)
  if (!Number.isInteger(imageId)) return { title: "Image — Emily's Den" }

  const image = await getImage(imageId)
  if (!image) return { title: "Image not found — Emily's Den" }

  const title = `${image.name} — Emily's Den`
  const description = `${image.name} · #emly4u #Emily Kate #just_emly4u · ${X_URL}`
  const url = `https://emly4u.vercel.app/image/${imageId}`
  const previewImage = `https://emly4u.vercel.app${getPublicImageUrl(image.id)}`

  return {
    title,
    description,
    keywords: [...TAGS, image.name],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: "Emily's Den",
      images: [{ url: previewImage, alt: image.name }],
    },
    twitter: {
      card: "summary_large_image",
      site: X_HANDLE,
      creator: X_HANDLE,
      title,
      description,
      images: [previewImage],
    },
    other: {
      "twitter:url": X_URL,
    },
  }
}

export default async function ImagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const imageId = Number(id)
  if (!Number.isInteger(imageId)) notFound()

  const image = await getImage(imageId)
  if (!image) notFound()

  const thumbnailUrl = getPublicImageUrl(image.id)

  // Count this open as a view, after the response is sent so it never blocks render.
  after(async () => {
    try {
      await incrementView(imageId)
    } catch (err) {
      console.log("[v0] view increment error:", err instanceof Error ? err.message : String(err))
    }
  })

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="flex items-start justify-center gap-4 px-2 md:px-4">
        <aside className="hidden xl:flex flex-col gap-4 pt-10 sticky top-4 self-start shrink-0">
          <AdsterraBanner adKey="c56cee194a4d1b24830b09af20d13091" width={160} height={600} />
        </aside>

        <main className="min-w-0 flex-1 max-w-5xl px-4 py-6 md:px-6 md:py-10">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to gallery
          </Link>

          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col gap-4">
              <ImageContextMenu
                imageName={image.name}
                imageId={imageId}
                downloadUrl={`https://drive.google.com/uc?export=download&id=${image.driveFileId}`}
              >
                <a
                  href={`https://drive.google.com/file/d/${image.driveFileId}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-2xl border border-border/60 bg-card"
                  aria-label={`Open ${image.name} in Google Drive`}
                >
                  <MotionImage>
                    <div className="relative">
                      <img
                        src={thumbnailUrl}
                        alt={image.name}
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        className="max-h-[70vh] w-full object-contain transition-opacity group-hover:opacity-90"
                      />
                      <WindCanvas imageId={imageId} />
                    </div>
                  </MotionImage>
                </a>
              </ImageContextMenu>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <CopyLink url={`https://emly4u.vercel.app/image/${imageId}`} />
                  <ImageMotionButton />
                  <ImageActions
                    imageName={image.name}
                    imageUrl={thumbnailUrl}
                    driveUrl={`https://drive.google.com/file/d/${image.driveFileId}/view`}
                    downloadUrl={`https://drive.google.com/uc?export=download&id=${image.driveFileId}`}
                  />
                </div>
              </div>
              <div>
                <h1 className="text-balance font-serif text-2xl font-semibold tracking-tight">
                  {image.name}
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  <span>
                    Added {new Date(image.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="size-4" aria-hidden="true" />
                    {image.views.toLocaleString()} {image.views === 1 ? "view" : "views"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <AdsterraBanner adKey="a8ed7b64e96d0837a4df314ce4fe16da" width={300} height={250} />
              <Suspense fallback={<CommentsLoading />}>
                <CommentsPanel imageId={imageId} />
              </Suspense>
            </div>
          </div>

          <div className="mt-8 hidden md:flex justify-center">
            <AdsterraBanner adKey="5886a3f0b13b2c7376c81f54cbb661a2" width={728} height={90} />
          </div>
          <div className="mt-8 flex justify-center md:hidden">
            <AdsterraBanner adKey="57d230052a69423ff827502434658d5f" width={320} height={50} />
          </div>
        </main>

        <aside className="hidden xl:flex flex-col gap-4 pt-10 sticky top-4 self-start shrink-0">
          <AdsterraBanner adKey="6dc2c7111cf540e9cc06fa69bda599e4" width={160} height={300} />
        </aside>
      </div>
    </div>
  )
}

async function CommentsPanel({ imageId }: { imageId: number }) {
  const comments = await getComments(imageId)
  return <CommentSection imageId={imageId} initialComments={comments} />
}

function CommentsLoading() {
  return (
    <aside className="flex min-h-64 items-center justify-center rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground" aria-busy="true">
      Loading conversation…
    </aside>
  )
}
