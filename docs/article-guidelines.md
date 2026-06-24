# Unibirth 아티클 작성 가이드

> 모든 아티클은 이 문서의 규칙을 따릅니다. 일관성 유지가 목적입니다.

---

## 1. 파일 규칙

| 항목 | 규칙 |
|------|------|
| 위치 | `public/articles/파일명.html` |
| 파일명 | 영문 소문자, 하이픈 구분. 예: `what-is-light-year.html` |
| 이미지 | `public/articles/이미지명.jpg` (로컬 저장 필수, 핫링크 금지) |
| 히어로 없을 때 | 인라인 SVG 일러스트로 대체 |

---

## 2. 라벨(태그) 시스템

| 라벨명 | CSS 클래스 | 텍스트 색 | 용도 |
|--------|-----------|---------|------|
| 우주 과학 | `tag-science` | `#c4b5fd` (보라) | 개념·원리·탐험 |
| 별별 이야기 | `tag-story` | `#ffd580` (앰버) | 신화·역사·실화 에피소드 |
| Unibirth 사용팁 | `tag-tips` | `#b0c4ff` (파랑, 브랜드 컬러) | Unibirth 앱 직접 연관 |

**CSS variant 스니펫** (모든 아티클 공통 적용):
```css
.tag { font-size:11px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; padding:3px 10px; border-radius:100px; border:1px solid transparent; }
.tag-science { color:#c4b5fd; background:rgba(196,181,253,0.10); border-color:rgba(196,181,253,0.18); }
.tag-story   { color:#ffd580; background:rgba(255,213,128,0.10); border-color:rgba(255,213,128,0.18); }
.tag-tips    { color:#b0c4ff; background:rgba(176,196,255,0.10); border-color:rgba(176,196,255,0.18); }
```

---

## 3. 디자인 토큰

| 토큰 | 값 |
|------|----|
| 배경색 | `#07090f` |
| 브랜드 컬러 | `#b0c4ff` |
| 본문 텍스트 | `rgba(255,255,255,0.72)` |
| 강조 텍스트 | `rgba(255,255,255,0.92)` |
| 흐린 텍스트 | `rgba(255,255,255,0.35)` |
| 본문 폰트 | Inter 300/400/500/600 (Google Fonts) |
| 제목 폰트 | Georgia, serif |
| 본문 font-size | 16px |
| 본문 line-height | 1.85 |

---

## 4. HTML `<head>` 필수 항목

```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="index, follow" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

<title>[제목] — Unibirth</title>
<meta name="description" content="[150자 이내 설명]" />
<link rel="canonical" href="https://unibirth.pages.dev/articles/[파일명]" />

<!-- OG -->
<meta property="og:type"        content="article" />
<meta property="og:url"         content="https://unibirth.pages.dev/articles/[파일명]" />
<meta property="og:title"       content="[제목]" />
<meta property="og:description" content="[설명]" />
<meta property="og:image"       content="https://unibirth.pages.dev/og.png" />
<meta property="og:site_name"   content="Unibirth" />
<meta property="og:locale"      content="ko_KR" />
<meta property="article:published_time" content="[YYYY-MM-DD]T00:00:00Z" />

<!-- JSON-LD: Article + FAQPage (필수) -->
```

---

## 5. 페이지 구조

```
nav (sticky header)
  └ 로고(favicon + "Unibirth") + 햄버거 버튼
  └ 사이드바(backdrop + sidebar)

hero
  └ 이미지(300~340px 높이) 또는 SVG 일러스트

article.article-wrap (max-width: 720px)
  └ article-meta (태그 + 날짜)
  └ h1.article-title
  └ p.article-lead (리드 문장, 보더 강조)
  └ [본문 섹션들]
  └ .cta-section (탄생별 찾기 CTA)
  └ .faq (최소 3개)
  └ .related (관련 아티클 링크)

footer
```

---

## 6. 네비게이션 (공통 복사 사용)

```html
<div class="nav-backdrop" id="navBackdrop" onclick="closeMenu()"></div>
<div class="nav-sidebar" id="navSidebar">
  <a href="/articles/index.html">아티클</a>
  <a href="https://github.com/jji1-h" target="_blank" rel="noopener noreferrer">문의하기</a>
</div>
<nav class="nav">
  <a href="/" class="nav-logo">
    <img src="/favicon.svg" alt="Unibirth 로고" />
    <span class="nav-logo-text">Unibirth</span>
  </a>
  <button class="hamburger" onclick="toggleMenu()" aria-label="메뉴">
    <span></span><span></span><span></span>
  </button>
</nav>
<script>
  function toggleMenu() {
    document.getElementById('navSidebar').classList.toggle('open')
    document.getElementById('navBackdrop').classList.toggle('open')
  }
  function closeMenu() {
    document.getElementById('navSidebar').classList.remove('open')
    document.getElementById('navBackdrop').classList.remove('open')
  }
</script>
```

---

## 7. 강조색 규칙 — 태그색 = 아티클 강조색

**아티클 내 강조색(링크, 수치, 타임라인, CTA 버튼 등)은 해당 아티클의 태그색과 동일하게 사용한다.**

| 라벨 | 강조색 | rgba (배경·보더용) |
|------|--------|-------------------|
| 우주 과학 | `#c4b5fd` | `rgba(196,181,253,...)` |
| 별별 이야기 | `#ffd580` | `rgba(255,213,128,...)` |
| Unibirth 사용팁 | `#b0c4ff` | `rgba(176,196,255,...)` |

적용 대상:
- `a { color: [태그색] }` — 본문 링크
- `.article-lead` 보더 (`border-left`)
- 수치 강조, 타임라인 도트/레이블 색
- `.cta-section` 배경·보더
- `.cta-btn` 배경색

---

## 8. CTA 박스 (탄생별 찾기) — 디자인 고정

그라디언트 없음. 구조는 고정, **색상만 태그색에 맞춰 변경**:

```css
/* [TAG_R],[TAG_G],[TAG_B] 자리에 라벨별 RGB 값 입력 */
.cta-section {
  margin: 64px 0 0;
  background: rgba([TAG_R],[TAG_G],[TAG_B],0.04);
  border: 1px solid rgba([TAG_R],[TAG_G],[TAG_B],0.12);
  border-radius: 20px;
  padding: 40px 32px;
  text-align: center;
}
.cta-btn {
  display: inline-flex; align-items: center; gap: 8px;
  background: [태그색]; color: #07090f;
  font-size: 15px; font-weight: 600;
  padding: 14px 32px; border-radius: 100px;
  text-decoration: none;
  transition: opacity 0.2s, transform 0.2s;
}
.cta-btn:hover { opacity: 0.88; transform: translateY(-1px); text-decoration: none; }
```

```html
<div class="cta-section">
  <h2>[훅 문장]</h2>
  <p>[부연 설명]</p>
  <a href="/" class="cta-btn">탄생별 찾기 →</a>
</div>
```

---

## 8. 푸터 (공통 복사 사용)

```html
<footer class="page-footer">
  <span>© 2026 Unibirth</span>
  <span class="page-footer-sep">·</span>
  <a href="/privacy.html">개인정보처리방침</a>
  <span class="page-footer-sep">·</span>
  <a href="https://github.com/jji1-h" target="_blank" rel="noopener noreferrer">문의하기</a>
</footer>
```

```css
.page-footer {
  padding: 20px 24px; text-align: center;
  font-size: 11px; color: rgba(255,255,255,0.22);
  letter-spacing: 0.04em;
  display: flex; align-items: center; justify-content: center; gap: 16px;
}
.page-footer a { color: rgba(255,255,255,0.42); text-decoration: none; transition: color 0.15s; }
.page-footer a:hover { color: rgba(255,255,255,0.70); }
.page-footer-sep { opacity: 0.35; }
```

---

## 9. 아티클 목록 (`articles/index.html`) 업데이트 규칙

- **정렬: 최신순** (최근 발행일이 맨 위)
- 새 아티클 추가 시 카드를 맨 앞에 삽입
- 카드 썸네일: 이미지 있으면 `<img>` + SVG fallback, 없으면 인라인 SVG
- 카드 태그 클래스: `card-tag [tag-science|tag-story|tag-tips]`

---

## 10. sitemap.xml 업데이트

새 아티클마다 아래 블록 추가:

```xml
<url>
  <loc>https://unibirth.pages.dev/articles/[파일명]</loc>
  <lastmod>[YYYY-MM-DD]</lastmod>
  <changefreq>yearly</changefreq>
  <priority>0.6</priority>
</url>
```

---

## 11. SEO 체크리스트

- [ ] `<title>` — 키워드 앞에, 60자 이내
- [ ] `<meta name="description">` — 150자 이내, 핵심 키워드 포함
- [ ] `<link rel="canonical">` — 정확한 URL
- [ ] OG 태그 — title, description, image, url 모두 작성
- [ ] JSON-LD `Article` — 필수
- [ ] JSON-LD `FAQPage` — 3~5개 질문 (검색 결과 FAQ 노출용)
- [ ] 이미지 `alt` 속성 — 내용 묘사
- [ ] 내부 링크 — 관련 아티클 `.related` 섹션에 추가
- [ ] sitemap.xml 업데이트
- [ ] `articles/index.html` 카드 추가 (최신순)
