import './disable-toss-zoom'
import { TossAds } from '@apps-in-toss/web-framework'
import { AD_GROUP_ID, adLog, initTossAds, waitForBannerSupport } from './components/tossAds'

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

    adLog('배너 부착 요청')
    try {
      TossAds.attachBanner(AD_GROUP_ID, slot, {
        theme: 'dark',
        tone: 'blackAndWhite',
        variant: 'expanded',
        callbacks: {
          onNoFill: () => {
            adLog('광고 없음 (no-fill)')
            hide()
          },
          onAdRendered: () => {
            adLog('광고 표시됨')
            sticky.style.display = 'block'
          },
          onAdFailedToRender: payload => {
            adLog(`표시 실패: ${payload.error.code} ${payload.error.message}`)
            hide()
          },
        },
      })
    } catch (error) {
      adLog(`부착 예외: ${(error as Error)?.message ?? error}`)
      hide()
    }
  })
}

// 토스 앱이 광고 SDK를 주입할 때까지 기다린 뒤 초기화한다
function run() {
  waitForBannerSupport()
    .then(supported => {
      if (!supported) return
      return initTossAds().then(attachBanners)
    })
    .catch(() => { /* 슬롯은 숨겨진 채로 둔다 */ })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run)
} else {
  run()
}
