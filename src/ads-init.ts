import './disable-toss-zoom'
import { TossAds } from '@apps-in-toss/web-framework'
import { AD_GROUP_ID, initTossAds, isBannerSupported } from './components/tossAds'

const HEADER_HEIGHT = 52

// 슬롯은 HTML에서 숨겨져 있고, 광고를 지원할 때만 헤더 아래에 고정해 표시한다
function attachBanners() {
  document.querySelectorAll<HTMLElement>('.toss-banner-slot').forEach(slot => {
    // 슬롯 안은 비워야 하므로 고정·여백은 바깥 요소가 맡는다
    const sticky = document.createElement('div')
    Object.assign(sticky.style, {
      position: 'sticky',
      top: `${HEADER_HEIGHT}px`,
      zIndex: '9',
      paddingTop: '8px',
      background: '#07090f',
    })
    slot.parentNode?.insertBefore(sticky, slot)
    sticky.appendChild(slot)
    slot.style.display = 'block'

    const hide = () => { sticky.style.display = 'none' }

    try {
      TossAds.attachBanner(AD_GROUP_ID, slot, {
        theme: 'dark',
        tone: 'blackAndWhite',
        variant: 'expanded',
        callbacks: {
          onNoFill: hide,
          onAdRendered: () => { sticky.style.display = 'block' },
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
