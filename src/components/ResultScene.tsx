import { useEffect, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import type { MatchResult, Star } from '../lib'
import { STAR_VERT, STAR_FRAG, CHROMO_VERT, CHROMO_FRAG } from '../lib/starShaders'

interface Props {
  result:    MatchResult
  onReset:   () => void
  birthdate: string   // 공유 URL 생성에 사용
}

// ── 스펙트럼 → 시각 특성 파싱 ──────────────────────
interface SpectVisual { colorHex: number; colorCss: string; hasCorona: boolean }

function colorFromCI(ci: number): SpectVisual {
  if (ci < -0.1) return { colorHex: 0xb0c4ff, colorCss: '#b0c4ff', hasCorona: true  }
  if (ci <  0.2) return { colorHex: 0xd8e8ff, colorCss: '#d8e8ff', hasCorona: true  }
  if (ci <  0.5) return { colorHex: 0xfff5e4, colorCss: '#fff5e4', hasCorona: true  }
  if (ci <  0.8) return { colorHex: 0xffe87a, colorCss: '#ffe87a', hasCorona: false }
  if (ci <  1.4) return { colorHex: 0xffb347, colorCss: '#ffb347', hasCorona: false }
  return               { colorHex: 0xff6b35, colorCss: '#ff6b35', hasCorona: false }
}

function colorFromAbsmag(absmag: number): SpectVisual {
  if (absmag <  2)   return { colorHex: 0xb0c4ff, colorCss: '#b0c4ff', hasCorona: true  }
  if (absmag <  4)   return { colorHex: 0xd8e8ff, colorCss: '#d8e8ff', hasCorona: true  }
  if (absmag <  5.5) return { colorHex: 0xffe87a, colorCss: '#ffe87a', hasCorona: false }
  if (absmag <  8)   return { colorHex: 0xffb347, colorCss: '#ffb347', hasCorona: false }
  return                    { colorHex: 0xff6b35, colorCss: '#ff6b35', hasCorona: false }
}

function parseSpect(
  spect: string | null,
  ci?: number | null,
  absmag?: number | null,
): SpectVisual {
  const DEFAULT: SpectVisual = { colorHex: 0xfff4e8, colorCss: '#fff4e8', hasCorona: false }
  if (spect) {
    const s = spect.trim()
    if (/^D/i.test(s)) {
      const m = s.match(/(\d+\.?\d*)/)
      const t = m ? parseFloat(m[1]) : 6
      if (t <= 3) return { colorHex: 0x99c0ff, colorCss: '#99c0ff', hasCorona: true  }
      if (t <= 6) return { colorHex: 0xd0e4ff, colorCss: '#d0e4ff', hasCorona: false }
      return             { colorHex: 0xf0e8dc, colorCss: '#f0e8dc', hasCorona: false }
    }
    const m = s.match(/[OBAFGKMobafgkm]/)
    const letter = m ? m[0].toUpperCase() : null
    const MAP: Record<string, SpectVisual> = {
      O: { colorHex: 0x9bb0ff, colorCss: '#9bb0ff', hasCorona: true  },
      B: { colorHex: 0xb0c4ff, colorCss: '#b0c4ff', hasCorona: true  },
      A: { colorHex: 0xd8e8ff, colorCss: '#d8e8ff', hasCorona: true  },
      F: { colorHex: 0xfff5e4, colorCss: '#fff5e4', hasCorona: true  },
      G: { colorHex: 0xffe87a, colorCss: '#ffe87a', hasCorona: false },
      K: { colorHex: 0xffb347, colorCss: '#ffb347', hasCorona: false },
      M: { colorHex: 0xff6b35, colorCss: '#ff6b35', hasCorona: false },
    }
    return MAP[letter ?? ''] ?? DEFAULT
  }
  if (ci != null) return colorFromCI(ci)
  if (absmag != null) return colorFromAbsmag(absmag)
  return DEFAULT
}

function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const lin = (c: number) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return L > 0.179 ? '#1a1a2e' : '#ffffff'
}

function starParams(star: Star | null) {
  const { colorCss, hasCorona } = parseSpect(star?.spect ?? null, star?.ci, star?.absmag)
  return { colorCss, hasCorona }
}

// ── 별 스토리 자동 생성 ──────────────────────────────
function starStory(star: Star): string {
  const spect  = star.spect?.trim() ?? null
  const mag    = star.mag
  const con    = star.con

  // 첫 문장: 분광형 기반
  let line1 = ''
  if (spect) {
    if (/^D/i.test(spect)) {
      line1 = '한때 태양 같은 별이었지만 일생을 마치고 서서히 식어가는 백색왜성입니다.'
    } else {
      const letter = spect.match(/[OBAFGKMobafgkm]/)?.[0]?.toUpperCase()
      if (letter === 'O' || letter === 'B') line1 = '우주에서 가장 뜨거운 부류의 별로, 표면 온도가 태양의 수 배에 달하며 강렬한 파란빛을 냅니다.'
      else if (letter === 'A') line1 = '베가나 시리우스와 같은 유형의 흰 별로, 태양보다 뜨겁고 밝게 빛납니다.'
      else if (letter === 'F') line1 = '태양보다 조금 더 뜨겁고 밝은 황백색 별로, 태양과 적색왜성의 중간쯤에 해당합니다.'
      else if (letter === 'G') line1 = '우리 태양과 같은 유형의 별로, 안정적인 황백색 빛을 내며 비슷한 수명을 가집니다.'
      else if (letter === 'K') line1 = '태양보다 조금 작고 차가운 주황색 별로, 조용하고 안정적으로 오랫동안 빛납니다.'
      else if (letter === 'M') line1 = '적색왜성으로, 태양보다 훨씬 작고 붉지만 연료를 천천히 소모해 수천억 년을 살아갑니다.'
    }
  }
  if (!line1) {
    const ci = star.ci
    if (ci != null) {
      if (ci < 0.2)      line1 = '흰빛 혹은 파란빛을 내는 뜨거운 별입니다.'
      else if (ci < 0.8) line1 = '태양과 비슷한 유형의 별로, 따뜻한 황백색 빛을 냅니다.'
      else if (ci < 1.4) line1 = '주황빛을 내는 별로, 태양보다 조금 더 붉고 차갑습니다.'
      else               line1 = '적색왜성으로 추정되는 별로, 붉은빛을 내며 오랜 시간 빛납니다.'
    } else {
      line1 = '광활한 우주에서 묵묵히 빛을 보내고 있는 별입니다.'
    }
  }

  // 두 번째 문장: 관측 가능 여부 or 별자리 or fallback
  let line2 = ''
  if (mag != null && mag <= 6) {
    line2 = `겉보기 등급 ${mag.toFixed(1)}로, 맑은 날 밤하늘에서 맨눈으로도 찾아볼 수 있어요.`
  } else if (con && CON_KO[con]) {
    line2 = `${CON_KO[con]}자리 방향으로 빛나고 있으며, 망원경으로 관측할 수 있어요.`
  } else if (mag != null) {
    line2 = `겉보기 등급 ${mag.toFixed(1)}로, 망원경이 있어야 볼 수 있을 만큼 어두운 별이에요.`
  } else {
    line2 = '아직 밝기 정보가 충분히 알려지지 않은 별이에요.'
  }

  return `${line1} ${line2}`
}

// ── 카피 ─────────────────────────────────────────────
function coordName(ra: number | null, dec: number | null): string {
  if (ra == null || dec == null) return '미분류 천체'
  const rh = Math.floor(ra)
  const rm = Math.floor((ra - rh) * 60)
  const sign = dec >= 0 ? '+' : '-'
  const dd = Math.floor(Math.abs(dec))
  const dm = Math.floor((Math.abs(dec) - dd) * 60)
  return `J${String(rh).padStart(2,'0')}${String(rm).padStart(2,'0')}${sign}${String(dd).padStart(2,'0')}${String(dm).padStart(2,'0')}`
}

const CON_KO: Record<string, string> = {
  And:'안드로메다',   Ant:'펌프',          Aps:'극락조',        Aqr:'물병',
  Aql:'독수리',       Ara:'제단',          Ari:'양',            Aur:'마차부',
  Boo:'목자',         Cae:'조각칼',        Cam:'기린',          Cnc:'게',
  CVn:'사냥개',       CMa:'큰개',          CMi:'작은개',        Cap:'염소',
  Car:'용골',         Cas:'카시오페이아',  Cen:'센타우루스',    Cep:'케페우스',
  Cet:'고래',         Cha:'카멜레온',      Cir:'컴퍼스',        Col:'비둘기',
  Com:'머리털',       CrA:'남쪽왕관',      CrB:'북쪽왕관',      Crv:'까마귀',
  Crt:'컵',           Cru:'남십자',        Cyg:'백조',          Del:'돌고래',
  Dor:'황새치',       Dra:'용',            Equ:'조랑말',        Eri:'에리다누스',
  For:'화로',         Gem:'쌍둥이',        Gru:'두루미',        Her:'헤르쿨레스',
  Hor:'시계',         Hya:'바다뱀',        Hyi:'물뱀',          Ind:'인디언',
  Lac:'도마뱀',       Leo:'사자',          LMi:'작은사자',      Lep:'토끼',
  Lib:'천칭',         Lup:'이리',          Lyn:'살쾡이',        Lyr:'거문고',
  Men:'테이블산',     Mic:'현미경',        Mon:'외뿔소',        Mus:'파리',
  Nor:'직각자',       Oct:'팔분의',        Oph:'뱀주인',        Ori:'오리온',
  Pav:'공작',         Peg:'페가수스',      Per:'페르세우스',    Phe:'불사조',
  Pic:'화가',         Psc:'물고기',        PsA:'남쪽물고기',    Pup:'고물',
  Pyx:'나침반',       Ret:'그물',          Sge:'화살',          Sgr:'궁수',
  Sco:'전갈',         Scl:'조각가',        Sct:'방패',          Ser:'뱀',
  Sex:'육분의',       Tau:'황소',          Tel:'망원경',        Tri:'삼각형',
  TrA:'남쪽삼각형',   Tuc:'큰부리새',      UMa:'큰곰',          UMi:'작은곰',
  Vel:'돛',           Vir:'처녀',          Vol:'날치',          Vul:'여우',
}

function starDisplayName(star: Star | null) {
  if (!star) return '미분류 천체'
  if (star.proper) return star.proper
  if (star.bf)     return star.bf.trim()
  if (star.hip)    return `HIP ${star.hip}`
  if (star.gl)     return star.gl.trim()
  if (star.con && CON_KO[star.con]) return `${CON_KO[star.con]}자리의 별`
  return coordName(star.ra, star.dec)
}

function formatDateKo(dateStr: string): string {
  // YYYY-MM-DD, YYYY.MM.DD, YYYYMMDD 모두 대응
  const clean = dateStr.replace(/[.\-/]/g, '')
  if (clean.length !== 8) return dateStr
  const y = clean.slice(0, 4)
  const m = parseInt(clean.slice(4, 6))
  const d = parseInt(clean.slice(6, 8))
  return `${y}년 ${m}월 ${d}일`
}

// B타입: 30일 이하 → 일, 초과 → 개월
// C/D타입: 개월 또는 년
function gapText(gapDays: number) {
  const d = Math.round(Math.abs(gapDays))
  if (d <= 30)  return `${d}일`
  if (d < 365)  return `${Math.round(d / 30)}개월`
  return `${(d / 365).toFixed(1)}년`
}

// ── 별자리 약어 → 전체 영문명 ────────────────────────
const CON_NAME: Record<string, string> = {
  And: 'Andromeda',    Ant: 'Antlia',       Aps: 'Apus',         Aqr: 'Aquarius',
  Aql: 'Aquila',       Ara: 'Ara',          Ari: 'Aries',        Aur: 'Auriga',
  Boo: 'Boötes',       Cae: 'Caelum',       Cam: 'Camelopardalis',Cnc: 'Cancer',
  CVn: 'Canes Venatici',CMa: 'Canis Major', CMi: 'Canis Minor',  Cap: 'Capricornus',
  Car: 'Carina',       Cas: 'Cassiopeia',   Cen: 'Centaurus',    Cep: 'Cepheus',
  Cet: 'Cetus',        Cha: 'Chamaeleon',   Cir: 'Circinus',     Col: 'Columba',
  Com: 'Coma Berenices',CrA: 'Corona Australis',CrB: 'Corona Borealis',Crv: 'Corvus',
  Crt: 'Crater',       Cru: 'Crux',         Cyg: 'Cygnus',       Del: 'Delphinus',
  Dor: 'Dorado',       Dra: 'Draco',        Equ: 'Equuleus',     Eri: 'Eridanus',
  For: 'Fornax',       Gem: 'Gemini',       Gru: 'Grus',         Her: 'Hercules',
  Hor: 'Horologium',   Hya: 'Hydra',        Hyi: 'Hydrus',       Ind: 'Indus',
  Lac: 'Lacerta',      Leo: 'Leo',          LMi: 'Leo Minor',    Lep: 'Lepus',
  Lib: 'Libra',        Lup: 'Lupus',        Lyn: 'Lynx',         Lyr: 'Lyra',
  Men: 'Mensa',        Mic: 'Microscopium', Mon: 'Monoceros',    Mus: 'Musca',
  Nor: 'Norma',        Oct: 'Octans',       Oph: 'Ophiuchus',    Ori: 'Orion',
  Pav: 'Pavo',         Peg: 'Pegasus',      Per: 'Perseus',      Phe: 'Phoenix',
  Pic: 'Pictor',       Psc: 'Pisces',       PsA: 'Piscis Austrinus',Pup: 'Puppis',
  Pyx: 'Pyxis',        Ret: 'Reticulum',    Sge: 'Sagitta',      Sgr: 'Sagittarius',
  Sco: 'Scorpius',     Scl: 'Sculptor',     Sct: 'Scutum',       Ser: 'Serpens',
  Sex: 'Sextans',      Tau: 'Taurus',       Tel: 'Telescopium',  Tri: 'Triangulum',
  TrA: 'Triangulum Australe',Tuc: 'Tucana', UMa: 'Ursa Major',  UMi: 'Ursa Minor',
  Vel: 'Vela',         Vir: 'Virgo',        Vol: 'Volans',       Vul: 'Vulpecula',
}

// ── 인포 모달 내용 ────────────────────────────────────
const INFO_MAG = {
  body: '지구에서 봤을 때 얼마나 밝게 보이는지를 나타내요. 숫자가 작을수록 더 밝습니다.\n\n6보다 작으면 맑은 날 밤 맨눈으로 볼 수 있어요.',
  table: [
    { label: '보름달', value: '−12' },
    { label: '금성',   value: '−4'  },
    { label: '북극성', value: '+2'  },
    { label: '맨눈 한계', value: '+6' },
  ],
}
const INFO_SPECT = {
  body: '별의 온도와 색깔을 알파벳으로 분류한 기호예요. O에서 M으로 갈수록 온도가 낮아지고 색이 붉어집니다.',
  rows: [
    { label: 'O · B · A', value: '파란빛, 뜨거운 별' },
    { label: 'F · G',     value: '노란빛 (G는 우리 태양과 같은 유형)' },
    { label: 'K · M',     value: '붉은빛, 상대적으로 차가운 별' },
  ],
  note: '뒤의 숫자(0–9)는 온도의 세부 단계, 알파벳(V·III·I)은 별의 크기예요.',
}

// ── 인포 모달 컴포넌트 ────────────────────────────────
function InfoModal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        pointerEvents: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(7,9,15,0.97)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '14px',
          padding: '28px 32px',
          maxWidth: '340px',
          width: '88vw',
          position: 'relative',
        }}
      >
        {children}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '14px', right: '16px',
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.40)',
            fontSize: '18px', cursor: 'pointer', lineHeight: 1,
          }}
        >×</button>
      </div>
    </div>
  )
}

// ── 컴포넌트 ─────────────────────────────────────────
export default function ResultScene({ result, onReset, birthdate }: Props) {
  const [visible,       setVisible]       = useState(false)
  const [modal,         setModal]         = useState<'mag' | 'spect' | null>(null)
  const [expanded,      setExpanded]      = useState(false)
  const [copied,        setCopied]        = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [isClamped,     setIsClamped]     = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  // 마운트 직후 짧은 딜레이 후 카드 등장 (TransitScene 줌인이 막 완료된 시점)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 500)
    return () => clearTimeout(t)
  }, [])

  // 텍스트 잘림 여부 측정 (해상도/폰트 크기 기반)
  useEffect(() => {
    const el = textRef.current
    if (!el) return
    const check = () => setIsClamped(el.scrollHeight > el.clientHeight + 1)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [result, expanded])

  async function handleShareLink() {
    setShowShareMenu(false)
    const bdate = birthdate.replace(/\D/g, '')
    const base  = `${window.location.origin}${window.location.pathname}`
    const url   = bdate.length === 8 ? `${base}?bdate=${bdate}` : base
    const dateLabel = birthdate ? formatDateKo(birthdate) : ''
    const shareTail = result.type === 'A'
      ? '바로 오늘 지구에 도달했습니다.'
      : result.type === 'B'
      ? `불과 ${gapText(result.gapDays ?? 0)} 전에 지구를 지나쳤습니다.`
      : Math.round(Math.abs(result.gapDays ?? 0)) === 0
        ? '바로 오늘 지구에 도착합니다.'
        : `${gapText(result.gapDays ?? 0)} 후 지구에 도착합니다.`
    const text  = result.type !== 'NO_STAR' && result.star
      ? `${dateLabel ? dateLabel + ', ' : ''}이 별에서 출발한 빛은\n${shareTail}\n\n당신의 별은 무엇인가요?`
      : `${dateLabel ? dateLabel + ', ' : ''}출발한 빛을 찾아보세요`

    if (navigator.share) {
      try { await navigator.share({ title: 'Unibirth', text, url }) } catch { /* 취소 */ }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleSave() {
    if (!result.star) return
    await document.fonts.ready   // 폰트 로드 완료 대기

    const IW = 1080, IH = 1920
    const out = document.createElement('canvas')
    out.width = IW; out.height = IH
    const ctx = out.getContext('2d')!
    const { colorCss: ACCENT } = starParams(result.star)
    const BAND   = 22
    const cardY  = IH * 0.62

    // ── 배경 ──
    ctx.fillStyle = '#07090f'
    ctx.fillRect(0, 0, IW, IH)

    const dateBottomY = BAND + 72 + 20
    const targetStarY = (dateBottomY + cardY) / 2

    // ── 별 필드 ──
    for (let i = 0; i < 300; i++) {
      const sx = Math.random() * IW
      const sy = Math.random() * (cardY + 80)
      const sr = Math.random() < 0.06 ? Math.random() * 1.8 + 0.9 : Math.random() * 0.9 + 0.2
      const sa = Math.random() * 0.55 + 0.25
      ctx.beginPath()
      ctx.arc(sx, sy, sr, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${sa.toFixed(2)})`
      ctx.fill()
    }

    const gx = IW / 2, gy = targetStarY

    // TransitScene과 동일한 공식으로 별 반지름 계산 후 시각 스케일 산출
    const absmag      = result.star.absmag ?? 5
    const starRadius  = Math.min(Math.max((20 - absmag) / 16, 0.22), 1.50)
    const visualScale = Math.min(Math.max(starRadius / 0.75, 0.4), 1.6)
    const SR = Math.round(72 * visualScale)    // 2D 글로우 반지름 (29–115 px)

    // ── hex → rgba 헬퍼 ──
    const toRgba = (hex: string, a: number) => {
      const h = hex.replace('#', '')
      const r = parseInt(h.slice(0,2), 16)
      const g = parseInt(h.slice(2,4), 16)
      const b = parseInt(h.slice(4,6), 16)
      return `rgba(${r},${g},${b},${a})`
    }

    // ── 2D 글로우 레이어 (메인 캔버스에 직접 → 경계선 없음) ──
    const farGlow = ctx.createRadialGradient(gx, gy, 0, gx, gy, SR * 10)
    farGlow.addColorStop(0,   toRgba(ACCENT, 0.22))
    farGlow.addColorStop(0.3, toRgba(ACCENT, 0.07))
    farGlow.addColorStop(1,   toRgba(ACCENT, 0))
    ctx.fillStyle = farGlow
    ctx.fillRect(gx - SR*10, gy - SR*10, SR*20, SR*20)

    const midGlow = ctx.createRadialGradient(gx, gy, 0, gx, gy, SR * 4)
    midGlow.addColorStop(0,    toRgba(ACCENT, 0.55))
    midGlow.addColorStop(0.45, toRgba(ACCENT, 0.18))
    midGlow.addColorStop(1,    toRgba(ACCENT, 0))
    ctx.fillStyle = midGlow
    ctx.fillRect(gx - SR*4, gy - SR*4, SR*8, SR*8)

    const atmo = ctx.createRadialGradient(gx, gy, SR * 0.85, gx, gy, SR * 1.7)
    atmo.addColorStop(0, toRgba(ACCENT, 0.65))
    atmo.addColorStop(1, toRgba(ACCENT, 0))
    ctx.fillStyle = atmo
    ctx.beginPath(); ctx.arc(gx, gy, SR * 1.7, 0, Math.PI * 2); ctx.fill()

    // ── Three.js 별 구체 (표면 셰이더 + 채층만, 글로우 스프라이트 없음) ──
    // 카메라 z=9.6 → 별 구체 반지름이 2D SR(72px)과 일치
    const SS = 400
    const starCanvas = document.createElement('canvas')
    starCanvas.width = starCanvas.height = SS
    try {
      const renderer = new THREE.WebGLRenderer({
        canvas: starCanvas, antialias: true, alpha: true, preserveDrawingBuffer: true,
      })
      renderer.setClearColor(0x000000, 0)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.2
      renderer.setSize(SS, SS)

      const scene  = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 1000)
      camera.position.set(0, 0, 9.6)   // star radius ≈ 72px in 400px canvas

      const colorHex  = parseInt(ACCENT.replace('#', ''), 16)
      const starColor = new THREE.Color(colorHex)
      const R = 2

      // 별 표면 (FBM grain + limb darkening)
      const starMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uColor: { value: starColor } },
        vertexShader: STAR_VERT, fragmentShader: STAR_FRAG,
      })
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(R, 64, 64), starMat))

      // 채층 (rim glow) — 구체 가장자리에만 존재, 외부는 투명
      const chromoMat = new THREE.ShaderMaterial({
        uniforms: {
          uColor:   { value: starColor.clone().lerp(new THREE.Color(0xffffff), 0.3) },
          uOpacity: { value: 0.9 },
        },
        vertexShader: CHROMO_VERT, fragmentShader: CHROMO_FRAG,
        transparent: true, side: THREE.FrontSide, depthWrite: false,
      })
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.04, 48, 48), chromoMat))

      renderer.render(scene, camera)
      renderer.render(scene, camera)
      renderer.dispose()
    } catch {
      // WebGL 실패 시 2D 폴백 코어
      const g2 = starCanvas.getContext('2d')!
      const half = SS / 2
      const core2d = g2.createRadialGradient(half, half, 0, half, half, half * 0.4)
      core2d.addColorStop(0,   'rgba(255,255,255,1)')
      core2d.addColorStop(0.4, toRgba(ACCENT, 0.9))
      core2d.addColorStop(1,   toRgba(ACCENT, 0))
      g2.fillStyle = core2d
      g2.beginPath(); g2.arc(half, half, half * 0.4, 0, Math.PI * 2); g2.fill()
    }

    // 별 구체 합성: visualScale에 따라 그리기 크기 조정 (경계 없음)
    const SS_draw = Math.round(SS * visualScale)
    ctx.drawImage(starCanvas, gx - SS_draw / 2, gy - SS_draw / 2, SS_draw, SS_draw)

    // ── 하단 그라디언트 오버레이 ──
    const grad = ctx.createLinearGradient(0, cardY - 80, 0, IH)
    grad.addColorStop(0,    'rgba(7,9,15,0)')
    grad.addColorStop(0.15, 'rgba(7,9,15,0.82)')
    grad.addColorStop(0.30, 'rgba(7,9,15,0.96)')
    grad.addColorStop(1,    'rgba(7,9,15,1)')
    ctx.fillStyle = grad
    ctx.fillRect(0, cardY - 80, IW, IH - cardY + 80)

    // ── 상단 날짜 ──
    const today = new Date()
    const dateStr = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')}`
    ctx.textAlign  = 'center'
    ctx.font       = '300 34px Inter, Arial, sans-serif'
    ctx.fillStyle  = 'rgba(255,255,255,0.28)'
    ctx.fillText(dateStr, IW / 2, BAND + 72)

    const T = 20  // 텍스트 전체 아래 이동 오프셋

    // 거리↔카피 간격(106px)을 별 이름 상단 여백으로 통일
    const TOP = 106 + T

    // ── 별 이름 ──
    ctx.font      = '400 88px Georgia, serif'
    ctx.fillStyle = ACCENT
    ctx.fillText(starDisplayName(result.star), IW / 2, cardY + TOP)

    // ── 거리 ──
    ctx.font      = '300 44px Inter, Arial, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.68)'
    ctx.fillText(`지구로부터  ${result.star.dist_ly.toFixed(2)} 광년`, IW / 2, cardY + TOP + 72)

    // ── 카피 ──
    const dl = birthdate ? formatDateKo(birthdate) : ''
    const copyTail: string = result.type === 'A'
      ? '바로 오늘 지구에 도달했습니다'
      : result.type === 'B'
      ? `불과 ${gapText(result.gapDays ?? 0)} 전에 지구를 지나쳤습니다`
      : Math.round(Math.abs(result.gapDays ?? 0)) === 0
        ? '바로 오늘 지구에 도착합니다'
        : `${gapText(result.gapDays ?? 0)} 후 지구에 도착합니다`
    // 줄1: "{생일}, 이 별에서 출발한 빛은"  줄2: 나머지
    const line1 = `${dl ? dl + ', ' : ''}이 별에서 출발한 빛은`
    const copyLines = [line1, copyTail]

    ctx.font      = '300 40px Inter, Arial, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.62)'
    const lineH  = 58
    const startY = cardY + TOP + 178
    copyLines.forEach((line, i) => ctx.fillText(line, IW / 2, startY + i * lineH))

    // ── 브랜딩 ──
    ctx.font      = '400 34px Georgia, serif'
    ctx.fillStyle = 'rgba(255,255,255,0.20)'
    ctx.fillText('Unibirth', IW / 2, IH - BAND - 60)

    // ── 가장자리 띠 ──
    ctx.strokeStyle = ACCENT
    ctx.lineWidth   = BAND
    ctx.strokeRect(BAND / 2, BAND / 2, IW - BAND, IH - BAND)

    // ── 저장: Instagram WebView 감지 후 분기 ──
    const dataUrl = out.toDataURL('image/png')
    const ua = navigator.userAgent
    const isInstagram = /Instagram/i.test(ua)
    const isKakao     = /KAKAOTALK/i.test(ua)
    const isRestrictedInApp = isInstagram || isKakao

    const overlay = document.createElement('div')
    overlay.style.cssText = [
      'position:fixed;inset:0;z-index:9999',
      'background:rgba(0,0,0,0.90)',
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px',
      'touch-action:manipulation;-webkit-tap-highlight-color:transparent',
    ].join(';')

    if (isRestrictedInApp) {
      // Instagram / 카카오톡 인앱 브라우저: 이미지 저장 차단됨 → 외부 브라우저 안내
      const appName = isKakao ? '카카오톡' : 'Instagram'
      const icon = document.createElement('p')
      icon.textContent = '🔒'
      icon.style.cssText = 'font-size:36px;margin:0'

      const title = document.createElement('p')
      title.textContent = `${appName}에서는 이미지 저장이 제한돼요`
      title.style.cssText = 'color:rgba(255,255,255,0.90);font-size:15px;font-family:sans-serif;margin:0;font-weight:500;text-align:center;padding:0 32px'

      const desc = document.createElement('p')
      desc.innerHTML = '앱 내 메뉴에서<br><strong>기본 브라우저로 열기</strong>를 선택하면<br>이미지를 저장할 수 있어요'
      desc.style.cssText = 'color:rgba(255,255,255,0.55);font-size:13px;font-family:sans-serif;margin:0;line-height:1.8;text-align:center'

      const closeBtn = document.createElement('button')
      closeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 18 18" fill="none"><line x1="2" y1="2" x2="16" y2="16" stroke="rgba(255,255,255,0.55)" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="2" x2="2" y2="16" stroke="rgba(255,255,255,0.55)" stroke-width="2" stroke-linecap="round"/></svg>'
      closeBtn.style.cssText = [
        'position:absolute;top:20px;right:20px',
        'width:40px;height:40px;border-radius:50%',
        'background:none;border:none',
        'display:flex;align-items:center;justify-content:center',
        'cursor:pointer;touch-action:manipulation',
      ].join(';')

      const close = () => { if (document.body.contains(overlay)) document.body.removeChild(overlay) }
      overlay.addEventListener('click', close)
      closeBtn.addEventListener('click',    e => { e.stopPropagation(); close() })
      closeBtn.addEventListener('touchend', e => { e.stopPropagation(); e.preventDefault(); close() })

      overlay.appendChild(closeBtn)
      overlay.appendChild(icon)
      overlay.appendChild(title)
      overlay.appendChild(desc)

    } else {
      // 일반 브라우저: 저장 버튼 + 이미지
      const img = document.createElement('img')
      img.src = dataUrl
      img.alt = '탄생별 결과 이미지'
      img.style.cssText = 'max-height:62vh;max-width:82vw;border-radius:8px;display:block;-webkit-touch-callout:default'
      img.addEventListener('click', e => e.stopPropagation())

      const starName = result.star ? starDisplayName(result.star).replace(/\s+/g, '-') : 'star'

      // 버튼 행
      const btnRow = document.createElement('div')
      btnRow.style.cssText = 'display:flex;gap:10px;align-items:center'

      const saveBtn = document.createElement('a')
      saveBtn.href     = dataUrl
      saveBtn.download = `unibirth-${starName}.png`
      saveBtn.textContent = '저장하기'
      saveBtn.style.cssText = [
        'display:block;text-decoration:none;text-align:center',
        'background:rgba(255,255,255,0.10);border:1px solid rgba(255,255,255,0.22);border-radius:100px',
        'color:rgba(255,255,255,0.80);font-size:14px;font-family:sans-serif',
        'padding:12px 28px;cursor:pointer;touch-action:manipulation;letter-spacing:0.04em',
      ].join(';')
      saveBtn.addEventListener('click', e => e.stopPropagation())

      // 이미지로 공유하기 (Web Share API Level 2)
      const canShareFiles = typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function'
      if (canShareFiles) {
        const shareBtn = document.createElement('button')
        shareBtn.textContent = '공유하기'
        shareBtn.style.cssText = [
          'display:block;text-align:center',
          'background:rgba(255,255,255,0.10);border:1px solid rgba(255,255,255,0.22);border-radius:100px',
          'color:rgba(255,255,255,0.80);font-size:14px;font-family:sans-serif',
          'padding:12px 28px;cursor:pointer;touch-action:manipulation;letter-spacing:0.04em',
        ].join(';')
        shareBtn.addEventListener('click', async e => {
          e.stopPropagation()
          try {
            const res  = await fetch(dataUrl)
            const blob = await res.blob()
            const file = new File([blob], `unibirth-${starName}.png`, { type: 'image/png' })
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ files: [file], title: '나의 탄생별' })
            }
          } catch (_err) { /* 사용자가 취소한 경우 등 무시 */ }
        })
        btnRow.appendChild(saveBtn)
        btnRow.appendChild(shareBtn)
      } else {
        saveBtn.textContent = '이미지 저장하기'
        saveBtn.style.padding = '12px 36px'
        btnRow.appendChild(saveBtn)
      }

      const closeBtn = document.createElement('button')
      closeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 18 18" fill="none"><line x1="2" y1="2" x2="16" y2="16" stroke="rgba(255,255,255,0.55)" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="2" x2="2" y2="16" stroke="rgba(255,255,255,0.55)" stroke-width="2" stroke-linecap="round"/></svg>'
      closeBtn.style.cssText = [
        'position:absolute;top:20px;right:20px',
        'width:40px;height:40px;border-radius:50%',
        'background:none;border:none',
        'display:flex;align-items:center;justify-content:center',
        'cursor:pointer;touch-action:manipulation',
      ].join(';')

      const close = () => { if (document.body.contains(overlay)) document.body.removeChild(overlay) }
      overlay.addEventListener('click', close)
      closeBtn.addEventListener('click',    e => { e.stopPropagation(); close() })
      closeBtn.addEventListener('touchend', e => { e.stopPropagation(); e.preventDefault(); close() })

      overlay.appendChild(closeBtn)
      overlay.appendChild(img)
      overlay.appendChild(btnRow)
    }

    document.body.appendChild(overlay)
  }

  if (result.type === 'NO_STAR') {
    const nearestStar = result.star
    const nearestName = starDisplayName(nearestStar)
    const nearestDist = nearestStar ? `${nearestStar.dist_ly.toFixed(2)}광년` : '알 수 없음'
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        background: '#07090f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          ...styles.card,
          position: 'relative',
          bottom: 'auto', left: 'auto',
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.8s ease, transform 0.8s ease',
          textAlign: 'center' as const,
        }}>
          <h2 style={{ ...styles.starName, fontSize: '22px', lineHeight: 1.5, color: '#fff4e8' }}>
            {formatDateKo(birthdate)} 출발한 빛을<br />발견하지 못했습니다
          </h2>
          {nearestStar && (
            <p style={styles.bodyText}>
              가장 근접한 별은{' '}
              <strong style={{ color: 'var(--accent)' }}>{nearestDist}</strong> 거리에 있는{' '}
              <strong style={{ color: 'var(--accent)' }}>{nearestName}</strong>입니다.
            </p>
          )}
          <button onClick={onReset} className="reset-btn-hover" style={styles.resetBtn}>← 돌아가기</button>
        </div>
      </div>
    )
  }

  const { star, gapDays, type } = result
  const { colorCss: css } = starParams(star)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1,
      background: 'transparent',
      pointerEvents: 'none',  // 클릭 이벤트 TransitScene 캔버스까지 통과
    }}>
      <style>{`
        .result-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.03);
          cursor: default;
          user-select: none;
        }
        .chip-label {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.40);
          font-family: 'Inter', sans-serif;
          font-weight: 400;
        }
        .chip-value {
          font-size: 13px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.01em;
        }
        .chip-info-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.20);
          background: none;
          color: rgba(255,255,255,0.40);
          font-size: 9px;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          cursor: pointer;
          line-height: 1;
          transition: border-color 0.15s, color 0.15s;
          flex-shrink: 0;
          pointer-events: auto;
        }
        .chip-info-btn:hover {
          border-color: rgba(255,255,255,0.40);
          color: rgba(255,255,255,0.75);
        }
        .modal-body {
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          line-height: 1.75;
          font-family: 'Inter', sans-serif;
          white-space: pre-line;
        }
        .modal-table {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .modal-table-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          font-family: 'Inter', sans-serif;
        }
        .modal-table-label {
          color: rgba(255,255,255,0.40);
        }
        .modal-table-value {
          color: rgba(255,255,255,0.75);
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }
        .modal-rows {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .modal-row-label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.75);
          font-family: 'Inter', sans-serif;
          min-width: 72px;
        }
        .modal-row-value {
          font-size: 12px;
          color: rgba(255,255,255,0.55);
          font-family: 'Inter', sans-serif;
        }
        .modal-note {
          margin-top: 14px;
          font-size: 11px;
          color: rgba(255,255,255,0.25);
          font-family: 'Inter', sans-serif;
          line-height: 1.6;
        }
        .reset-btn-hover {
          transition: border-color 0.18s, color 0.18s, background 0.18s;
        }
        .reset-btn-hover:hover {
          border-color: rgba(255,255,255,0.30) !important;
          color: rgba(255,255,255,0.85) !important;
          background: rgba(255,255,255,0.06) !important;
        }
        .share-menu {
          position: absolute;
          top: 58px;
          right: 12px;
          background: rgba(7,9,15,0.97);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          overflow: hidden;
          z-index: 10;
          min-width: 148px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.40);
        }
        .share-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 13px 16px;
          background: none;
          border: none;
          color: rgba(255,255,255,0.70);
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          text-align: left;
          transition: background 0.12s;
          white-space: nowrap;
        }
        .share-menu-item + .share-menu-item {
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .share-menu-item:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.90);
        }
        .expand-section {
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transition: max-height 0.38s ease, opacity 0.28s ease;
        }
        .expand-section.open {
          max-height: 300px;
          opacity: 1;
        }
        .more-btn {
          display: inline;
          background: none;
          border: none;
          padding: 0;
          color: var(--text-dim);
          font-size: 12px;
          font-family: 'Inter', sans-serif;
          font-weight: 400;
          line-height: 1.8;
          cursor: pointer;
          pointer-events: auto;
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-color: var(--text-dim);
        }
        .more-btn:hover {
          color: var(--text-muted);
          text-decoration-color: var(--text-muted);
        }
      `}</style>


      {/* 인포 모달 */}
      {modal === 'mag' && (
        <InfoModal onClose={() => setModal(null)}>
          <p className="modal-body">{INFO_MAG.body}</p>
          <div className="modal-table">
            {INFO_MAG.table.map(r => (
              <div key={r.label} className="modal-table-row">
                <span className="modal-table-label">{r.label}</span>
                <span className="modal-table-value">{r.value}</span>
              </div>
            ))}
          </div>
        </InfoModal>
      )}
      {modal === 'spect' && (
        <InfoModal onClose={() => setModal(null)}>
          <p className="modal-body">{INFO_SPECT.body}</p>
          <div className="modal-rows">
            {INFO_SPECT.rows.map(r => (
              <div key={r.label} style={{ display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                <span className="modal-row-label">{r.label}</span>
                <span className="modal-row-value">{r.value}</span>
              </div>
            ))}
          </div>
          <p className="modal-note">{INFO_SPECT.note}</p>
        </InfoModal>
      )}

      {/* 좌측 상단 고정: 다시 탐색하기 */}
      <button
        onClick={onReset}
        className="reset-btn-hover"
        style={{
          ...styles.resetBtn,
          position: 'absolute',
          top: '28px',
          left: '32px',
          zIndex: 2,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.9s ease',
          pointerEvents: 'auto',
        }}
      >
        ← 다시 탐색하기
      </button>

      {/* 별 정보 카드 */}
      <div style={{
        ...styles.card,
        opacity:    visible ? 1 : 0,
        transform:  `translateX(-50%) ${visible ? 'translateY(0)' : 'translateY(24px)'}`,
        transition: 'opacity 0.9s ease, transform 0.9s ease',
        pointerEvents: 'auto',
        position: 'absolute',
        border: `1px solid ${css}55`,
      }}>

        {/* 발견 문장 */}
        <p style={{
          fontSize: '13px',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          color: 'rgba(255,255,255,0.50)',
          margin: 0,
          lineHeight: 1.6,
        }}>
          지구로부터{' '}
          <span style={{ color: css, fontWeight: 500 }}>
            {(star?.dist_ly ?? 0).toFixed(2)} 광년
          </span>{' '}
          떨어진{' '}
          <span style={{ color: css, fontWeight: 500 }}>
            {starDisplayName(star)}
          </span>
          을(를) 찾았습니다.
        </p>

        {/* 카피 + 스토리 */}
        {(() => {
          const dl   = formatDateKo(birthdate)
          const copy = type === 'A'
            ? `${dl}, 이 별을 출발한 빛이 오늘 지구에 도달했습니다.`
            : type === 'B'
            ? `${dl}, 이 별에서 출발한 빛은 불과 ${gapText(gapDays ?? 0)} 전에 지구를 지나쳤습니다.`
            : Math.round(Math.abs(gapDays ?? 0)) === 0
              ? `${dl}, 이 별을 출발한 빛은 오늘 지구에 도착합니다.`
              : `${dl}, 이 별을 출발한 빛은 ${gapText(gapDays ?? 0)} 후 지구에 도착합니다.`
          const story = star ? starStory(star) : ''
          const fullText = story ? `${copy} ${story}` : copy

          return (
            <div style={{ position: 'relative' }}>
              <p
                ref={textRef}
                style={{
                  fontSize: '16px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.75)',
                  lineHeight: 1.8,
                  margin: 0,
                  ...(!expanded ? {
                    maxHeight: 'calc(1.8em * 2)',
                    overflow: 'hidden',
                  } : {}),
                }}
              >
                {fullText}
              </p>

              {/* 말줄임 + 더보기 (접힌 상태 & 실제로 잘린 경우) */}
              {!expanded && isClamped && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '120px',
                  height: 'calc(1.8em)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  background: 'linear-gradient(to right, transparent, rgba(7,9,15,1) 60%)',
                }}>
                  <button className="more-btn" onClick={() => setExpanded(true)}>더보기</button>
                </div>
              )}

            </div>
          )
        })()}

        <div className={`expand-section${expanded ? ' open' : ''}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px' }}>
            <div style={styles.metaRow}>
              {star?.mag != null && (
                <span className="result-chip">
                  <span className="chip-label">겉보기 등급</span>
                  <span className="chip-value" style={{ color: css }}>{star.mag.toFixed(1)}</span>
                  <button className="chip-info-btn" onClick={() => setModal('mag')}>i</button>
                </span>
              )}
              {star != null && (
                <span className="result-chip">
                  <span className="chip-label">분광형</span>
                  {star.spect
                    ? <span className="chip-value" style={{ color: css }}>{star.spect.slice(0, 4)}</span>
                    : <span className="chip-value" style={{ color: 'rgba(255,255,255,0.25)' }}>-</span>
                  }
                  <button className="chip-info-btn" onClick={() => setModal('spect')}>i</button>
                </span>
              )}
              {star?.con && (
                <span className="result-chip">
                  <span className="chip-label">별자리</span>
                  <span className="chip-value" style={{ color: css }}>
                    {CON_NAME[star.con] ?? star.con}
                  </span>
                </span>
              )}
            </div>

            {/* 접기 버튼 - 칩 아래 오른쪽 정렬 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="more-btn" onClick={() => setExpanded(false)}>접기</button>
            </div>
          </div>
        </div>

        {/* 공유 버튼 - 하단 중앙 */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', pointerEvents: 'auto' }}>
          <button
            onClick={() => setShowShareMenu(v => !v)}
            style={{
              background: copied ? 'rgba(160,220,160,0.25)' : css,
              border: 'none',
              borderRadius: '100px',
              color: copied ? '#1a1a2e' : contrastColor(css),
              fontSize: '13px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              letterSpacing: '0.03em',
              cursor: 'pointer',
              padding: '10px 24px',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.82' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          >
            {copied ? '✓ 복사됨' : '결과 공유하기'}
          </button>

          {showShareMenu && (
            <>
              <div
                onClick={() => setShowShareMenu(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 9 }}
              />
              <div className="share-menu" style={{ top: 'auto', bottom: '44px', right: 'auto' }}>
                <button className="share-menu-item" onClick={handleShareLink}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  링크 공유
                </button>
                <button className="share-menu-item" onClick={() => { setShowShareMenu(false); handleSave() }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                    <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  이미지로 공유
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    position: 'absolute',
    bottom: '5vh',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(7,9,15,0.72)',
    backdropFilter: 'blur(24px)',
    border: '1px solid var(--border-accent)',
    borderRadius: '16px',
    padding: '24px 32px',
    maxWidth: '480px',
    width: '90vw',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  starName: {
    fontFamily: "'DM Serif Display', serif",
    fontWeight: 400,
    lineHeight: 1.2,
  },
  bodyText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.75,
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginTop: '6px',
  },
  resetBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-dim)',
    fontSize: '11px',
    letterSpacing: '0.06em',
    padding: '0',
    cursor: 'pointer',
  },
}
