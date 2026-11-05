// 앱인토스 출시 체크리스트: 지도처럼 꼭 필요한 경우가 아니면 확대·축소를 막는다.
// 같은 HTML을 쓰는 일반 웹에서는 저시력 사용자를 위해 확대를 유지한다.
if ('ReactNativeWebView' in window) {
  document
    .querySelector('meta[name="viewport"]')
    ?.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
    )
}
