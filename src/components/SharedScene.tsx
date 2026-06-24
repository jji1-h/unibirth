import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { MatchResult, Star } from '../lib'
import Footer from './Footer'
import { STAR_VERT, STAR_FRAG, CHROMO_VERT, CHROMO_FRAG } from '../lib/starShaders'
import { makeGlowTex, makeCircleTex } from '../lib/textures'

interface Props {
  result: MatchResult
  birthdate: string   // 'YYYY-MM-DD'
  onTryService: () => void
}

// ── helpers ──────────────────────────────────────────────────
interface SpectVisual { colorCss: string }

function colorFromCI(ci: number): SpectVisual {
  if (ci < -0.1) return { colorCss: '#b0c4ff' }
  if (ci <  0.2) return { colorCss: '#d8e8ff' }
  if (ci <  0.5) return { colorCss: '#fff5e4' }
  if (ci <  0.8) return { colorCss: '#ffe87a' }
  if (ci <  1.4) return { colorCss: '#ffb347' }
  return               { colorCss: '#ff6b35' }
}

function colorFromAbsmag(absmag: number): SpectVisual {
  if (absmag <  2)   return { colorCss: '#b0c4ff' }
  if (absmag <  4)   return { colorCss: '#d8e8ff' }
  if (absmag <  5.5) return { colorCss: '#ffe87a' }
  if (absmag <  8)   return { colorCss: '#ffb347' }
  return                    { colorCss: '#ff6b35' }
}

function parseSpect(spect: string | null, ci?: number | null, absmag?: number | null): SpectVisual {
  const DEFAULT: SpectVisual = { colorCss: '#fff4e8' }
  if (spect) {
    const s = spect.trim()
    if (/^D/i.test(s)) {
      const m = s.match(/(\d+\.?\d*)/)
      const t = m ? parseFloat(m[1]) : 6
      if (t <= 3) return { colorCss: '#99c0ff' }
      if (t <= 6) return { colorCss: '#d0e4ff' }
      return             { colorCss: '#f0e8dc' }
    }
    const m = s.match(/[OBAFGKMobafgkm]/)
    const letter = m ? m[0].toUpperCase() : null
    const MAP: Record<string, SpectVisual> = {
      O: { colorCss: '#9bb0ff' }, B: { colorCss: '#b0c4ff' },
      A: { colorCss: '#d8e8ff' }, F: { colorCss: '#fff5e4' },
      G: { colorCss: '#ffe87a' }, K: { colorCss: '#ffb347' },
      M: { colorCss: '#ff6b35' },
    }
    return MAP[letter ?? ''] ?? DEFAULT
  }
  if (ci != null) return colorFromCI(ci)
  if (absmag != null) return colorFromAbsmag(absmag)
  return DEFAULT
}

const CON_KO: Record<string, string> = {
  And:'안드로메다',   Ant:'펌프',          Aps:'극락조',        Aqr:'물병',
  Aql:'독수리',       Ara:'제단',          Ari:'양',            Aur:'마차부',
  Boo:'목자',         Cae:'조각칼',        Cam:'기린',          Cnc:'게',
  CVn:'사냥개',       CMa:'큰개',          CMi:'작은개',        Cap:'염소',
  Car:'용골',         Cas:'카시오페이아',  Cen:'센타우루스',    Cep:'케페우스',
  Cet:'고래',         Cha:'카멜레온',      Cir:'컴퍼스',        Col:'비둘기',
  Com:'머리털',       CrA:'남쪽왕관',      CrB:'북쪽왕관',      Crv:'까마귀',
  Crt:'컵',           Cru:'남십자',        Cyg:'백조',          Del:'돌고래',
  Dor:'황새치',       Dra:'용',            Equ:'조랑말',        Eri:'에리다누스',
  For:'화로',         Gem:'쌍둥이',        Gru:'두루미',        Her:'헤르쿨레스',
  Hor:'시계',         Hya:'바다뱀',        Hyi:'물뱀',          Ind:'인디언',
  Lac:'도마뱀',       Leo:'사자',          LMi:'작은사자',      Lep:'토끼',
  Lib:'천칭',         Lup:'이리',          Lyn:'살쾡이',        Lyr:'거문고',
  Men:'테이블산',     Mic:'현미경',        Mon:'외뿔소',        Mus:'파리',
  Nor:'직각자',       Oct:'팔분의',        Oph:'뱀주인',        Ori:'오리온',
  Pav:'공작',         Peg:'페가수스',      Per:'페르세우스',    Phe:'불사조',
  Pic:'화가',         Psc:'물고기',        PsA:'남쪽물고기',    Pup:'고물',
  Pyx:'나침반',       Ret:'그물',          Sge:'화살',          Sgr:'궁수',
  Sco:'전갈',         Scl:'조각가',        Sct:'방패',          Ser:'뱀',
  Sex:'육분의',       Tau:'황소',          Tel:'망원경',        Tri:'삼각형',
  TrA:'남쪽삼각형',   Tuc:'큰부리새',      UMa:'큰곰',          UMi:'작은곰',
  Vel:'돛',           Vir:'처녀',          Vol:'날치',          Vul:'여우',
}

function starDisplayName(star: Star | null) {
  if (!star) return '미분류 천체'
  if (star.proper) return star.proper
  if (star.bf)     return star.bf.trim()
  if (star.hip)    return `HIP ${star.hip}`
  if (star.gl)     return star.gl.trim()
  if (star.con && CON_KO[star.con]) return `${CON_KO[star.con]}자리의 별`
  return '미분류 천체'
}

function formatDateKo(dateStr: string): string {
  const clean = dateStr.replace(/[.\-/]/g, '')
  if (clean.length !== 8) return dateStr
  const y = clean.slice(0, 4)
  const m = parseInt(clean.slice(4, 6))
  const d = parseInt(clean.slice(6, 8))
  return `${y}년 ${m}월 ${d}일`
}

function typeCopy(result: MatchResult, birthdate: string): [string, string] {
  const dateLabel = birthdate ? formatDateKo(birthdate) : ''
  const line1 = `${dateLabel ? dateLabel + ', ' : ''}이 별에서 출발한 빛은`
  if (result.type === 'NO_STAR') return [line1, '찾지 못했어요']
  if (result.type === 'A') return [line1, '바로 오늘 지구에 도달했습니다']
  const d   = Math.round(Math.abs(result.gapDays ?? 0))
  const gap = d <= 30 ? `${d}일` : d < 365 ? `${Math.round(d/30)}개월` : `${(d/365).toFixed(1)}년`
  if (result.type === 'B') return [line1, `불과 ${gap} 전에 지구를 지나쳤습니다`]
  return [line1, `${gap} 후 지구에 도착합니다`]
}

// ── Main component ─────────────────────────────────────────────
export default function SharedScene({ result, birthdate, onTryService }: Props) {
  const [hovered, setHovered] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const star         = result.star
  const { colorCss } = parseSpect(star?.spect ?? null, star?.ci, star?.absmag)
  const name         = starDisplayName(star)
  const [copyLine1, copyLine2] = typeCopy(result, birthdate)
  const distText     = star ? `지구로부터 ${star.dist_ly.toFixed(2)} 광년` : null

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const absmag      = star?.absmag ?? 5
    const starRadius  = Math.min(Math.max((20 - absmag) / 16, 0.22), 1.50)
    const visualScale = Math.min(Math.max(starRadius / 0.75, 0.5), 1.6)
    const camZ        = 12 / visualScale
    const fovRad      = (60 * Math.PI) / 180

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
    } catch {
      return
    }
    renderer.setClearColor(0x07090f)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 1000)
    camera.position.set(0, 0, camZ)

    const syncSize = () => {
      const W = window.innerWidth
      const H = window.innerHeight
      renderer.setSize(W, H)
      camera.aspect = W / H
      camera.updateProjectionMatrix()
      // 카메라가 아래를 향하도록 lookAt을 내려서 별이 화면 상단 35% 지점에 위치
      const halfH = camZ * Math.tan(fovRad / 2)
      camera.lookAt(0, -halfH * 0.30, 0)
    }
    syncSize()
    window.addEventListener('resize', syncSize)

    const colorHex  = parseInt(colorCss.replace('#', ''), 16)
    const starColor = new THREE.Color(colorHex)
    const R = 2

    // 별 관련 오브젝트는 origin에 위치 — 카메라 lookAt 조정으로 화면상 위치 제어

    // [1] 별 표면 셰이더
    const starUniforms = { uTime: { value: 0 }, uColor: { value: starColor } }
    const starMesh = new THREE.Mesh(
      new THREE.SphereGeometry(R, 64, 64),
      new THREE.ShaderMaterial({ uniforms: starUniforms, vertexShader: STAR_VERT, fragmentShader: STAR_FRAG })
    )
    scene.add(starMesh)

    // [2] 채층 rim glow
    const chromoUniforms = {
      uColor:   { value: starColor.clone().lerp(new THREE.Color(0xffffff), 0.3) },
      uOpacity: { value: 0.9 },
    }
    const chromoMesh = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.04, 48, 48),
      new THREE.ShaderMaterial({
        uniforms: chromoUniforms,
        vertexShader: CHROMO_VERT, fragmentShader: CHROMO_FRAG,
        transparent: true, blending: THREE.AdditiveBlending,
        side: THREE.FrontSide, depthWrite: false,
      })
    )
    scene.add(chromoMesh)

    // [3] 글로우 스프라이트
    const glowTex   = makeGlowTex(128)
    const circleTex = makeCircleTex(64)

    const innerGlowMat = new THREE.SpriteMaterial({
      map: glowTex, color: colorHex, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    const innerGlow = new THREE.Sprite(innerGlowMat)
    innerGlow.scale.set(R * 3.5, R * 3.5, 1)
    scene.add(innerGlow)

    const coronaMat1 = new THREE.SpriteMaterial({
      map: glowTex, color: colorHex, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    const corona1 = new THREE.Sprite(coronaMat1)
    corona1.scale.set(R * 8, R * 8, 1)
    scene.add(corona1)

    const coronaMat2 = new THREE.SpriteMaterial({
      map: glowTex, color: colorHex, transparent: true, opacity: 0.15,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    const corona2 = new THREE.Sprite(coronaMat2)
    corona2.scale.set(R * 18, R * 18, 1)
    scene.add(corona2)

    // [4] 표면 파티클
    const promCount = 200
    const promPos   = new Float32Array(promCount * 3)
    for (let i = 0; i < promCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = R * (1.02 + Math.random() * 0.35)
      promPos[i*3]   = r * Math.sin(phi) * Math.cos(theta)
      promPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      promPos[i*3+2] = r * Math.cos(phi)
    }
    const promGeo = new THREE.BufferGeometry()
    promGeo.setAttribute('position', new THREE.BufferAttribute(promPos, 3))
    scene.add(new THREE.Points(promGeo, new THREE.PointsMaterial({
      color: colorHex, size: R * 0.045,
      transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, map: circleTex, alphaTest: 0.01,
      depthWrite: false,
    })))

    // 렌더 루프
    let animId: number
    let t = 0
    const animate = () => {
      animId = requestAnimationFrame(animate)
      t += 0.016
      starUniforms.uTime.value      = t
      starMesh.rotation.y          += 0.003
      chromoMesh.rotation.y        += 0.003
      chromoUniforms.uOpacity.value = 0.75 + Math.sin(t * 1.2) * 0.15
      coronaMat1.opacity            = 0.28 + Math.sin(t * 0.8 + 0.5) * 0.10
      coronaMat2.opacity            = 0.10 + Math.sin(t * 0.5) * 0.05
      innerGlowMat.opacity          = 0.60 + Math.sin(t * 1.5) * 0.12
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', syncSize)
      renderer.dispose()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#07090f' }}>

      {/* 풀스크린 Three.js 캔버스 */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      {/* 텍스트 — 화면 하단 40% 영역에 고정, 별 그래픽과 겹치지 않음 */}
      <div style={{
        position: 'absolute',
        top: '58%',
        bottom: '60px',
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 32px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '360px', width: '100%' }}>

          {/* 별 이름 */}
          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(26px, 6.5vw, 40px)',
            fontWeight: 400,
            color: colorCss,
            margin: '0 0 6px',
            lineHeight: 1.15,
          }}>
            {name}
          </h1>

          {/* 거리 */}
          {distText && (
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.38)',
              margin: '0 0 16px',
              letterSpacing: '0.04em',
              fontWeight: 300,
            }}>
              {distText}
            </p>
          )}

          {/* 설명 카피 */}
          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.75,
            margin: '0 0 28px',
            fontWeight: 300,
          }}>
            {copyLine1}<br />{copyLine2}
          </p>

          {/* CTA 버튼 */}
          <button
            onClick={onTryService}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 28px',
              borderRadius: '100px',
              border: `1px solid ${hovered ? colorCss + 'cc' : colorCss + '66'}`,
              background: hovered ? colorCss + '18' : colorCss + '0a',
              color: hovered ? colorCss : colorCss + 'cc',
              fontSize: '14px',
              fontWeight: 500,
              letterSpacing: '0.02em',
              cursor: 'pointer',
              transition: 'border-color 0.2s, background 0.2s, color 0.2s',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            나의 별 탐색하기
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 푸터 */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'none' }}>
        <Footer />
      </div>
    </div>
  )
}
