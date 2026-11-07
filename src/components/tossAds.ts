import { TossAds } from '@apps-in-toss/web-framework'

// QR 테스트 빌드는 VITE_AD_GROUP_ID로 테스트 ID를 넣는다 (기본값은 실제 광고 ID)
export const AD_GROUP_ID = import.meta.env.VITE_AD_GROUP_ID || 'ait.v2.live.266d08f50a584926'

// 진단 빌드(npm run build:toss -- --test --debug)에서만 광고 진행 상황을 화면에 표시한다
const AD_DEBUG = import.meta.env.VITE_AD_DEBUG === '1'

// 토스 앱 WebView 안인지 (일반 웹이면 false)
export function isTossWebView() {
  return typeof window !== 'undefined' && 'ReactNativeWebView' in window
}

function isBannerSupportedNow() {
  try {
    return TossAds.initialize.isSupported() && TossAds.attachBanner.isSupported()
  } catch {
    return false
  }
}

// 광고 SDK는 토스 앱이 페이지에 주입한다. 주입 시점이 기기마다 달라서
// 페이지가 뜬 직후에는 아직 없을 수 있으므로 잠시 기다린 뒤 판정한다.
const WAIT_LIMIT_MS = 5000
const WAIT_STEP_MS = 100
let supportPromise: Promise<boolean> | null = null

export function waitForBannerSupport() {
  if (!supportPromise) {
    supportPromise = new Promise(resolve => {
      if (!isTossWebView()) {
        resolve(false)
        return
      }
      const started = Date.now()
      const check = () => {
        if (isBannerSupportedNow()) {
          adLog(`SDK 준비됨 (${Date.now() - started}ms)`)
          resolve(true)
        } else if (Date.now() - started >= WAIT_LIMIT_MS) {
          adLog(`SDK 없음: ${WAIT_LIMIT_MS}ms 기다려도 주입되지 않음`)
          resolve(false)
        } else {
          setTimeout(check, WAIT_STEP_MS)
        }
      }
      check()
    })
  }
  return supportPromise
}

let initPromise: Promise<void> | null = null

// 문서 권장대로 페이지당 한 번만 초기화한다
export function initTossAds() {
  if (!initPromise) {
    initPromise = new Promise((resolve, reject) => {
      try {
        TossAds.initialize({
          callbacks: {
            onInitialized: () => {
              adLog('초기화 성공')
              resolve()
            },
            onInitializationFailed: error => {
              adLog(`초기화 실패: ${error?.message ?? error}`)
              reject(error)
            },
          },
        })
      } catch (error) {
        adLog(`초기화 예외: ${(error as Error)?.message ?? error}`)
        reject(error)
      }
    })
  }
  return initPromise
}

// 진단 빌드에서만 화면 아래에 기록을 쌓는다. 출시 빌드에서는 아무것도 하지 않는다.
let panel: HTMLElement | null = null

export function adLog(message: string) {
  if (!AD_DEBUG) return
  console.warn('[unibirth-ad]', message)
  if (!panel) {
    panel = document.createElement('div')
    Object.assign(panel.style, {
      position: 'fixed',
      left: '0',
      right: '0',
      bottom: '0',
      zIndex: '99999',
      maxHeight: '40vh',
      overflowY: 'auto',
      padding: '8px 12px',
      background: 'rgba(0,0,0,0.85)',
      color: '#7CFC9A',
      font: '12px/1.5 monospace',
      whiteSpace: 'pre-wrap',
      pointerEvents: 'none',
    })
    document.body.appendChild(panel)
    const ua = navigator.userAgent
    panel.textContent = `[광고 진단] ${/iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : '기타'} · 광고 ID ${AD_GROUP_ID}\n`
  }
  const time = (performance.now() / 1000).toFixed(1)
  panel.textContent += `${time}s ${message}\n`
}
