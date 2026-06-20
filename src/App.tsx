import { useState } from 'react'
import LandingScene from './components/LandingScene'
import TransitScene from './components/TransitScene'
import ResultScene from './components/ResultScene'
import { validateBirthdate, calcAgeFromString, findNearestStar } from './lib'
import type { MatchResult } from './lib'
import starsData from './data/stars.json'
import type { Star } from './lib'
import './index.css'

type Stage = 'landing' | 'transit' | 'result'

const stars = starsData as Star[]

export default function App() {
  const [stage,   setStage]   = useState<Stage>('landing')
  const [input,   setInput]   = useState('')
  const [result,  setResult]  = useState<MatchResult | null>(null)
  const [leaving, setLeaving] = useState(false)

  function handleSearch() {
    const validation = validateBirthdate(input)
    if (!validation.valid) return

    const age   = calcAgeFromString(input)
    const match = findNearestStar(age.years, stars)
    setResult(match)
    setLeaving(true)  // LandingScene이 이탈 애니메이션 시작
    // stage는 아직 'landing' — onLeavingDone에서 'transit'으로 전환
  }

  function handleLeavingDone() {
    setLeaving(false)
    // NO_STAR(gap >= 180일 또는 데이터 없음)는 transit 생략, 바로 결과
    if (result?.type === 'NO_STAR') {
      setStage('result')
    } else {
      setStage('transit')
    }
  }

  function handleTransitComplete() {
    setStage('result')
  }

  function handleReset() {
    setInput('')
    setResult(null)
    setLeaving(false)
    setStage('landing')
  }

  return (
    <div className="app">
      {stage === 'landing' && (
        <LandingScene
          input={input}
          onInputChange={setInput}
          onSearch={handleSearch}
          stars={stars}
          leaving={leaving}
          onLeavingDone={handleLeavingDone}
        />
      )}
      {/* TransitScene은 result 단계에서도 유지 — ResultScene이 위에 overlay */}
      {(stage === 'transit' || stage === 'result') && result && (
        <TransitScene
          result={result}
          stars={stars}
          onComplete={handleTransitComplete}
        />
      )}
      {stage === 'result' && result && (
        <ResultScene
          result={result}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
