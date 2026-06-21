import { useEffect, useRef, useState } from 'react'
import Footer from './Footer'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { validateBirthdate } from '../lib'
import type { ValidationError } from '../lib'
import type { Star } from '../lib'
import { buildStarField } from '../lib/starField'
import { createEarthCanvas } from '../lib/earthTexture'
import { makeCircleTex } from '../lib/textures'

interface Props {
  input:           string
  onInputChange:   (val: string) => void
  onSearch:        () => void
  stars:           Star[]          // TransitScene과 동일한 star field를 위해
  leaving?:        boolean
  onLeavingDone?:  () => void
}

const ERROR_MSG: Record<ValidationError, string> = {
  INCOMPLETE:   '',
  INVALID_DATE: '존재하지 않는 날짜입니다',
  FUTURE_DATE:  '아직 태어나지 않은 날짜입니다',
  OUT_OF_RANGE: '탐색 가능한 범위를 벗어났습니다 (최대 120세)',
}

export default function LandingScene({ input, onInputChange, onSearch, stars, leaving, onLeavingDone }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const cameraRef    = useRef<THREE.PerspectiveCamera | null>(null)
  const leavingRef   = useRef(false)
  const earthMatsRef = useRef<THREE.Material[]>([])
  const [error,        setError]        = useState<ValidationError | null>(null)
  const [showUI,       setShowUI]       = useState(true)
  const [focused,      setFocused]      = useState(false)

  // ── Three.js ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 3000)
    camera.position.z = 2.8
    cameraRef.current = camera

    const syncSize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      if (!leavingRef.current) {
        camera.position.z = camera.aspect < 1 ? 2.8 / camera.aspect : 2.8
      }
      camera.updateProjectionMatrix()
    }
    syncSize()

    // ── 지구 ───────────────────────────────────────────
    const loader = new THREE.TextureLoader()
    const BASE   = 'https://threejs.org/examples/textures/planets'

    function loadVivid(url: string, filter: string, cb: (t: THREE.CanvasTexture) => void) {
      loader.load(url, (tex) => {
        const img = tex.image as HTMLImageElement
        const c   = document.createElement('canvas')
        c.width   = img.naturalWidth  || img.width
        c.height  = img.naturalHeight || img.height
        const ctx = c.getContext('2d')!
        ctx.filter = filter
        ctx.drawImage(img, 0, 0)
        cb(new THREE.CanvasTexture(c))
      }, undefined, () => cb(new THREE.CanvasTexture(createEarthCanvas(512))))
    }

    const earthMat = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0x2255aa), specular: new THREE.Color(0x3399cc),
      shininess: 22, transparent: true, opacity: 1,
    })
    const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), earthMat)
    scene.add(earth)
    loadVivid(`${BASE}/earth_atmos_2048.jpg`,
      'saturate(230%) contrast(115%) brightness(1.06) hue-rotate(-8deg)',
      (t) => { earthMat.map = t; earthMat.needsUpdate = true })
    loader.load(`${BASE}/earth_specular_2048.jpg`, (t) => { earthMat.specularMap = t; earthMat.needsUpdate = true })

    const cloudMat = new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.32, depthWrite: false })
    const clouds   = new THREE.Mesh(new THREE.SphereGeometry(1.008, 64, 64), cloudMat)
    scene.add(clouds)
    loader.load(`${BASE}/earth_clouds_1024.png`, (t) => { cloudMat.map = t; cloudMat.needsUpdate = true })

    const atmoMat = new THREE.MeshPhongMaterial({ color: 0x60c8ff, transparent: true, opacity: 0.07, side: THREE.FrontSide })
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.05, 64, 64), atmoMat))

    earthMatsRef.current = [earthMat, cloudMat, atmoMat]

    const sun = new THREE.DirectionalLight(0xfff5e0, 1.8)
    sun.position.set(5, 2, 4)
    scene.add(sun)
    scene.add(new THREE.AmbientLight(0x0a1530, 0.7))

    // ── TransitScene과 동일한 star field ───────────────
    // buildStarField는 결정론적 → 두 씬에서 완전히 같은 별 위치
    const { positions, colors } = buildStarField(stars)
    const circleTex = makeCircleTex(64)
    const starGeo   = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    starGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      vertexColors: true, size: 0.7, sizeAttenuation: true,
      transparent: true, opacity: 0.9,
      map: circleTex, alphaTest: 0.01,
    })))

    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      earth.rotation.y  += 0.0002
      clouds.rotation.y += 0.0003
      renderer.render(scene, camera)
    }
    animate()

    window.addEventListener('resize', syncSize)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', syncSize)
      renderer.dispose()
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Leaving 애니메이션 ─────────────────────────────
  useEffect(() => {
    if (!leaving) return
    const camera = cameraRef.current
    if (!camera) return

    leavingRef.current = true
    setShowUI(false)

    const startZ = camera.position.z

    // 지구가 완전히 안 보일 때까지 줌아웃 (반경 1유닛, z≈600에서 서브픽셀)
    gsap.to(camera.position, {
      z: startZ + 600,
      duration: 1.5,
      ease: 'power2.in',
      onComplete: () => onLeavingDone?.(),
    })
  }, [leaving])  // eslint-disable-line react-hooks/exhaustive-deps


  // ── 입력 핸들러 ─────────────────────────────────────
  function updateFromRaw(raw: string) {
    let formatted = raw
    if (raw.length > 4) formatted = raw.slice(0,4) + '.' + raw.slice(4)
    if (raw.length > 6) formatted = raw.slice(0,4) + '.' + raw.slice(4,6) + '.' + raw.slice(6)
    onInputChange(formatted)
    if (raw.length === 8) {
      const v = validateBirthdate(formatted)
      setError(v.valid ? null : (v.error ?? null))
    } else {
      validatePartial(raw)
    }
  }

  function validatePartial(raw: string) {
    setError(null)
    if (raw.length < 4) return
    const year = parseInt(raw.slice(0,4), 10)
    const now   = new Date().getFullYear()
    if (year > now)        { setError('FUTURE_DATE');  return }
    if (year < now - 120)  { setError('OUT_OF_RANGE'); return }
    if (raw.length < 6)    return
    const month = parseInt(raw.slice(4,6), 10)
    if (month < 1 || month > 12) { setError('INVALID_DATE'); return }
  }

  // onChange: 모바일 fallback (자릿수 변화 시에만 반응)
  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const newRaw = e.target.value.replace(/\D/g,'').slice(0,8)
    if (newRaw !== digits) updateFromRaw(newRaw)
  }

  // onKeyDown: backspace로 마스크 고착 방지 + Enter
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter')     { if (isReady) onSearch(); return }
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits.length > 0) updateFromRaw(digits.slice(0,-1))
    }
  }

  // digits → "1999년 06월 21일" (0 패딩 없이 입력된 만큼만)
  function toDisplay(raw: string): string {
    if (raw.length === 0) return ''
    if (raw.length <= 4)  return raw
    if (raw.length <= 6)  return raw.slice(0,4) + '년 ' + raw.slice(4)
    const d = raw.slice(6)
    return raw.slice(0,4) + '년 ' + raw.slice(4,6) + '월 ' + (d.length === 2 ? d + '일' : d)
  }

  const digits       = input.replace(/\D/g, '')
  const isReady      = digits.length === 8 && !error
  const displayValue = toDisplay(digits)

  // 마스크 오버레이: 입력된 자리는 흰색, 미입력 자리는 뮤트 색
  function renderMask(): React.ReactNode {
    const W = '#ffffff'
    const M = 'var(--text-muted)'
    if (digits.length === 0) {
      const txt = focused ? '0000년 00월 00일' : '생년월일 8자리를 입력해주세요'
      return <span style={{ color: M }}>{txt}</span>
    }
    const s = (i: number) => {
      const c = digits[i]
      return <span key={i} style={{ color: c !== undefined ? W : M }}>{c ?? '0'}</span>
    }
    return <>
      {s(0)}{s(1)}{s(2)}{s(3)}
      <span style={{ color: digits.length >= 4 ? W : M }}>년 </span>
      {s(4)}{s(5)}
      <span style={{ color: digits.length >= 6 ? W : M }}>월 </span>
      {s(6)}{s(7)}
      <span style={{ color: digits.length >= 8 ? W : M }}>일</span>
    </>
  }

  return (
    <div style={styles.wrap} className="scene-wrap">
      <canvas ref={canvasRef} style={styles.canvas} />

      {/* 이탈 애니메이션 중 캡션 */}
      <p style={{
        ...styles.caption,
        opacity:    !showUI ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}>
        지구를 벗어나는 중...
      </p>

      <div style={{
        ...styles.content,
        opacity:       showUI ? 1 : 0,
        pointerEvents: showUI ? 'auto' : 'none',
        transition:    'opacity 0.35s ease',
      }}>
        <p style={styles.sub}>당신이 태어난 바로 그날<br />출발한 빛을 찾아보세요</p>

        <div style={styles.inputGroup}>
          <div style={{ ...styles.fieldWrap, ...(isReady ? styles.fieldFocused : focused ? styles.fieldActive : {}) }}>
            <div style={styles.inputWrapper}>
              <input
                type="text" inputMode="numeric"
                placeholder=""
                value={displayValue}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{ ...styles.dateInput, color: 'transparent' }}
                maxLength={14}
              />
              <div style={styles.maskOverlay} aria-hidden="true">
                {renderMask()}
              </div>
            </div>
            <button
              onClick={onSearch} disabled={!isReady}
              style={{ ...(isReady ? styles.ctaActive : styles.ctaDisabled) }}
              onMouseEnter={e => { if (isReady) (e.currentTarget as HTMLButtonElement).style.opacity = '0.7' }}
              onMouseLeave={e => { if (isReady) (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </div>

          {error && <p style={styles.errorMsg}>{ERROR_MSG[error]}</p>}
        </div>
      </div>

      {/* 푸터 */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        zIndex: 2,
        opacity:       showUI ? 1 : 0,
        pointerEvents: showUI ? 'auto' : 'none',
        transition:    'opacity 0.35s ease',
      }}>
        <Footer />
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap:    { position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  canvas:  { position: 'absolute', top: 0, left: 0 },
  content: { position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' },
  sub:     { fontSize: '24px', fontWeight: 700, color: '#ffffff', textAlign: 'center', lineHeight: 1.5, textShadow: '0 2px 16px rgba(0,0,0,0.85), 0 0 40px rgba(0,0,0,0.6)', letterSpacing: '-0.01em' },
  inputGroup:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  fieldWrap:    { display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '10px', padding: '10px 10px 10px 20px', background: 'rgba(7,9,15,0.6)', backdropFilter: 'blur(8px)', transition: 'border-color 0.2s, box-shadow 0.2s', minWidth: '300px' },
  fieldActive:  { borderColor: 'rgba(255,255,255,0.32)' },
  fieldFocused: { borderColor: 'rgba(43,125,233,0.6)', boxShadow: '0 0 0 3px rgba(43,125,233,0.12)' },
  inputWrapper: { position: 'relative', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' },
  maskOverlay:  { position: 'absolute', left: 0, pointerEvents: 'none', userSelect: 'none', fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 300, letterSpacing: '0.02em', whiteSpace: 'nowrap' as const },
  dateInput:    { background: 'transparent', border: 'none', outline: 'none', fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 300, letterSpacing: '0.02em', width: '100%', caretColor: 'var(--accent)' },
  errorMsg:     { fontSize: '12px', fontWeight: 400, color: '#ff8080', letterSpacing: '0.03em', textShadow: '0 1px 8px rgba(0,0,0,0.8)' },
  ctaActive:    { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '100px', border: 'none', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', flexShrink: 0, transition: 'opacity 0.2s' },
  ctaDisabled:  { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '100px', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.20)', cursor: 'not-allowed', flexShrink: 0 },
  caption: {
    position: 'absolute',
    top: '50%', left: '50%',
    transform: 'translate(-50%, calc(-50% + 120px))',
    margin: 0,
    fontFamily: "'DM Serif Display', serif",
    fontSize: '18px',
    fontWeight: 400,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: '0.06em',
    pointerEvents: 'none',
    zIndex: 2,
    whiteSpace: 'nowrap',
  },
}
