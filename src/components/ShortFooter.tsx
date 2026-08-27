export default function ShortFooter() {
  return (
    <footer style={{
      width:      '100%',
      borderTop:  '1px solid rgba(255,255,255,0.06)',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        maxWidth:      '1200px',
        margin:        '0 auto',
        padding:       '12px 24px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'space-between',
        flexWrap:      'wrap',
        gap:           '12px',
      }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.03em' }}>
          © 2026 Unibirth
        </span>
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            { label: '서비스 이용약관',  href: '/terms'   },
            { label: '개인정보처리방침', href: '/privacy' },
            { label: '문의하기',         href: '/contact' },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              style={{
                fontSize:       '11px',
                color:          'rgba(255,255,255,0.28)',
                textDecoration: 'none',
                letterSpacing:  '0.02em',
                transition:     'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.60)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
