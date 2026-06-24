/**
 * Cloudflare Pages Functions middleware
 * ?bdate=YYYYMMDD 파라미터가 있는 요청을 가로채
 * og:title / og:description을 해당 별 이름으로 동적 교체
 */

import starsData from '../src/data/stars.json'

// ── 타입 ──────────────────────────────────────────────
interface Star {
  dist_ly: number
  proper:  string | null
  bf:      string | null
  hip:     number | null
  gl:      string | null
  ra:      number | null
  dec:     number | null
  mag:     number | null
}

interface CFContext {
  request:  Request
  next:     () => Promise<Response>
}

// ── 상수 (starMatcher.ts 동일) ────────────────────────
const DAYS_PER_YEAR      = 365.25
const GAP_THRESHOLD_DAYS = 180    // B/C 경계: 180일 초과 → NO_STAR

// ── 로직 (클라이언트 로직 그대로) ─────────────────────
function calcAgeLy(bdate: string): number | null {
  const d = bdate.replace(/\D/g, '')
  if (d.length !== 8) return null

  const year  = parseInt(d.slice(0, 4))
  const month = parseInt(d.slice(4, 6))
  const day   = parseInt(d.slice(6, 8))
  const birth = new Date(year, month - 1, day)

  // 유효성 검사
  if (
    birth.getFullYear() !== year ||
    birth.getMonth()    !== month - 1 ||
    birth.getDate()     !== day
  ) return null

  const today = new Date()
  if (birth > today) return null

  const msElapsed = today.getTime() - birth.getTime()
  return msElapsed / (1000 * 60 * 60 * 24) / DAYS_PER_YEAR
}

function findNearestStar(ageLy: number): Star | null {
  const stars = starsData as Star[]
  if (!stars.length) return null

  // 이진 탐색으로 가장 가까운 두 별 후보 추출
  let lo = 0, hi = stars.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (stars[mid].dist_ly < ageLy) lo = mid + 1
    else hi = mid
  }

  const candidates: Star[] = []
  if (lo > 0)            candidates.push(stars[lo - 1])
  if (lo < stars.length) candidates.push(stars[lo])
  if (!candidates.length) return null

  const best = candidates.reduce((a, b) => {
    const gA = Math.abs(a.dist_ly - ageLy)
    const gB = Math.abs(b.dist_ly - ageLy)
    if (gA !== gB) return gA < gB ? a : b
    return (a.mag ?? 999) <= (b.mag ?? 999) ? a : b
  })

  // 180일 초과 gap → NO_STAR
  const gapDays = Math.round(Math.abs(best.dist_ly - ageLy) * DAYS_PER_YEAR)
  if (gapDays > GAP_THRESHOLD_DAYS) return null

  return best
}

function starDisplayName(star: Star): string {
  if (star.proper) return star.proper
  if (star.bf)     return star.bf.trim()
  if (star.hip)    return `HIP ${star.hip}`
  if (star.gl)     return star.gl.trim()

  const ra  = star.ra  ?? 0
  const dec = star.dec ?? 0
  const rh  = Math.floor(ra)
  const rm  = Math.floor((ra - rh) * 60)
  const sign = dec >= 0 ? '+' : '-'
  const dd  = Math.floor(Math.abs(dec))
  const dm  = Math.floor((Math.abs(dec) - dd) * 60)
  return `J${String(rh).padStart(2,'0')}${String(rm).padStart(2,'0')}${sign}${String(dd).padStart(2,'0')}${String(dm).padStart(2,'0')}`
}

function formatDateKo(bdate: string): string {
  const d = bdate.replace(/\D/g, '')
  if (d.length !== 8) return bdate
  const y = d.slice(0, 4)
  const m = parseInt(d.slice(4, 6))
  const day = parseInt(d.slice(6, 8))
  return `${y}년 ${m}월 ${day}일`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// ── 미들웨어 엔트리포인트 ─────────────────────────────
export const onRequest = async (context: CFContext): Promise<Response> => {
  const url   = new URL(context.request.url)
  const bdate = url.searchParams.get('bdate')

  // ?bdate 없으면 그냥 통과
  if (!bdate) return context.next()

  // 나이 계산
  const ageLy = calcAgeLy(bdate)

  // 원본 응답 가져오기
  const response = await context.next()

  // HTML 응답이 아니면 통과 (JS, CSS, 이미지 등)
  const ct = response.headers.get('content-type') ?? ''
  if (!ct.includes('text/html')) return response

  // 유효하지 않은 날짜 → 원본 그대로
  if (ageLy === null) return response

  // 별 탐색
  const star = findNearestStar(ageLy)
  if (!star) return response

  const name    = escapeHtml(starDisplayName(star))
  const dateKo  = escapeHtml(formatDateKo(bdate))
  const distStr = star.dist_ly.toFixed(2)
  const title   = `${name} — ${dateKo} 탄생별 | Unibirth`
  const desc    = `${dateKo}, 이 별에서 출발한 빛은 오늘 지구에 닿습니다. 지구로부터 ${distStr}광년 떨어진 ${name}이 당신의 탄생별입니다.`

  let html = await response.text()

  // OG / Twitter 메타태그 교체 (속성 순서 무관하게 매칭)
  html = html
    .replace(/(property="og:title"[^>]*content=")[^"]*(")/g,             `$1${title}$2`)
    .replace(/(property="og:description"[^>]*content=")[^"]*(")/g,        `$1${desc}$2`)
    .replace(/(name="twitter:title"[^>]*content=")[^"]*(")/g,             `$1${title}$2`)
    .replace(/(name="twitter:description"[^>]*content=")[^"]*(")/g,       `$1${desc}$2`)

  // Content-Type 헤더 유지, 나머지 헤더 복사
  const headers = new Headers(response.headers)
  headers.set('content-type', 'text/html; charset=utf-8')

  return new Response(html, {
    status:  response.status,
    headers,
  })
}
