export default function Footer() {
  const linkStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.42)',
    textDecoration: 'none',
    transition: 'color 0.15s',
  }
  return (
    <footer style={{
      width: '100%',
      padding: '20px 24px',
      paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      fontSize: '11px',
      color: 'rgba(255,255,255,0.22)',
      letterSpacing: '0.04em',
      userSelect: 'none',
      fontFamily: "'Inter', sans-serif",
    }}>
      <span>© 2026 Unibirth</span>
      <span style={{ opacity: 0.35 }}>·</span>
      <a
        href="/about.html"
        style={linkStyle}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.42)')}
      >
        서비스 소개
      </a>
      <span style={{ opacity: 0.35 }}>·</span>
      <a
        href="/privacy.html"
        style={linkStyle}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.42)')}
      >
        개인정보처리방침
      </a>
      <span style={{ opacity: 0.35 }}>·</span>
      <a
        href="/contact.html"
        style={linkStyle}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.42)')}
      >
        문의하기
      </a>
    </footer>
  )
}
