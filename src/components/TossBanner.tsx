import { useEffect, useRef, useState } from 'react'
import { TossAds } from '@apps-in-toss/web-framework'

export const AD_GROUP_ID = 'ait.v2.live.266d08f50a584926'

interface Props {
  adGroupId?: string
  height?: number  // 기본 96px (고정형 권장)
}

export default function TossBanner({ adGroupId = AD_GROUP_ID, height = 96 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)

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

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: `${height}px`, background: '#07090f' }}
    />
  )
}
