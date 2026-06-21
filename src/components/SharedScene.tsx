import { useState } from 'react'
import type { MatchResult, Star } from '../lib'
import Footer from './Footer'

interface Props {
  result: MatchResult
  onTryService: () => void
}

// ── helpers (duplicated from ResultScene to keep SharedScene self-contained) ──
interface SpectVisual { colorCss: string }

function parseSpect(spect: string | null): SpectVisual {
  const DEFAULT: SpectVisual = { colorCss: '#fff4e8' }
  if (!spect) return DEFAULT
  const s = spect.trim()
  if (/^D/i.test(s)) {
    const m = s.match(/(\d+\.?\d*)/)
    const t = m ? parseFloat(m[1]) : 6
    if (t <= 3) return { colorCss: '#99c0ff' }
    if (t <= 6) return { colorCss: '#d0e4ff' }
    return { colorCss: '#f0e8dc' }
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

function starDisplayName(star: Star | null) {
  if (!star) return '미분류 천체'
  if (star.proper) return star.proper
  if (star.hip)   return `HIP ${star.hip}`
  const ra  = star.ra  ?? 0
  const dec = star.dec ?? 0
  const rh  = Math.floor(ra)
  const rm  = Math.floor((ra - rh) * 60)
  const sign = dec >= 0 ? '+' : '-'
  const dd  = Math.floor(Math.abs(dec))
  const dm  = Math.floor((Math.abs(dec) - dd) * 60)
  return `J${String(rh).padStart(2,'0')}${String(rm).padStart(2,'0')}${sign}${String(dd).padStart(2,'0')}${String(dm).padStart(2,'0')}`
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
  const { colorCss } = parseSpect(star?.spect ?? null)
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
