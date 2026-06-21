// SIMBAD 응답 형식 디버그
// 사용법: node debug_simbad.mjs

const SCRIPT_URL = 'https://simbad.cds.unistra.fr/simbad/sim-script'

async function scriptQuery(script) {
  const resp = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'script=' + encodeURIComponent(script),
    signal: AbortSignal.timeout(15000),
  })
  return await resp.text()
}

// 테스트 1: %IDLIST(1) 형식 (GL 이름 반환 확인)
console.log('=== 테스트1: %IDLIST(1)|%SP(S) ===')
const t1 = await scriptQuery(`output console=off script=off
format object f1 "%IDLIST(1)|%SP(S)"
query id Gl 406
query id Gl 65A
query id Gl 905`)
console.log(JSON.stringify(t1))

// 테스트 2: %IDLIST(GL) 형식
console.log('\n=== 테스트2: %IDLIST(GL)|%SP(S) ===')
const t2 = await scriptQuery(`output console=off script=off
format object f1 "%IDLIST(GL)|%SP(S)"
query id Gl 406
query id Gl 65A
query id Gl 905`)
console.log(JSON.stringify(t2))

// 테스트 3: 존재하지 않는 ID 포함했을 때 출력 형식
console.log('\n=== 테스트3: 미발견 ID 포함 ===')
const t3 = await scriptQuery(`output console=off script=off
format object f1 "%IDLIST(1)|%SP(S)"
query id Gl 406
query id NONEXISTENT_XYZ_999
query id Gl 905`)
console.log(JSON.stringify(t3))
