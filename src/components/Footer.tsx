const RIGHT_COLUMNS = [
  {
    heading: 'Unibirth',
    items: [
      { label: '탄생별 찾기',   href: '/find'      },
      { label: 'Unibirth 소개', href: '/about'     },
      { label: '아티클',        href: '/articles/' },
    ],
  },
  {
    heading: '읽을거리',
    items: [
      { label: 'Unibirth 사용팁', href: '/articles/?category=tips'    },
      { label: '우주 과학',       href: '/articles/?category=science' },
      { label: '별별 이야기',     href: '/articles/?category=story'   },
    ],
  },
  {
    heading: '서비스',
    items: [
      { label: '서비스 이용약관',  href: '/terms'   },
      { label: '개인정보처리방침', href: '/privacy' },
      { label: '문의하기',         href: '/contact' },
    ],
  },
]

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      style={{
        fontSize:       '13px',
        color:          'rgba(255,255,255,0.45)',
        textDecoration: 'none',
        lineHeight:     1.5,
        transition:     'color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.82)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
    >
      {children}
    </a>
  )
}

function ColHeading({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize:      '10px',
      fontWeight:    700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase' as const,
      color:         'rgba(255,255,255,0.30)',
      marginBottom:  '14px',
    }}>
      {children}
    </p>
  )
}

export default function Footer() {
  return (
    <footer style={{
      width:      '100%',
      background: 'rgba(255,255,255,0.018)',
      borderTop:  '1px solid rgba(255,255,255,0.07)',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* ── 메인 영역 ─────────────────────────────────── */}
      <div style={{
        maxWidth: '1200px',
        margin:   '0 auto',
        padding:  '56px 24px',
        paddingBottom: 'calc(48px + env(safe-area-inset-bottom, 0px))',
        display:  'flex',
        gap:      '48px',
        flexWrap: 'wrap',
      }}>

        {/* 좌측: 브랜드 */}
        <div style={{ flex: '0 0 200px', minWidth: '160px' }}>
          <a href="/" style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '8px',
            textDecoration: 'none',
            marginBottom:   '14px',
          }}>
            <img src="/favicon.svg" alt="Unibirth" style={{ width: '20px', height: '20px' }} />
            <span style={{
              fontSize:      '14px',
              fontWeight:    600,
              color:         'rgba(255,255,255,0.85)',
              letterSpacing: '0.01em',
            }}>Unibirth</span>
          </a>
          <p style={{
            fontSize:   '13px',
            color:      'rgba(255,255,255,0.35)',
            lineHeight: 1.7,
          }}>
            생년월일로 찾는<br />나만의 탄생별
          </p>
          <p style={{
            marginTop:     '14px',
            fontSize:      '11px',
            color:         'rgba(255,255,255,0.18)',
            letterSpacing: '0.03em',
          }}>
            © 2026 Unibirth
          </p>
        </div>

        {/* 우측: 3컬럼 */}
        <div style={{
          marginLeft:          'auto',
          display:             'grid',
          gridTemplateColumns: 'repeat(3, 140px)',
          gap:                 '32px',
        }}>
          {RIGHT_COLUMNS.map(({ heading, items }) => (
            <div key={heading}>
              <ColHeading>{heading}</ColHeading>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map(({ label, href }) => (
                  <li key={href}><FooterLink href={href}>{label}</FooterLink></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
