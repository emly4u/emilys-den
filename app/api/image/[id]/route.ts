import { getImage } from "@/lib/queries"

export const dynamic = "force-dynamic"

// Public, same-origin image bytes shared by the feed, detail pages and sitemap.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const imageId = Number(id)
  if (!Number.isSafeInteger(imageId) || imageId <= 0) return new Response("Not found", { status: 404 })

  const image = await getImage(imageId)
  if (!image) return new Response("Not found", { status: 404 })

  const fileId = encodeURIComponent(image.driveFileId)
  const sources = [
    `https://lh3.googleusercontent.com/d/${fileId}=w2000`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
  ]

  // Older imports may have an original image stored in public Vercel Blob.
  if (image.blobUrl) {
    try {
      const stored = new URL(image.blobUrl)
      if (stored.protocol === "https:" && stored.hostname.endsWith(".public.blob.vercel-storage.com")) {
        sources.unshift(stored.href)
      }
    } catch { /* Fall back to the Drive file for missing or legacy URLs. */ }
  }

  for (const source of sources) {
    try {
      const upstream = await fetch(source, { signal: AbortSignal.timeout(10_000) })
      const contentType = upstream.headers.get("content-type") ?? ""
      if (upstream.ok && contentType.startsWith("image/")) {
        return new Response(upstream.body, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
            "X-Content-Type-Options": "nosniff",
          },
        })
      }
      await upstream.body?.cancel()
    } catch {
      // A timeout or unavailable source must not prevent trying the fallback.
    }
  }

  return new Response("Image unavailable", { status: 502 })
}
