import { useState, useEffect } from 'react'
import HomePage from './components/HomePage'
import LandingScene from './components/LandingScene'
import TransitScene from './components/TransitScene'
import ResultScene from './components/ResultScene'
import SharedScene from './components/SharedScene'
import { validateBirthdate, calcAgeFromString, findNearestStar } from './lib'
import type { MatchResult } from './lib'
import starsData from './data/stars.json'
import type { Star } from './lib'
import './index.css'

type Stage = 'landing' | 'transit' | 'result' | 'shared'

const stars = starsData as Star[]

export default function App() {
  const [stage,        setStage]        = useState<Stage>('landing')
  const [input,        setInput]        = useState('')
  const [result,       setResult]       = useState<MatchResult | null>(null)
  const [leaving,      setLeaving]      = useState(false)
  const [sharedBdate,  setSharedBdate]  = useState('')

  // 공유 링크 처리: ?bdate=YYYYMMDD
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const bdate  = params.get('bdate')
    if (!bdate) return

    const digits = bdate.replace(/\D/g, '')
    if (digits.length !== 8) return

    const formatted = `${digits.slice(0,4)}-${digits.slice(4,6)}-${digits.slice(6,8)}`
    const validation = validateBirthdate(formatted)
    if (!validation.valid) return

    const age   = calcAgeFromString(formatted)
    const match = findNearestStar(age.years, stars)
    setResult(match)
    setSharedBdate(formatted)
    setStage('shared')
  }, [])

  function handleSearch() {
    const validation = validateBirthdate(input)
    if (!validation.valid) return

    const age   = calcAgeFromString(input)
    const match = findNearestStar(age.years, stars)
    setResult(match)
    setLeaving(true)
  }

  function handleLeavingDone() {
    setLeaving(false)
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

  function handleTryService() {
    window.history.replaceState({}, '', window.location.pathname)
    setResult(null)
    setInput('')
    setStage('landing')
  }

  const pathname = window.location.pathname
  const hasBdate = !!new URLSearchParams(window.location.search).get('bdate')

  // / 경로이고 공유 링크가 아닌 경우 → 소개(홈) 페이지
  if (pathname === '/' && !hasBdate) {
    return <HomePage />
  }

  return (
    <div className="app">
      {/* 공유 링크로 접속한 경우 */}
      {stage === 'shared' && result && (
        <SharedScene result={result} birthdate={sharedBdate} onTryService={handleTryService} />
      )}

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
          birthdate={input}
        />
      )}
    </div>
  )
}
