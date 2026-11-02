"use server"

import { createHash, randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { cookies, headers } from "next/headers"
import { and, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { comments, imageReactions, images } from "@/lib/db/schema"
import { getImages, type ImageSort, type ImagesPage } from "@/lib/queries"

export async function reactToImage(imageId: number, direction: "like" | "dislike") {
  const requestHeaders = await headers()
  const requestCookies = await cookies()
  let visitorId = requestCookies.get("den_visitor")?.value
  if (!visitorId) {
    visitorId = randomUUID()
    requestCookies.set("den_visitor", visitorId, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 })
  }
  const fingerprint = createHash("sha256")
    .update(`${visitorId}:${requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"}`)
    .digest("hex")

  const existing = await db.query.imageReactions.findFirst({ where: and(eq(imageReactions.imageId, imageId), eq(imageReactions.fingerprint, fingerprint)) })
  if (existing?.direction === direction) {
    await db.delete(imageReactions).where(eq(imageReactions.id, existing.id))
  } else if (existing) {
    await db.update(imageReactions).set({ direction }).where(eq(imageReactions.id, existing.id))
  } else {
    await db.insert(imageReactions).values({ imageId, fingerprint, direction })
  }

  const counts = await db.select({ direction: imageReactions.direction, count: sql<number>`count(*)` }).from(imageReactions).where(eq(imageReactions.imageId, imageId)).groupBy(imageReactions.direction)
  return { like: Number(counts.find((count) => count.direction === "like")?.count ?? 0), dislike: Number(counts.find((count) => count.direction === "dislike")?.count ?? 0), active: existing?.direction === direction ? null : direction }
}

export async function incrementView(imageId: number) {
  await db
    .update(images)
    .set({ views: sql`${images.views} + 1` })
    .where(eq(images.id, imageId))
}

export async function loadMoreImages(sort: ImageSort, offset: number): Promise<ImagesPage> {
  return getImages(sort, { offset })
}

export async function addComment(imageId: number, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim()
  const author = String(formData.get("author") ?? "").trim()

  if (!body) {
    return { error: "Comment cannot be empty." }
  }
  if (body.length > 2000) {
    return { error: "Comment is too long." }
  }

  await db.insert(comments).values({
    imageId,
    author: author ? author.slice(0, 60) : null,
    body: body.slice(0, 2000),
  })

  revalidatePath(`/image/${imageId}`)
  return { success: true }
}

export async function voteComment(commentId: number, imageId: number, direction: "up" | "down") {
  if (direction === "up") {
    await db
      .update(comments)
      .set({ upvotes: sql`${comments.upvotes} + 1` })
      .where(eq(comments.id, commentId))
  } else {
    await db
      .update(comments)
      .set({ downvotes: sql`${comments.downvotes} + 1` })
      .where(eq(comments.id, commentId))
  }

  revalidatePath(`/image/${imageId}`)
  return { success: true }
}

export async function triggerSync(): Promise<import("@/lib/sync").SyncResult & { error?: string }> {
if (!process.env.GCP_API_KEY) {
    return {
      scanned: 0,
      imported: 0,
      skipped: 0,
      importedNames: [],
      errors: [] as string[],
      error: "GCP_API_KEY is not set. Add it in Project Settings → Vars, then try again.",
    }
  }

  try {
    const { syncDriveImages } = await import("@/lib/sync")
    const result = await syncDriveImages()
    if (result.imported > 0) {
      revalidatePath("/")
      revalidatePath("/sitemap.xml")
    }
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return {
      scanned: 0,
      imported: 0,
      skipped: 0,
      importedNames: [] as string[],
      errors: [] as string[],
      error: message,
    }
  }
}
