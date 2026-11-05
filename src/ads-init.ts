import './disable-toss-zoom'
import { TossAds } from '@apps-in-toss/web-framework'
import { AD_GROUP_ID, initTossAds, isBannerSupported } from './components/tossAds'

// 슬롯은 HTML에서 숨겨져 있고, 광고를 지원할 때만 본문 흐름 안에 표시한다
function attachBanners() {
  document.querySelectorAll<HTMLElement>('.toss-banner-slot').forEach(slot => {
    const hide = () => { slot.style.display = 'none' }
    slot.style.display = 'block'
    slot.style.marginTop = '16px'

    try {
      TossAds.attachBanner(AD_GROUP_ID, slot, {
        theme: 'dark',
        tone: 'blackAndWhite',
        variant: 'expanded',
        callbacks: {
          onNoFill: hide,
          onAdRendered: () => { slot.style.display = 'block' },
          onAdFailedToRender: hide,
        },
      })
    } catch {
      hide()
    }
  })
}

function initAds() {
  if (!isBannerSupported()) return
  initTossAds().then(attachBanners).catch(() => { /* 슬롯은 숨겨진 채로 둔다 */ })
}

function run() {
  // TossAds 브릿지 준비 대기 후 실행
  setTimeout(initAds, 300)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run)
} else {
  run()
}
