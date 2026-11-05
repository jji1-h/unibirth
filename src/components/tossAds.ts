import { TossAds } from '@apps-in-toss/web-framework'

// QR 테스트 빌드는 VITE_AD_GROUP_ID로 테스트 ID를 넣는다 (기본값은 실제 광고 ID)
export const AD_GROUP_ID = import.meta.env.VITE_AD_GROUP_ID || 'ait.v2.live.266d08f50a584926'

// 일반 웹처럼 광고를 지원하지 않는 환경이면 false
export function isBannerSupported() {
  try {
    return TossAds.initialize.isSupported() && TossAds.attachBanner.isSupported()
  } catch {
    return false
  }
}

let initPromise: Promise<void> | null = null

// 문서 권장대로 페이지당 한 번만 초기화한다
export function initTossAds() {
  if (!initPromise) {
    initPromise = new Promise((resolve, reject) => {
      try {
        TossAds.initialize({
          callbacks: {
            onInitialized: () => resolve(),
            onInitializationFailed: reject,
          },
        })
      } catch (error) {
        reject(error)
      }
    })
  }
  return initPromise
}
