// Public publisher codes. Smartlink 32061639 verified in the emly4u dashboard on 2026-11-03.
export const SMARTLINK = {
  id: "32061639",
  url: "https://auctionr.org/4/c4cabf165469eafd43eb294c8cce3472",
} as const

export type BannerUnit = { key: string; width: number; height: number }

export const BANNER_UNITS = {
  leaderboard: { key: "5886a3f0b13b2c7376c81f54cbb661a2", width: 728, height: 90 },
  mobile: { key: "57d230052a69423ff827502434658d5f", width: 320, height: 50 },
  rectangle: { key: "a8ed7b64e96d0837a4df314ce4fe16da", width: 300, height: 250 },
  leftRail: { key: "c56cee194a4d1b24830b09af20d13091", width: 160, height: 600 },
  rightRail: { key: "6dc2c7111cf540e9cc06fa69bda599e4", width: 160, height: 300 },
} satisfies Record<string, BannerUnit>

export const NATIVE_KEY = "3a7c471205865254ca4cfe9c423be27d"
export const AD_SCRIPT_ORIGIN = "https://brijmohan.org"
// Development and browser QA must not generate paid impressions or clicks.
export const ADS_ENABLED = process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_ADS_ENABLED !== "false"

export function bannerForWidth(width: number): BannerUnit | null {
  if (width >= 728) return BANNER_UNITS.leaderboard
  if (width >= 320) return BANNER_UNITS.mobile
  return null
}

// At most three sponsored breaks, separated by 24 artworks in the infinite feed.
export function hasSponsoredBreak(index: number): boolean {
  return index >= 11 && index <= 59 && (index - 11) % 24 === 0
}
