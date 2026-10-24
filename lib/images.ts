import type { ImageRow } from "./db/schema"

// Shared image types/constants with NO database imports, so they are safe to
// import from client components (unlike lib/queries.ts, which pulls in `pg`).

export type ImageWithCount = ImageRow & { commentCount: number; likeCount: number; dislikeCount: number }

export type ImageSort = "new" | "popular" | "random"

export const IMAGES_PAGE_SIZE = 48

// Use the same public image URL in HTML, metadata, and the image sitemap.
// The route serves image bytes, including for records without a thumbnail URL.
export function getPublicImageUrl(id: number): string {
  return `/api/image/${id}`
}

export function getGalleryPage(page?: string): number {
  const value = Number(page)
  return Number.isSafeInteger(value) && value > 0 && value <= 1_000_000 ? value : 1
}

export function getGalleryHref(page: number, sort: ImageSort = "new"): string {
  const params = new URLSearchParams()
  if (sort !== "new") params.set("sort", sort)
  if (page > 1) params.set("page", String(page))
  const query = params.toString()
  return query ? `/?${query}` : "/"
}

export type ImagesPage = {
  images: ImageWithCount[]
  hasMore: boolean
}
