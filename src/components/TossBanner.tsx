import { useEffect, useRef, useState } from 'react'
import { TossAds } from '@apps-in-toss/web-framework'
import { isBannerSupported } from './isBannerSupported'

// QR 테스트 빌드는 VITE_AD_GROUP_ID로 테스트 ID를 넣는다 (기본값은 실제 광고 ID)
export const AD_GROUP_ID = import.meta.env.VITE_AD_GROUP_ID || 'ait.v2.live.266d08f50a584926'

interface Props {
  adGroupId?: string
  height?: number  // 기본 96px (고정형 권장)
}

export default function TossBanner({ adGroupId = AD_GROUP_ID, height = 96 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [supported] = useState(isBannerSupported)

  // initialize 완료 대기
  useEffect(() => {
    if (!TossAds.initialize.isSupported()) return
    TossAds.initialize({
      callbacks: {
        onInitialized: () => setIsInitialized(true),
        onInitializationFailed: () => setIsInitialized(true), // 이미 초기화된 경우도 attach 가능
      },
    })
  }, [])

  // initialize 완료 후 배너 부착
  useEffect(() => {
    if (!isInitialized) return
    if (!TossAds.attachBanner.isSupported()) return
    if (!containerRef.current) return

    const attached = TossAds.attachBanner(adGroupId, containerRef.current, {
      theme: 'dark',
      tone: 'blackAndWhite',
      variant: 'expanded',
      callbacks: {
        onNoFill: () => {
          if (containerRef.current) containerRef.current.style.display = 'none'
        },
        onAdRendered: () => {
          if (containerRef.current) containerRef.current.style.display = ''
        },
        onAdFailedToRender: () => {
          if (containerRef.current) containerRef.current.style.display = 'none'
        },
      },
    })

    return () => { attached?.destroy() }
  }, [isInitialized, adGroupId])

  // 광고를 그릴 수 없으면 빈 자리도 차지하지 않는다
  if (!supported) return null

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: `${height}px`, background: '#07090f' }}
    />
  )
}
