/**
 * apply_supplement.mjs
 * 기존 stars.json에 spect_supplement.json을 적용해서 분광형 보완
 *
 * 사용법:
 *   cd scripts
 *   node apply_supplement.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname   = path.dirname(fileURLToPath(import.meta.url))
const STARS_FILE  = path.join(__dirname, '..', 'src', 'data', 'stars.json')
const SUPP_FILE   = path.join(__dirname, 'spect_supplement.json')

if (!fs.existsSync(SUPP_FILE)) {
  console.error('spect_supplement.json 없음. fetch_spect_simbad.mjs 먼저 실행하세요.')
  process.exit(1)
}

const stars = JSON.parse(fs.readFileSync(STARS_FILE, 'utf8'))
const supp  = JSON.parse(fs.readFileSync(SUPP_FILE,  'utf8'))

let applied = 0
for (const star of stars) {
  if (!star.spect && star.gl && supp[star.gl]) {
    star.spect = supp[star.gl]
    applied++
  }
}

fs.writeFileSync(STARS_FILE, JSON.stringify(stars, null, 0).replace(/},\{/g, '},\n{'), 'utf8')
// 실제로는 compact JSON으로 저장
fs.writeFileSync(STARS_FILE, JSON.stringify(stars).replace(/^\[/, '[\n').replace(/\]$/, '\n]'), 'utf8')
// 그냥 compact로
fs.writeFileSync(STARS_FILE, JSON.stringify(stars, null, 0), 'utf8')

const kb = (fs.statSync(STARS_FILE).size / 1024).toFixed(1)
console.log(`완료: ${applied}개 분광형 보완, stars.json ${kb} KB`)

// 통계
const withSpect  = stars.filter(s => s.spect).length
const withoutSpect = stars.filter(s => !s.spect).length
console.log(`분광형 있음: ${withSpect}개 / 없음: ${withoutSpect}개 (전체 ${stars.length}개)`)

// 샘플 확인
const samples = ['Gl 406', 'Gl 65A', 'GJ 1265']
for (const gl of samples) {
  const s = stars.find(x => x.gl === gl)
  if (s) console.log(`  ${gl}: spect=${s.spect}, ci=${s.ci}`)
}
