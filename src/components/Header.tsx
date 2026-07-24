interface Props {
  fixed?: boolean
  opacity?: number
  pointerEvents?: 'auto' | 'none'
}

const NAV_ITEMS = [
  { label: '탄생별 찾기', href: '/?find' },
  { label: '소개',        href: '/'     },
  { label: '아티클',      href: '/articles/' },
]

export default function Header({ fixed = false, opacity = 1, pointerEvents = 'auto' }: Props) {
  const path = window.location.pathname

  return (
    <header style={{
      position:      fixed ? 'fixed' : 'absolute',
      top: 0, left: 0, right: 0,
      zIndex:        10,
      display:       'flex',
      alignItems:    'center',
      justifyContent:'space-between',
      padding:       '0 24px',
      height:        '52px',
      opacity,
      pointerEvents,
      transition:    'opacity 0.35s ease',
      background:    fixed ? 'rgba(7,9,15,0.82)' : 'transparent',
      backdropFilter:fixed ? 'blur(14px)'        : 'none',
      borderBottom:  fixed ? '1px solid rgba(255,255,255,0.06)' : 'none',
      boxSizing:     'border-box',
    }}>
      {/* 로고 */}
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
        <img src="/favicon.svg" alt="Unibirth" style={{ width: '20px', height: '20px', display: 'block' }} />
        <span style={{
          fontSize:      'clamp(13px, 2vw, 14px)',
          fontWeight:    600,
          color:         'rgba(255,255,255,0.85)',
          letterSpacing: '0.01em',
          fontFamily:    "'Inter', sans-serif",
        }}>Unibirth</span>
      </a>

      {/* 네비게이션 */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {NAV_ITEMS.map(({ label, href }) => {
          const isActive = path === href
          return (
            <a
              key={href}
              href={href}
              style={{
                padding:       'clamp(4px,1vw,5px) clamp(8px,2vw,12px)',
                fontSize:      'clamp(11px, 1.8vw, 13px)',
                fontFamily:    "'Inter', sans-serif",
                fontWeight:    500,
                color:         isActive ? 'rgba(196,181,253,0.92)' : 'rgba(255,255,255,0.55)',
                textDecoration:'none',
                borderRadius:  '6px',
                letterSpacing: '0.01em',
                transition:    'color 0.15s, background 0.15s',
                whiteSpace:    'nowrap',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.88)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color      = isActive ? 'rgba(196,181,253,0.92)' : 'rgba(255,255,255,0.55)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {label}
            </a>
          )
        })}
      </nav>
    </header>
  )
}
