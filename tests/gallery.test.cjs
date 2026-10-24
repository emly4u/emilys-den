const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const { test } = require("node:test")
const ts = require("typescript")
const { renderToStaticMarkup } = require("react-dom/server")

// Run the actual TS/TSX components with fixture data, without a database or browser.
function loadSource(relativePath, mocks = {}, cache = new Map()) {
  const filename = path.resolve(__dirname, "..", relativePath)
  if (cache.has(filename)) return cache.get(filename).exports
  const module = { exports: {} }
  cache.set(filename, module)
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  })
  const resolve = (specifier) => {
    if (Object.hasOwn(mocks, specifier)) return mocks[specifier]
    if (specifier.startsWith("@/") || specifier.startsWith(".")) {
      const base = specifier.startsWith("@/")
        ? path.resolve(__dirname, "..", specifier.slice(2))
        : path.resolve(path.dirname(filename), specifier)
      const target = [base, `${base}.ts`, `${base}.tsx`].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
      return loadSource(target, mocks, cache)
    }
    return require(specifier)
  }
  new Function("require", "module", "exports", outputText)(resolve, module, module.exports)
  return module.exports
}

const fixture = {
  id: 49, driveFileId: "public-drive-file", name: "Emily portrait.png", blobUrl: null,
  contentType: "image/png", createdAt: new Date("2026-10-01T00:00:00Z"),
  views: 0, commentCount: 0, likeCount: 0, dislikeCount: 0,
}
const emptyComponent = () => null
const uiMocks = {
  "next/server": { after: () => {} },
  "next/cache": { revalidatePath: () => {} },
  "@/lib/sync": { maybeSync: async () => null },
  "@/components/site-header": { SiteHeader: emptyComponent },
  "@/components/sort-toggle": { SortToggle: emptyComponent },
  "@/components/adsterra-banner": { AdsterraBanner: emptyComponent },
  "@/components/adsterra-native": { AdsterraNative: emptyComponent },
  "@/components/ui/button": { buttonVariants: () => "button" },
  "@/app/actions/gallery": { loadMoreImages: async () => ({ images: [], hasMore: false }), reactToImage: async () => ({ like: 0, dislike: 0 }) },
}

test("homepage emits actual image elements and detail links without JavaScript, even with no blob URL", async () => {
  const home = loadSource("app/page.tsx", {
    ...uiMocks,
    "@/lib/queries": { getImages: async (sort, options) => {
      assert.equal(sort, "new")
      assert.equal(options.offset, 0)
      return { images: [fixture], hasMore: true }
    } },
  })
  const html = renderToStaticMarkup(await home.default({ searchParams: Promise.resolve({}) }))
  assert.match(html, /<img[^>]+alt="Emily portrait.png"[^>]+src="\/api\/image\/49"/)
  assert.match(html, /href="\/image\/49"/)
  assert.match(html, /<a(?=[^>]*href="\/\?page=2")(?=[^>]*rel="next")[^>]*>/)
  assert.doesNotMatch(html, /placeholder\.svg|drive\.google\.com\/thumbnail/)
})

test("deep gallery pages render their own batch, navigation and canonical URL", async () => {
  const home = loadSource("app/page.tsx", {
    ...uiMocks,
    "@/lib/queries": { getImages: async (sort, options) => {
      assert.equal(sort, "popular")
      assert.equal(options.offset, 48)
      return { images: [fixture], hasMore: true }
    } },
  })
  const props = { searchParams: Promise.resolve({ sort: "popular", page: "2" }) }
  const html = renderToStaticMarkup(await home.default(props))
  assert.match(html, /<a(?=[^>]*href="\/\?sort=popular")(?=[^>]*rel="prev")[^>]*>/)
  assert.match(html, /<a(?=[^>]*href="\/\?sort=popular&amp;page=3")(?=[^>]*rel="next")[^>]*>/)
  assert.equal((await home.generateMetadata(props)).alternates.canonical, "/?sort=popular&page=2")
})

test("sitemap advertises the same first-party image URL as the feed", async () => {
  const { default: sitemap } = loadSource("app/sitemap.ts", {
    "@/lib/queries": { getSitemapImages: async () => [fixture] },
  })
  const entries = await sitemap()
  assert.deepEqual(entries[1].images, ["https://emly4u.vercel.app/api/image/49"])
  assert.equal(entries[1].url, "https://emly4u.vercel.app/image/49")
})

test("image endpoint recovers from a network failure and serves cacheable image bytes", async (t) => {
  const { GET } = loadSource("app/api/image/[id]/route.ts", { "@/lib/queries": { getImage: async () => fixture } })
  const sources = []
  t.mock.method(globalThis, "fetch", async (url) => {
    sources.push(url)
    if (sources.length === 1) throw new Error("upstream timeout")
    return new Response(new Uint8Array([137, 80, 78, 71]), { headers: { "Content-Type": "image/png" } })
  })
  const response = await GET(new Request("https://example.com/api/image/49"), { params: Promise.resolve({ id: "49" }) })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get("Content-Type"), "image/png")
  assert.match(response.headers.get("Cache-Control"), /s-maxage=86400/)
  assert.equal(sources.length, 2)
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [137, 80, 78, 71])
})

test("image endpoint never returns a Drive sign-in page as an image", async (t) => {
  const { GET } = loadSource("app/api/image/[id]/route.ts", { "@/lib/queries": { getImage: async () => fixture } })
  t.mock.method(globalThis, "fetch", async () => new Response("Sign in", { headers: { "Content-Type": "text/html" } }))
  const response = await GET(new Request("https://example.com/api/image/49"), { params: Promise.resolve({ id: "49" }) })
  assert.equal(response.status, 502)
  assert.equal(response.headers.get("Cache-Control"), null)
})

test("image endpoint rejects invalid IDs before querying the database", async () => {
  const { GET } = loadSource("app/api/image/[id]/route.ts", { "@/lib/queries": { getImage: async () => { throw new Error("Must not query") } } })
  for (const id of ["0", "-1", "NaN", "1.5", "9007199254740992"]) {
    assert.equal((await GET(new Request("https://example.com"), { params: Promise.resolve({ id }) })).status, 404)
  }
})
