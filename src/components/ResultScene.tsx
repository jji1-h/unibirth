import { useEffect, useState, type ReactNode } from 'react'
import type { MatchResult, Star } from '../lib'

interface Props {
  result:    MatchResult
  onReset:   () => void
  birthdate: string   // 공유 URL 생성에 사용
}

// ── 스펙트럼 → 시각 특성 파싱 ──────────────────────
interface SpectVisual { colorHex: number; colorCss: string; hasCorona: boolean }

function parseSpect(spect: string | null): SpectVisual {
  const DEFAULT: SpectVisual = { colorHex: 0xfff4e8, colorCss: '#fff4e8', hasCorona: false }
  if (!spect) return DEFAULT
  const s = spect.trim()

  if (/^D/i.test(s)) {
    const m = s.match(/(\d+\.?\d*)/)
    const t = m ? parseFloat(m[1]) : 6
    if (t <= 3) return { colorHex: 0x99c0ff, colorCss: '#99c0ff', hasCorona: true  }
    if (t <= 6) return { colorHex: 0xd0e4ff, colorCss: '#d0e4ff', hasCorona: false }
    return           { colorHex: 0xf0e8dc, colorCss: '#f0e8dc', hasCorona: false }
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

function starParams(star: Star | null) {
  const { colorCss } = parseSpect(star?.spect ?? null)
  return { colorCss }
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

function starDisplayName(star: Star | null) {
  if (!star) return '미분류 천체'
  if (star.proper) return star.proper
  if (star.hip)   return `HIP ${star.hip}`
  return coordName(star.ra, star.dec)
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
          background: 'rgba(13,16,32,0.96)',
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
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
            fontSize: '18px', cursor: 'pointer', lineHeight: 1,
          }}
        >×</button>
      </div>
    </div>
  )
}

// ── 컴포넌트 ─────────────────────────────────────────
export default function ResultScene({ result, onReset, birthdate }: Props) {
  const [visible,  setVisible]  = useState(false)
  const [modal,    setModal]    = useState<'mag' | 'spect' | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [copied,   setCopied]   = useState(false)

  // 마운트 직후 짧은 딜레이 후 카드 등장 (TransitScene 줌인이 막 완료된 시점)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 500)
    return () => clearTimeout(t)
  }, [])

  async function handleShare() {
    // 생년월일을 URL 파라미터로 인코딩 (YYYYMMDD)
    const bdate  = birthdate.replace(/\D/g, '')
    const base   = `${window.location.origin}${window.location.pathname}`
    const url    = bdate.length === 8 ? `${base}?bdate=${bdate}` : base
    const text   = result.type !== 'NO_STAR' && result.star
      ? '광활한 우주에서 내가 태어난 날의 빛을 찾았어요. 당신의 별은 무엇인가요?'
      : '당신이 태어난 바로 그날 출발한 빛을 찾아보세요'

    if (navigator.share) {
      try { await navigator.share({ title: 'Unibirth', text, url }) } catch { /* 취소 */ }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleSave() {
    if (!result.star) return
    const src = document.querySelector('canvas') as HTMLCanvasElement | null

    const IW = 1080, IH = 1920
    const out = document.createElement('canvas')
    out.width = IW; out.height = IH
    const ctx = out.getContext('2d')!
    const ACCENT = starParams(result.star).colorCss
    const BAND   = 22
    const cardY  = IH * 0.62

    // ── 배경 ──
    ctx.fillStyle = '#07090f'
    ctx.fillRect(0, 0, IW, IH)

    // ── WebGL canvas 복사 (CORS taint 시 procedural 별 배경으로 폴백) ──
    const dateBottomY = BAND + 72 + 20
    const targetStarY = (dateBottomY + cardY) / 2

    let canvasCopied = false
    if (src) {
      try {
        const srcW = src.width, srcH = src.height
        const scale   = Math.max(IW / srcW, IH / srcH)
        const scaledW = srcW * scale
        const scaledH = srcH * scale
        const drawX = IW / 2 - scaledW / 2
        const drawY = targetStarY - scaledH / 2
        ctx.drawImage(src, 0, 0, srcW, srcH, drawX, drawY, scaledW, scaledH)
        // taint 확인: toDataURL 호출 시 에러나면 catch로 이동
        out.toDataURL('image/png').slice(0, 10)
        canvasCopied = true
      } catch {
        // cross-origin taint → procedural fallback
        ctx.fillStyle = '#07090f'
        ctx.fillRect(0, 0, IW, IH)
      }
    }

    // procedural 별 배경 (canvas 복사 실패 또는 src 없을 때)
    if (!canvasCopied) {
      const rng = (n: number) => Math.random() * n
      for (let i = 0; i < 320; i++) {
        const x = rng(IW), y = rng(cardY + 60)
        const r = Math.random() < 0.05 ? rng(2.2) + 0.8 : rng(1.2) + 0.3
        const a = Math.random() * 0.7 + 0.3
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`
        ctx.fill()
      }
      // 별 글로우 (결과 별 중심)
      const gx = IW / 2, gy = targetStarY
      const grd = ctx.createRadialGradient(gx, gy, 0, gx, gy, 120)
      grd.addColorStop(0,   ACCENT.replace(')', ',0.9)').replace('rgb(', 'rgba('))
      grd.addColorStop(0.3, ACCENT.replace(')', ',0.3)').replace('rgb(', 'rgba('))
      grd.addColorStop(1,   'rgba(7,9,15,0)')
      ctx.fillStyle = grd
      ctx.fillRect(gx - 120, gy - 120, 240, 240)
    }

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
    ctx.fillStyle = 'rgba(255,255,255,0.48)'
    ctx.fillText(`지구로부터  ${result.star.dist_ly.toFixed(2)} 광년`, IW / 2, cardY + TOP + 72)

    // ── 구분선 ──
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'
    ctx.lineWidth   = 1
    ctx.beginPath(); ctx.moveTo(IW/2 - 260, cardY + TOP + 112); ctx.lineTo(IW/2 + 260, cardY + TOP + 112); ctx.stroke()

    // ── 카피 ──
    const copyLines: string[] = result.type === 'A'
      ? ['당신이 태어난 날 이 별을 출발한 빛이,', '오늘 지구에 도달했습니다']
      : result.type === 'B'
      ? [`이 별에서 당신이 태어난 날 출발한 빛은`, `불과 ${gapText(result.gapDays ?? 0)} 전에 지구를 지나쳤습니다`]
      : [`당신이 태어난 날 이 별을 출발한 빛은`, `${gapText(result.gapDays ?? 0)} 후 지구에 도착합니다`]

    ctx.font      = '300 40px Inter, Arial, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.62)'
    copyLines.forEach((line, i) => ctx.fillText(line, IW / 2, cardY + TOP + 178 + i * 56))

    // ── 브랜딩 ──
    ctx.font      = '400 34px Georgia, serif'
    ctx.fillStyle = 'rgba(255,255,255,0.20)'
    ctx.fillText('Unibirth', IW / 2, IH - BAND - 60)

    // ── 가장자리 띠 ──
    ctx.strokeStyle = ACCENT
    ctx.lineWidth   = BAND
    ctx.strokeRect(BAND / 2, BAND / 2, IW - BAND, IH - BAND)

    // ── 저장 (카톡/모바일: navigator.share, 그 외: 다운로드) ──
    out.toBlob(async blob => {
      if (!blob) return
      const fileName = `unibirth_${dateStr}.png`
      const file = new File([blob], fileName, { type: 'image/png' })
      // navigator.share (카카오톡 인앱브라우저, iOS Safari 등)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Unibirth' })
          return
        } catch {
          // 취소하거나 실패 → 다운로드 폴백
        }
      }
      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href     = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 'image/png')
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
            당신이 태어난 날 출발한 빛을<br />발견하지 못했습니다
          </h2>
          {nearestStar && (
            <p style={styles.bodyText}>
              가장 근접한 별은{' '}
              <strong style={{ color: 'var(--accent)' }}>{nearestDist}</strong> 거리에 있는{' '}
              <strong style={{ color: 'var(--accent)' }}>{nearestName}</strong>입니다.
            </p>
          )}
          <button onClick={onReset} style={styles.resetBtn}>← 돌아가기</button>
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
          color: rgba(255,255,255,0.38);
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
          border: 1px solid rgba(255,255,255,0.22);
          background: none;
          color: rgba(255,255,255,0.35);
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
          border-color: rgba(255,255,255,0.55);
          color: rgba(255,255,255,0.75);
        }
        .modal-body {
          font-size: 13px;
          color: rgba(255,255,255,0.60);
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
          color: rgba(255,255,255,0.35);
        }
        .modal-table-value {
          color: rgba(255,255,255,0.72);
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
          color: rgba(255,255,255,0.65);
          font-family: 'Inter', sans-serif;
          min-width: 72px;
        }
        .modal-row-value {
          font-size: 12px;
          color: rgba(255,255,255,0.42);
          font-family: 'Inter', sans-serif;
        }
        .modal-note {
          margin-top: 14px;
          font-size: 11px;
          color: rgba(255,255,255,0.28);
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
          background: none;
          border: none;
          padding: 0;
          color: rgba(255,255,255,0.30);
          font-size: 11px;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: color 0.15s;
          align-self: center;
          pointer-events: auto;
        }
        .more-btn:hover {
          color: rgba(255,255,255,0.65);
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
      }}>

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          title="이미지 저장"
          style={{
            position: 'absolute',
            top: '18px',
            right: '62px',
            background: 'none',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.40)',
            transition: 'border-color 0.15s, color 0.15s',
            pointerEvents: 'auto',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.40)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.80)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.14)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3v13M7 11l5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 20h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          </svg>
        </button>

        {/* 공유 버튼 */}
        <button
          onClick={handleShare}
          title="공유하기"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'none',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: copied ? 'rgba(160,220,160,0.85)' : 'rgba(255,255,255,0.40)',
            borderColor: copied ? 'rgba(160,220,160,0.40)' : 'rgba(255,255,255,0.14)',
            fontSize: '14px',
            transition: 'border-color 0.15s, color 0.15s',
            pointerEvents: 'auto',
          }}
          onMouseEnter={e => { if (!copied) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.40)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.80)'
          }}}
          onMouseLeave={e => { if (!copied) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.14)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)'
          }}}
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="2,7 6,11 12,3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              <polyline points="15,3 21,3 21,9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="3" x2="11" y2="13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
          )}
        </button>

        <h1 style={{ ...styles.starName, color: css }}>
          {starDisplayName(star)}
        </h1>

        <p style={styles.distLine}>
          지구로부터&nbsp;
          <span style={{ color: css, fontWeight: 600 }}>
            {(star?.dist_ly ?? 0).toFixed(2)} 광년
          </span>
        </p>

        <button className="more-btn" onClick={() => setExpanded(v => !v)}>
          {expanded ? '접기 ↑' : '더보기 ↓'}
        </button>

        <div className={`expand-section${expanded ? ' open' : ''}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px' }}>
            {type === 'A' ? (
              <p style={styles.bodyText}>
                당신이 태어난 날 이 별을 출발한 빛이, 오늘 지구에 도달했습니다.
              </p>
            ) : type === 'B' ? (
              <div style={styles.disclosureBox}>
                <p style={styles.disclosureText}>
                  이 별에서 당신이 태어난 날 출발한 빛은 불과{' '}
                  <strong style={{ color: 'var(--accent)' }}>{gapText(gapDays ?? 0)}</strong> 전에 지구를 지나쳤습니다.
                </p>
              </div>
            ) : type === 'C' ? (
              <div style={styles.disclosureBox}>
                <p style={styles.disclosureText}>
                  당신이 태어난 날 이 별을 출발한 빛은{' '}
                  <strong style={{ color: 'var(--accent)' }}>{gapText(gapDays ?? 0)}</strong> 후 지구에 도착합니다.
                </p>
              </div>
            ) : null}

            <div style={styles.metaRow}>
              {star?.mag != null && (
                <span className="result-chip">
                  <span className="chip-label">겉보기 등급</span>
                  <span className="chip-value" style={{ color: css }}>{star.mag.toFixed(1)}</span>
                  <button className="chip-info-btn" onClick={() => setModal('mag')}>i</button>
                </span>
              )}
              {star?.spect && (
                <span className="result-chip">
                  <span className="chip-label">분광형</span>
                  <span className="chip-value" style={{ color: css }}>{star.spect.slice(0, 4)}</span>
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
          </div>
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
    zIndex: 1,
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
  typeLabel: {
    fontSize: '10px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: 'var(--text-dim)',
  },
  starName: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: '30px',
    fontWeight: 400,
    lineHeight: 1.2,
  },
  distLine: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
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
  disclosureBox: {
    background: 'rgba(200,184,240,0.07)',
    border: '1px solid rgba(200,184,240,0.15)',
    borderRadius: '8px',
    padding: '12px 16px',
  },
  disclosureText: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.75,
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
