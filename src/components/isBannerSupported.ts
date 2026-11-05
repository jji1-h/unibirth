import { TossAds } from '@apps-in-toss/web-framework'

// 일반 웹처럼 광고를 지원하지 않는 환경이면 false
export function isBannerSupported() {
  try {
    return TossAds.attachBanner.isSupported()
  } catch {
    return false
  }
}
