import { useEffect, useRef, useState } from 'react'
import { TossAds } from '@apps-in-toss/web-framework'
import { AD_GROUP_ID, initTossAds, isBannerSupported } from './tossAds'

interface Props {
  adGroupId?: string
}

// 스크롤 가능한 화면에서만 사용한다 (출시 체크리스트)
export default function TossBanner({ adGroupId = AD_GROUP_ID }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(isBannerSupported)

  useEffect(() => {
    if (!isBannerSupported()) return

    let cancelled = false
    let attached: { destroy: () => void } | undefined

    initTossAds()
      .then(() => {
        if (cancelled || !containerRef.current) return
        attached = TossAds.attachBanner(adGroupId, containerRef.current, {
          theme: 'dark',
          tone: 'blackAndWhite',
          variant: 'expanded',
          callbacks: {
            onNoFill: () => setVisible(false),
            onAdRendered: () => setVisible(true),
            onAdFailedToRender: () => setVisible(false),
          },
        })
      })
      .catch(() => setVisible(false))

    return () => {
      cancelled = true
      attached?.destroy()
    }
  }, [adGroupId])

  // 광고를 그릴 수 없으면 빈 자리도 차지하지 않는다
  // 실제 높이는 광고에 따라 달라지므로 고정하지 않고 권장값 102px만 최소로 둔다
  return (
    <div
      ref={containerRef}
      style={{ width: '100%', minHeight: '102px', display: visible ? 'block' : 'none' }}
    />
  )
}
