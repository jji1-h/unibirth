export default function Footer() {
  return (
    <footer style={{
      width: '100%',
      padding: '20px 24px',
      paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      fontSize: '11px',
      color: 'rgba(255,255,255,0.22)',
      letterSpacing: '0.05em',
      userSelect: 'none',
    }}>
      <span>© 2026 Unibirth</span>
      <span style={{ opacity: 0.4 }}>·</span>
      <a
        href="/privacy.html"
        style={{
          color: 'rgba(255,255,255,0.22)',
          textDecoration: 'none',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.22)')}
      >
        개인정보처리방침
      </a>
      <span style={{ opacity: 0.4 }}>·</span>
      <a
        href="https://github.com/jji1-h"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: 'rgba(255,255,255,0.22)',
          textDecoration: 'none',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.22)')}
      >
        GitHub
      </a>
    </footer>
  )
}
