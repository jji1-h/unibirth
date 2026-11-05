// 토스 앱용 .ait 빌드. 웹 빌드(npm run build)에는 영향을 주지 않는다.
//   npm run build:toss            실제 광고 ID로 빌드 (출시용)
//   npm run build:toss -- --test  테스트 광고 ID로 빌드 (QR 테스트용)
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const TEST_AD_GROUP_ID = 'ait-ad-test-banner-id'
const isTest = process.argv.includes('--test')

const env = { ...process.env }
if (isTest) env.VITE_AD_GROUP_ID = TEST_AD_GROUP_ID
else delete env.VITE_AD_GROUP_ID

execSync('npm run build', { stdio: 'inherit', env })

// 토스 광고 정책상 SDK 외부 광고를 쓸 수 없으므로 번들의 HTML에서 AdSense를 뺀다
const ADSENSE = /[ \t]*(<!-- Google AdSense -->\s*)?<script[^>]*adsbygoogle\.js[^>]*><\/script>[ \t]*\r?\n?/g
let stripped = 0

function strip(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      strip(path)
    } else if (entry.name.endsWith('.html')) {
      const html = readFileSync(path, 'utf8')
      const next = html.replace(ADSENSE, '')
      if (next !== html) {
        writeFileSync(path, next)
        stripped++
      }
    }
  }
}
strip(DIST)

// 토스 번들의 개인정보처리방침은 AdSense 대신 토스 인앱 광고 기준으로 안내한다
const TOSS_PRIVACY_ADS = `<h2>4. 광고</h2>
    <p>
      서비스는 토스 앱의 앱인토스 환경을 통해 제공되며, 앱인토스 인앱 광고가 게재됩니다.
      광고는 토스 애즈(Toss Ads)와 Google AdMob 등 외부 광고 플랫폼을 통해 송출됩니다.
    </p>
    <p>
      광고 제공과 노출·성과 측정 과정에서 기기 정보, 광고 식별자, 광고 이용 기록 등이
      해당 광고 플랫폼에 의해 처리될 수 있습니다.
      자세한 내용은 토스와 Google의 개인정보 처리방침을 참고하세요.
      맞춤형 광고를 원하지 않는 경우 기기 설정에서 광고 추적이나 광고 식별자 사용을 제한할 수 있습니다.
    </p>`

const privacyPath = join(DIST, 'privacy.html')
const privacy = readFileSync(privacyPath, 'utf8')
const WEB_ADS = /<!-- web-ads:start[\s\S]*?<!-- web-ads:end -->/
const WEB_HOSTING = /[ \t]*<!-- web-hosting:start -->[\s\S]*?<!-- web-hosting:end -->\r?\n?/
if (!WEB_ADS.test(privacy) || !WEB_HOSTING.test(privacy)) {
  throw new Error('privacy.html에서 교체할 구간을 찾지 못했습니다')
}
const tossPrivacy = privacy.replace(WEB_ADS, TOSS_PRIVACY_ADS).replace(WEB_HOSTING, '')
writeFileSync(privacyPath, tossPrivacy)

// 출시용 빌드는 처리방침의 빈칸이 채워져 있어야 한다
const BLANK = /\[(시행일|문의 보유 기간|책임자 성명|연락 이메일)\]/
if (!isTest && BLANK.test(tossPrivacy)) {
  throw new Error(`개인정보처리방침에 빈칸이 남아 있습니다: ${tossPrivacy.match(BLANK)[0]}`)
}

function assertNotInDist(dir, needle) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      assertNotInDist(path, needle)
    } else if (/\.(html|js)$/.test(entry.name) && readFileSync(path, 'utf8').includes(needle)) {
      throw new Error(`${path}에 ${needle}이(가) 남아 있습니다`)
    }
  }
}
assertNotInDist(DIST, 'adsbygoogle.js')
assertNotInDist(DIST, 'AdSense')
if (isTest) assertNotInDist(DIST, 'ait.v2.live')

console.log(`AdSense 제거: HTML ${stripped}개 / 광고 ID: ${isTest ? '테스트' : '실제'}`)

execSync('npx ait build', { stdio: 'inherit', env })
