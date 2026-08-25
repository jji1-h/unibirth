import './header.css'

interface Props {
  fixed?: boolean
  opacity?: number
  pointerEvents?: 'auto' | 'none'
}

const NAV_ITEMS = [
  { label: '탄생별 찾기', href: '/find'      },
  { label: '소개',        href: '/'          },
  { label: '아티클',      href: '/articles/' },
]

export default function Header({ fixed = false, opacity = 1, pointerEvents = 'auto' }: Props) {
  const path = window.location.pathname

  const cls = ['site-header', fixed ? 'site-header--fixed' : ''].filter(Boolean).join(' ')

  return (
    <header className={cls} style={{ opacity, pointerEvents }}>
      <div className="hdr-inner">
        <a href="/" className="hdr-logo">
          <img src="/favicon.svg" alt="Unibirth" />
          <span className="hdr-logo-name">Unibirth</span>
        </a>
        <nav className="hdr-nav">
          {NAV_ITEMS.map(({ label, href }) => {
            const isActive = path === href
            return (
              <a
                key={href}
                href={href}
                className={['hdr-link', isActive ? 'hdr-link--active' : ''].filter(Boolean).join(' ')}
              >
                {label}
              </a>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
