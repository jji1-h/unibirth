# Changelog

## [0.1.4] - 2026-08-27

### fix: 토스 링크 공유 딥링크로 전환

- `ResultScene.tsx` — `Share.sendMessage`(외부 URL) → `getTossShareLink` + `share` API로 교체
- 공유 링크가 `https://unibirths.com` 대신 `intoss://unibirth?bdate=YYYYMMDD` 딥링크로 생성됨
- 토스 앱에서 공유 링크 클릭 시 미니앱 내에서 바로 열림 (외부 웹뷰 로드 오류 해결)
- OG 이미지 URL `https://unibirths.com/og.png` 포함 (1200×600)

---

## [0.1.3] - 2026-08-25

### fix: 헤더/푸터 CSS 통일 및 아티클 필터 쿼리 파라미터 유지

- `public/header.css`, `public/footer.css` — 헤더/푸터 CSS를 단일 파일로 분리
- `Header.tsx`, `Footer.tsx` — inline style 제거, className 기반으로 리팩토링
- 아티클 HTML 10개 모두 동일한 CSS 참조 (`<link href="/header.css">`, `<link href="/footer.css">`)
- `line-height` 상속 문제 수정 → 소개/전체아티클/개별아티클 헤더·푸터 디자인 통일
- 아티클 필터 쿼리 파라미터 유지 (`App.tsx` 리다이렉트에 `window.location.search` 추가)

---

## [0.1.2] - 2026-08-25

### fix: 토스 웹뷰 공유/이미지 저장 연동

- `ResultScene.tsx` — `@apps-in-toss/web-framework`의 `saveBase64Data`, `Share` API 연동
- 이미지 저장: 토스 웹뷰에서 `saveBase64Data` 사용 (기존 `<a download>` 방식은 웹뷰에서 동작 안 함)
- 이미지 SNS 공유: 토스 웹뷰에서 `saveBase64Data`로 갤러리 저장으로 대체
- 링크 SNS 공유: 토스 웹뷰에서 `Share.sendMessage` 사용
- SNS 공유 버튼 표시 조건: `navigator.share` 유무 → `isTossWebView() || navigator.share` 로 확장

---

## [0.1.1] - 2026-08-25

### fix: 공유 모달 2단계 플로우 + .ait 버전 업

- `ResultScene.tsx` — 공유 버튼 클릭 시 1단계(링크/이미지 선택) → 2단계(세부 옵션) 바텀시트 플로우로 변경
- `package.json` — 버전 0.0.0 → 0.1.1 (토스 콘솔 중복 버전 오류 해결)
- `.ait` — `npx ait build`로 재생성

---

## [0.1.0] - 2026-08-24

### fix: 로컬 /find 블랙스크린

- `vite.config.ts` — `/find` 경로 처리를 raw 서빙에서 URL 리라이트(`req.url = '/find.html'`)로 변경
- 기존 raw 서빙 방식이 Vite HTML 변환 파이프라인을 건너뛰어 `@vitejs/plugin-react can't detect preamble` 에러 발생
