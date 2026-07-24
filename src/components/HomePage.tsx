import Header from './Header'
import Footer from './Footer'

const STEPS = [
  {
    num: '01',
    title: '생년월일 입력',
    desc: '생년월일 8자리를 입력합니다. 태어난 날로부터 오늘까지 몇 년이 흘렀는지 계산합니다.',
  },
  {
    num: '02',
    title: '광년 거리 계산',
    desc: '나이(년)는 곧 광년 거리입니다. 36세라면 지구에서 36광년 떨어진 별을 탐색합니다.',
  },
  {
    num: '03',
    title: '탄생별 탐색',
    desc: '25만 개 이상의 실제 별 데이터(HYG 카탈로그)에서 가장 가까운 별을 찾아 3D로 시각화합니다.',
  },
]

const FEATURES = [
  {
    num: '01',
    title: '실제 별 데이터',
    desc: 'HYG 카탈로그 기반 25만 개 이상의 실제 항성 데이터를 사용합니다. 상상 속의 별이 아닙니다.',
  },
  {
    num: '02',
    title: '3D 우주 시각화',
    desc: 'Three.js로 구현한 3D 우주 공간에서 탄생별의 실제 위치를 직접 확인할 수 있습니다.',
  },
  {
    num: '03',
    title: '나만의 탄생별',
    desc: '이름, 거리, 분광형, 별자리까지. 오직 당신의 생일에만 해당하는 고유한 별 정보를 제공합니다.',
  },
]

function StarDivider() {
  return (
    <div style={{
      textAlign: 'center',
      color: 'rgba(196,181,253,0.22)',
      fontSize: '15px',
      letterSpacing: '0.5em',
      margin: '0 auto',
      padding: '0 24px',
    }}>
      ✦ &nbsp; ✦ &nbsp; ✦
    </div>
  )
}

function CTAButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '8px',
        padding:        '13px 30px',
        background:     'rgba(196,181,253,0.12)',
        border:         '1px solid rgba(196,181,253,0.28)',
        borderRadius:   '100px',
        color:          'rgba(196,181,253,0.92)',
        fontSize:       '14px',
        fontWeight:     500,
        fontFamily:     "'Inter', sans-serif",
        textDecoration: 'none',
        letterSpacing:  '0.02em',
        transition:     'background 0.2s, border-color 0.2s, color 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background   = 'rgba(196,181,253,0.20)'
        e.currentTarget.style.borderColor  = 'rgba(196,181,253,0.50)'
        e.currentTarget.style.color        = 'rgba(196,181,253,1)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background   = 'rgba(196,181,253,0.12)'
        e.currentTarget.style.borderColor  = 'rgba(196,181,253,0.28)'
        e.currentTarget.style.color        = 'rgba(196,181,253,0.92)'
      }}
    >
      {children}
    </a>
  )
}

export default function HomePage() {
  return (
    <div style={{ background: '#07090f', minHeight: '100vh', color: 'rgba(255,255,255,0.82)', fontFamily: "'Inter', sans-serif" }}>
      <Header fixed />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={{
        minHeight:      '100vh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        textAlign:      'center',
        padding:        '52px 24px 80px',
      }}>
        <p style={{
          fontSize:      '11px',
          fontWeight:    600,
          color:         'rgba(196,181,253,0.60)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          marginBottom:  '28px',
        }}>
          탄생별 탐색 서비스
        </p>

        <h1 style={{
          fontFamily:    "'DM Serif Display', Georgia, 'Nanum Myeongjo', serif",
          fontSize:      'clamp(36px, 6.5vw, 76px)',
          fontWeight:    400,
          color:         '#ffffff',
          lineHeight:    1.18,
          letterSpacing: '-0.02em',
          marginBottom:  '24px',
          maxWidth:      '860px',
        }}>
          생일로 알아보는<br />나만의 탄생별
        </h1>

        <p style={{
          fontSize:     'clamp(15px, 2vw, 18px)',
          color:        'rgba(255,255,255,0.48)',
          lineHeight:   1.8,
          maxWidth:     '480px',
          marginBottom: '44px',
        }}>
          당신이 태어난 순간 빛을 보낸 별을 찾아드립니다
        </p>

        <CTAButton href="/find">탄생별 찾기 →</CTAButton>
      </section>

      {/* ── 서비스 소개 ──────────────────────────────────── */}
      <section style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 24px 100px' }}>
        <StarDivider />

        <h2 style={{
          fontFamily:    "'DM Serif Display', Georgia, serif",
          fontSize:      'clamp(26px, 4vw, 44px)',
          fontWeight:    400,
          color:         '#ffffff',
          letterSpacing: '-0.015em',
          lineHeight:    1.25,
          margin:        '56px 0 28px',
        }}>
          탄생별이란?
        </h2>

        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.9, marginBottom: '18px' }}>
          빛은 우주를 가로질러 이동합니다. 1년에 약 9조 5천억 킬로미터, 우리는 이 거리를 1광년이라 부릅니다.
        </p>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.9, marginBottom: '18px' }}>
          당신이 태어난 날, 우주 어딘가의 별에서 지구를 향해 출발한 빛이 있습니다.
          그 빛은 수십 광년을 여행해 오늘, 정확히 지구에 닿습니다.
        </p>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.9 }}>
          Unibirth는 바로 그 별을 찾아드립니다. 그것이 당신의 <strong style={{ color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>탄생별</strong>입니다.
        </p>
      </section>

      {/* ── 작동 원리 ────────────────────────────────────── */}
      <section style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 100px' }}>
        <StarDivider />

        <h2 style={{
          fontFamily:    "'DM Serif Display', Georgia, serif",
          fontSize:      'clamp(26px, 4vw, 44px)',
          fontWeight:    400,
          color:         '#ffffff',
          letterSpacing: '-0.015em',
          margin:        '56px 0 48px',
        }}>
          어떻게 찾아드리나요?
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
          {STEPS.map(({ num, title, desc }) => (
            <div key={num} style={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}>
              <span style={{
                fontFamily:    "'Inter', sans-serif",
                fontSize:      '11px',
                fontWeight:    700,
                color:         'rgba(196,181,253,0.40)',
                letterSpacing: '0.1em',
                paddingTop:    '3px',
                flexShrink:    0,
                width:         '24px',
              }}>
                {num}
              </span>
              <div>
                <h3 style={{
                  fontSize:     '15px',
                  fontWeight:   600,
                  color:        'rgba(255,255,255,0.88)',
                  marginBottom: '8px',
                  letterSpacing:'0.01em',
                }}>
                  {title}
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 특징 ─────────────────────────────────────────── */}
      <section style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 100px' }}>
        <StarDivider />

        <h2 style={{
          fontFamily:    "'DM Serif Display', Georgia, serif",
          fontSize:      'clamp(26px, 4vw, 44px)',
          fontWeight:    400,
          color:         '#ffffff',
          letterSpacing: '-0.015em',
          margin:        '56px 0 40px',
        }}>
          Unibirth의 특징
        </h2>

        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap:                 '16px',
        }}>
          {FEATURES.map(({ num, title, desc }) => (
            <div key={title} style={{
              padding:      '24px 22px',
              background:   'rgba(255,255,255,0.028)',
              border:       '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(196,181,253,0.40)', letterSpacing: '0.1em', marginBottom: '14px' }}>{num}</div>
              <h3 style={{
                fontSize:     '14px',
                fontWeight:   600,
                color:        'rgba(255,255,255,0.85)',
                marginBottom: '10px',
                letterSpacing:'0.01em',
              }}>
                {title}
              </h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.75 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section style={{
        textAlign: 'center',
        padding:   '0 24px 120px',
      }}>
        <StarDivider />

        <h2 style={{
          fontFamily:    "'DM Serif Display', Georgia, serif",
          fontSize:      'clamp(24px, 4vw, 38px)',
          fontWeight:    400,
          color:         '#ffffff',
          letterSpacing: '-0.01em',
          margin:        '56px 0 14px',
        }}>
          나의 탄생별을 찾아보세요
        </h2>
        <p style={{
          fontSize:     '15px',
          color:        'rgba(255,255,255,0.38)',
          marginBottom: '36px',
          lineHeight:   1.7,
        }}>
          생년월일 8자리로 찾는 나만의 우주 이야기
        </p>
        <CTAButton href="/find">탄생별 찾기 →</CTAButton>
      </section>

      <Footer />
    </div>
  )
}
