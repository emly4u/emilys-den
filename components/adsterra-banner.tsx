import { BannerAd } from "@/components/ad-slot"

// Compatibility wrapper; all banners use the same measured, lazy slot.
export function AdsterraBanner({ adKey, width, height }: { adKey: string; width: number; height: number }) {
  return <BannerAd unit={{ key: adKey, width, height }} />
}
