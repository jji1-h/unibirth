# Changelog

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
