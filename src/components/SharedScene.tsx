import { useState } from 'react'
import type { MatchResult, Star } from '../lib'
import Footer from './Footer'

interface Props {
  result: MatchResult
  onTryService: () => void
}

// ── helpers (duplicated from ResultScene to keep SharedScene self-contained) ──
interface SpectVisual { colorCss: string }

function colorFromCI(ci: number): SpectVisual {
  if (ci < -0.1) return { colorCss: '#b0c4ff' }
  if (ci <  0.2) return { colorCss: '#d8e8ff' }
  if (ci <  0.5) return { colorCss: '#fff5e4' }
  if (ci <  0.8) return { colorCss: '#ffe87a' }
  if (ci <  1.4) return { colorCss: '#ffb347' }
  return               { colorCss: '#ff6b35' }
}

function colorFromAbsmag(absmag: number): SpectVisual {
  if (absmag <  2)   return { colorCss: '#b0c4ff' }
  if (absmag <  4)   return { colorCss: '#d8e8ff' }
  if (absmag <  5.5) return { colorCss: '#ffe87a' }
  if (absmag <  8)   return { colorCss: '#ffb347' }
  return                    { colorCss: '#ff6b35' }
}

function parseSpect(
  spect: string | null,
  ci?: number | null,
  absmag?: number | null,
): SpectVisual {
  const DEFAULT: SpectVisual = { colorCss: '#fff4e8' }
  if (spect) {
    const s = spect.trim()
    if (/^D/i.test(s)) {
      const m = s.match(/(\d+\.?\d*)/)
      const t = m ? parseFloat(m[1]) : 6
      if (t <= 3) return { colorCss: '#99c0ff' }
      if (t <= 6) return { colorCss: '#d0e4ff' }
      return             { colorCss: '#f0e8dc' }
    }
    const m = s.match(/[OBAFGKMobafgkm]/)
    const letter = m ? m[0].toUpperCase() : null
    const MAP: Record<string, SpectVisual> = {
      O: { colorCss: '#9bb0ff' },
      B: { colorCss: '#b0c4ff' },
      A: { colorCss: '#d8e8ff' },
      F: { colorCss: '#fff5e4' },
      G: { colorCss: '#ffe87a' },
      K: { colorCss: '#ffb347' },
      M: { colorCss: '#ff6b35' },
    }
    return MAP[letter ?? ''] ?? DEFAULT
  }
  if (ci != null) return colorFromCI(ci)
  if (absmag != null) return colorFromAbsmag(absmag)
  return DEFAULT
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
  return '미분류 천체'
}

function typeCopy(result: MatchResult): string {
  if (result.type === 'NO_STAR') return '당신이 태어난 날 출발한 빛을 발견하지 못했어요'
  if (result.type === 'A') return '당신이 태어난 날 이 별을 출발한 빛이, 오늘 지구에 도달했습니다'
  const d = Math.round(Math.abs(result.gapDays ?? 0))
  const gap = d <= 30 ? `${d}일` : d < 365 ? `${Math.round(d/30)}개월` : `${(d/365).toFixed(1)}년`
  if (result.type === 'B') return `이 별에서 출발한 빛은 불과 ${gap} 전에 지구를 지나쳤습니다`
  return `이 별에서 출발한 빛은 ${gap} 후 지구에 도착합니다`
}

export default function SharedScene({ result, onTryService }: Props) {
  const [hovered, setHovered] = useState(false)

  const star = result.star
  const { colorCss } = parseSpect(star?.spect ?? null, star?.ci, star?.absmag)
  const name = starDisplayName(star)
  const copy = typeCopy(result)

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#07090f',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      overflow: 'hidden',
    }}>
      {/* 배경 별빛 효과 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 60% 50% at 50% 38%, ${colorCss}18 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* 별 그래픽 */}
      <div style={{ position: 'relative', marginBottom: '40px' }}>
        {/* 외부 글로우 */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200px', height: '200px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colorCss}22 0%, ${colorCss}08 40%, transparent 70%)`,
          filter: 'blur(20px)',
        }} />
        {/* 중간 글로우 */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100px', height: '100px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colorCss}55 0%, ${colorCss}22 50%, transparent 80%)`,
          filter: 'blur(8px)',
        }} />
        {/* 별 코어 */}
        <div style={{
          width: '52px', height: '52px',
          borderRadius: '50%',
          background: `radial-gradient(circle at 38% 38%, white 0%, ${colorCss} 45%, ${colorCss}88 100%)`,
          boxShadow: `0 0 24px 8px ${colorCss}66, 0 0 60px 20px ${colorCss}22`,
          position: 'relative',
        }} />
      </div>

      {/* 텍스트 */}
      <div style={{
        textAlign: 'center',
        padding: '0 32px',
        maxWidth: '380px',
        width: '100%',
      }}>
        {/* 별 이름 */}
        <h1 style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: 'clamp(28px, 7vw, 42px)',
          fontWeight: 400,
          color: colorCss,
          margin: '0 0 12px',
          lineHeight: 1.15,
        }}>
          {name}
        </h1>

        {/* 구분선 */}
        <div style={{
          width: '40px', height: '1px',
          background: `${colorCss}44`,
          margin: '0 auto 18px',
        }} />

        {/* 설명 카피 */}
        <p style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.75,
          margin: '0 0 40px',
          fontWeight: 300,
        }}>
          {copy}
        </p>

        {/* CTA 버튼 */}
        <button
          onClick={onTryService}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 28px',
            borderRadius: '100px',
            border: `1px solid ${hovered ? colorCss + 'cc' : colorCss + '66'}`,
            background: hovered ? colorCss + '18' : colorCss + '0a',
            color: hovered ? colorCss : colorCss + 'cc',
            fontSize: '14px',
            fontWeight: 500,
            letterSpacing: '0.02em',
            cursor: 'pointer',
            transition: 'border-color 0.2s, background 0.2s, color 0.2s',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          나의 별 탐색하기
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>

      </div>

      {/* 푸터 */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <Footer />
      </div>
    </div>
  )
}
