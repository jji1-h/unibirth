import { useEffect, useRef, useState } from 'react'
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
  const [error,  setError]  = useState<ValidationError | null>(null)
  const [showUI, setShowUI] = useState(true)

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

    const atmoMat = new THREE.MeshPhongMaterial({ color: 0x4a9eff, transparent: true, opacity: 0.07, side: THREE.FrontSide })
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
  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw     = e.target.value.replace(/\D/g, '').slice(0, 8)
    let formatted = raw
    if (raw.length > 4) formatted = raw.slice(0, 4) + '.' + raw.slice(4)
    if (raw.length > 6) formatted = raw.slice(0, 4) + '.' + raw.slice(4, 6) + '.' + raw.slice(6)
    onInputChange(formatted)
    if (raw.length === 8) {
      const v = validateBirthdate(formatted)
      setError(v.valid ? null : (v.error ?? null))
    } else {
      setError(null)
    }
  }

  const digits  = input.replace(/\D/g, '')
  const isReady = digits.length === 8 && !error

  return (
    <div style={styles.wrap}>
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
          <div style={{ ...styles.fieldWrap, ...(digits.length > 0 ? styles.fieldFocused : {}) }}>
            <span style={styles.fieldLabel}>생년월일</span>
            <input
              type="text" inputMode="numeric" placeholder="YYYY . MM . DD"
              value={input} onChange={handleInput}
              onKeyDown={(e) => e.key === 'Enter' && isReady && onSearch()}
              style={styles.dateInput} maxLength={10}
            />
          </div>

          {error && <p style={styles.errorMsg}>{ERROR_MSG[error]}</p>}

          <button
            onClick={onSearch} disabled={!isReady}
            className={isReady ? 'cta-active' : ''}
            style={{ ...styles.cta, ...(isReady ? styles.ctaActive : styles.ctaDisabled) }}
          >
            탐색하기 →
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap:    { position: 'relative', width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  canvas:  { position: 'absolute', top: 0, left: 0 },
  content: { position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' },
  sub:     { fontSize: '24px', fontWeight: 700, color: '#ffffff', textAlign: 'center', lineHeight: 1.5, textShadow: '0 2px 16px rgba(0,0,0,0.85), 0 0 40px rgba(0,0,0,0.6)', letterSpacing: '-0.01em' },
  inputGroup:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' },
  fieldWrap:    { display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '10px', padding: '14px 20px', background: 'rgba(7,9,15,0.6)', backdropFilter: 'blur(8px)', transition: 'border-color 0.2s, box-shadow 0.2s', minWidth: '280px' },
  fieldFocused: { borderColor: 'rgba(200,184,240,0.6)', boxShadow: '0 0 0 3px rgba(200,184,240,0.12)' },
  fieldLabel:   { fontSize: '10px', fontWeight: 400, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#9896b0', whiteSpace: 'nowrap' as const },
  dateInput:    { background: 'transparent', border: 'none', outline: 'none', fontFamily: "'DM Serif Display', serif", fontSize: '20px', fontWeight: 400, color: '#ffffff', letterSpacing: '0.04em', width: '160px', caretColor: 'var(--accent)' },
  errorMsg:     { fontSize: '12px', fontWeight: 400, color: '#ff8080', letterSpacing: '0.03em', textShadow: '0 1px 8px rgba(0,0,0,0.8)' },
  cta:          { padding: '13px 32px', borderRadius: '8px', fontSize: '14px', fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.2s', background: 'transparent' },
  ctaActive:    { border: '1px solid rgba(200,184,240,0.55)', color: '#ffffff' },
  ctaDisabled:  { border: '1px solid rgba(255,255,255,0.1)', color: '#6e6c82', cursor: 'not-allowed' },
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
