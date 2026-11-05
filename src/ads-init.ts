import { TossAds } from '@apps-in-toss/web-framework'

// QR 테스트 빌드는 VITE_AD_GROUP_ID로 테스트 ID를 넣는다 (기본값은 실제 광고 ID)
const AD_GROUP_ID = import.meta.env.VITE_AD_GROUP_ID || 'ait.v2.live.266d08f50a584926'

function attachBanners() {
  const containers = document.querySelectorAll<HTMLElement>('.toss-banner-slot')
  containers.forEach(container => {
    // 원래 자리에 placeholder를 두고 배너 슬롯을 fixed로 고정
    const placeholder = document.createElement('div')
    placeholder.style.height = '96px'
    container.parentNode?.insertBefore(placeholder, container)

    Object.assign(container.style, {
      position: 'fixed',
      top: '52px',
      left: '0',
      right: '0',
      width: '100%',
      zIndex: '9',
      background: '#07090f',
    })

    try {
      TossAds.attachBanner(AD_GROUP_ID, container, {
        theme: 'dark',
        tone: 'blackAndWhite',
        variant: 'expanded',
        callbacks: {
          onNoFill: () => {
            container.style.display = 'none'
            placeholder.style.display = 'none'
          },
          onAdRendered: () => {
            container.style.display = ''
            placeholder.style.display = ''
          },
          onAdFailedToRender: () => {
            container.style.display = 'none'
            placeholder.style.display = 'none'
          },
        },
      })
    } catch { /* 미지원 환경 */ }
  })
}

function initAds() {
  let supported = false
  try {
    supported = TossAds.initialize.isSupported() && TossAds.attachBanner.isSupported()
  } catch { /* 미지원 환경 */ }

  // 일반 웹에서는 광고를 그릴 수 없으므로 빈 슬롯을 치운다
  if (!supported) {
    document.querySelectorAll<HTMLElement>('.toss-banner-slot').forEach(slot => {
      slot.style.display = 'none'
    })
    return
  }

  try {
    TossAds.initialize({
      callbacks: {
        onInitialized: attachBanners,
        onInitializationFailed: attachBanners,
      },
    })
  } catch {
    attachBanners()
  }
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
