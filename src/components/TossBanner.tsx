import { useEffect, useRef } from 'react'
import { TossAds } from '@apps-in-toss/web-framework'

// 콘솔에서 발급받은 광고 그룹 ID로 교체하세요
export const AD_GROUP_ID = 'ait.v2.live.266d08f50a584926'

interface Props {
  adGroupId?: string
  height?: number  // 기본 96px (고정형 권장)
}

export default function TossBanner({ adGroupId = AD_GROUP_ID, height = 96 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!TossAds.attachBanner.isSupported()) return
    if (!containerRef.current) return

    const attached = TossAds.attachBanner(adGroupId, containerRef.current, {
      theme: 'dark',
      tone: 'blackAndWhite',
      variant: 'expanded',
      callbacks: {
        onNoFill: () => {
          // 광고 없을 때 컨테이너 숨김
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

    return () => {
      attached?.destroy()
    }
  }, [adGroupId])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: `${height}px` }}
    />
  )
}
