/**
 * fetch_spect_simbad.mjs  –  SIMBAD script 서비스로 분광형 수집
 *
 * 사용법:
 *   cd scripts
 *   node fetch_spect_simbad.mjs
 *
 * Node 18+ 내장 fetch 사용 (별도 설치 불필요)
 * 결과: scripts/spect_supplement.json
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const STARS_JSON  = path.join(__dirname, '..', 'src', 'data', 'stars.json')
const OUTPUT_FILE = path.join(__dirname, 'spect_supplement.json')
const SCRIPT_URL  = 'https://simbad.cds.unistra.fr/simbad/sim-script'
const BATCH_SIZE  = 50   // script 서비스는 TAP보다 부하가 크므로 작게
const DELAY_MS    = 1500

// 기존 결과 로드 (재시작 지원)
let supplement = {}
if (fs.existsSync(OUTPUT_FILE)) {
  supplement = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'))
  console.log(`기존 결과 로드: ${Object.keys(supplement).length}개`)
}

const stars = JSON.parse(fs.readFileSync(STARS_JSON, 'utf8'))
const targets = stars
  .filter(s => !s.spect && s.gl && !(s.gl in supplement))
  .map(s => s.gl)

console.log(`쿼리 대상: ${targets.length}개`)

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * SIMBAD script 서비스로 GL ID 목록의 분광형 조회
 * 반환: { 'Gl 406': 'dM6', ... }
 */
async function queryBatch(glList) {
  const script = [
    'output console=off script=off',
    'format object f1 "%IDLIST(1)|%SP(S)"',
    ...glList.map(gl => `query id ${gl}`),
  ].join('\n')

  const resp = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'script=' + encodeURIComponent(script),
    signal: AbortSignal.timeout(30000),
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const text = await resp.text()

  // 섹션 파싱: ::error:: 와 ::data:: 분리
  const sections = {}
  let cur = null
  for (const line of text.split('\n')) {
    const m = line.match(/^::(\w+):{2,}/)
    if (m) { cur = m[1]; sections[cur] = []; continue }
    if (cur) sections[cur].push(line)
  }

  // ::error:: 에서 미발견 식별자 수집 (정규화 후 비교)
  const normalize = s => s.trim().toLowerCase().replace(/\s+/g, ' ')
  const failedSet = new Set()
  for (const line of (sections.error ?? [])) {
    const m = line.match(/\[\d+\]\s+'([^']+)'/)
    if (m) failedSet.add(normalize(m[1]))
  }

  // 성공한 쿼리만 추림
  const successList = glList.filter(gl => !failedSet.has(normalize(gl)))

  // ::data:: 에서 결과 줄 추출
  const dataLines = (sections.data ?? []).filter(l => l.includes('|'))

  // 위치 매칭: successList[i] ↔ dataLines[i]
  const result = {}
  for (let i = 0; i < Math.min(successList.length, dataLines.length); i++) {
    const spType = dataLines[i].slice(dataLines[i].indexOf('|') + 1).trim()
    if (spType && spType !== '~') result[successList[i]] = spType
  }
  return result
}

async function main() {
  let found = 0, errors = 0
  const batches = []
  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    batches.push(targets.slice(i, i + BATCH_SIZE))
  }

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b]
    process.stdout.write(`배치 ${b+1}/${batches.length} (${batch.length}개)... `)
    try {
      const res = await queryBatch(batch)
      const n = Object.keys(res).length
      found += n
      Object.assign(supplement, res)
      console.log(`${n}개 발견 (누적 ${found}개)`)
    } catch (e) {
      errors++
      console.log(`오류: ${e.message}`)
    }
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(supplement, null, 2), 'utf8')
    if (b < batches.length - 1) await sleep(DELAY_MS)
  }

  console.log(`\n완료: ${found}개 분광형 수집, 오류 ${errors}개`)
  console.log(`저장: ${OUTPUT_FILE}`)

  // 결과 샘플 출력
  const entries = Object.entries(supplement).slice(0, 5)
  if (entries.length) {
    console.log('\n샘플:')
    entries.forEach(([k, v]) => console.log(`  ${k}: ${v}`))
  }

  console.log('\n다음 단계:')
  console.log('  python preprocess_hyg.py   (scripts/ 폴더에서)')
  console.log('  → src/data/stars.json 업데이트 후 git push')
}

main().catch(e => { console.error(e); process.exit(1) })
