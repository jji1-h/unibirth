import './footer.css'

const RIGHT_COLUMNS = [
  {
    heading: 'Unibirth',
    items: [
      { label: '탄생별 찾기',   href: '/find'      },
      { label: 'Unibirth 소개', href: '/'          },
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

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="ft-inner">

        {/* 좌측: 브랜드 */}
        <div className="ft-brand">
          <a href="/" className="ft-brand-logo">
            <img src="/favicon.svg" alt="Unibirth" />
            <span className="ft-brand-name">Unibirth</span>
          </a>
          <p className="ft-brand-tagline">생년월일로 찾는<br />나만의 탄생별</p>
          <p className="ft-brand-copy">© 2026 Unibirth</p>
        </div>

        {/* 우측: 3컬럼 */}
        <div className="ft-nav">
          {RIGHT_COLUMNS.map(({ heading, items }) => (
            <div key={heading}>
              <p className="ft-heading">{heading}</p>
              <ul className="ft-list">
                {items.map(({ label, href }) => (
                  <li key={href}>
                    <a href={href} className="ft-link">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </footer>
  )
}
