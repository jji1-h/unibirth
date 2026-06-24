import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import type { MatchResult, Star } from '../lib'
import { buildStarField, toVec3, SCALE } from '../lib/starField'
import { createEarthCanvas } from '../lib/earthTexture'
import { makeCircleTex, makeGlowTex } from '../lib/textures'
import { STAR_VERT, STAR_FRAG, CHROMO_VERT, CHROMO_FRAG } from '../lib/starShaders'

interface Props {
  result:     MatchResult
  stars:      Star[]
  onComplete: () => void
}

function spectToColorHex(spect: string | null, ci?: number | null): number {
  if (!spect) {
    // spect 없으면 색지수(ci)로 fallback
    if (ci != null) {
      if (ci < -0.1) return 0x9bb0ff
      if (ci <  0.2) return 0xd8e8ff
      if (ci <  0.5) return 0xfff5e4
      if (ci <  0.8) return 0xffe87a
      if (ci <  1.4) return 0xffb347
      return 0xff6b35
    }
    return 0xfff4e8
  }
  if (/^D/i.test(spect)) {
    const m = spect.match(/(\d+\.?\d*)/)
    const t = m ? parseFloat(m[1]) : 6
    if (t <= 3) return 0x99c0ff
    if (t <= 6) return 0xd0e4ff
    return 0xf0e8dc
  }
  const m = spect.match(/[OBAFGKMobafgkm]/)
  const letter = m ? m[0].toUpperCase() : null
  const MAP: Record<string, number> = {
    O: 0x9bb0ff, B: 0xb0c4ff, A: 0xd8e8ff, F: 0xfff5e4,
    G: 0xffe87a, K: 0xffb347, M: 0xff6b35,
  }
  return MAP[letter ?? ''] ?? 0xfff4e8
}


export default function TransitScene({ result, stars, onComplete }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const captionRef = useRef<HTMLParagraphElement>(null)

  function switchCaption(text: string) {
    const el = captionRef.current
    if (!el) return
    gsap.to(el, {
      opacity: 0, duration: 0.35,
      onComplete: () => { el.textContent = text; gsap.to(el, { opacity: 1, duration: 0.5 }) },
    })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x07090f)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 3000)
    camera.position.set(0, 0, 600)

    const syncSize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
    }
    syncSize()
    window.addEventListener('resize', syncSize)

    // ── 조명 ──────────────────────────────────────────
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.8)
    sun.position.set(5, 3, 8)
    scene.add(sun)
    scene.add(new THREE.AmbientLight(0x334466, 0.8))

    // ── 지구 ──────────────────────────────────────────
    const tLoader = new THREE.TextureLoader()
    const BASE    = 'https://threejs.org/examples/textures/planets'

    const earthMat = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0x2255aa), specular: new THREE.Color(0x3399cc), shininess: 22,
    })
    const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 48), earthMat)
    scene.add(earthMesh)

    tLoader.load(`${BASE}/earth_atmos_2048.jpg`, (tex) => {
      const img = tex.image as HTMLImageElement
      const c   = document.createElement('canvas')
      c.width   = img.naturalWidth  || img.width  || 512
      c.height  = img.naturalHeight || img.height || 256
      const ctx = c.getContext('2d')!
      ctx.filter = 'saturate(230%) contrast(115%) brightness(1.06) hue-rotate(-8deg)'
      ctx.drawImage(img, 0, 0)
      earthMat.map = new THREE.CanvasTexture(c); earthMat.needsUpdate = true
    }, undefined, () => {
      earthMat.map = new THREE.CanvasTexture(createEarthCanvas(512)); earthMat.needsUpdate = true
    })
    tLoader.load(`${BASE}/earth_specular_2048.jpg`, (t) => { earthMat.specularMap = t; earthMat.needsUpdate = true })

    const cloudMat  = new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.32, depthWrite: false })
    const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(1.008, 48, 48), cloudMat)
    scene.add(cloudMesh)
    tLoader.load(`${BASE}/earth_clouds_1024.png`, (t) => { cloudMat.map = t; cloudMat.needsUpdate = true })
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0x60c8ff, transparent: true, opacity: 0.07, side: THREE.FrontSide })
    ))

    // ── 목적지 별 파라미터 ────────────────────────────
    const destStar   = result.type !== 'NO_STAR' ? result.star : null
    const colorHex   = spectToColorHex(destStar?.spect ?? null, destStar?.ci)
    const absmag     = destStar?.absmag ?? 5
    const starRadius = Math.min(Math.max((20 - absmag) / 16, 0.22), 1.50)
    const starColor  = new THREE.Color(colorHex)

    const destWorldPos: THREE.Vector3 = (destStar?.ra != null && destStar?.dec != null)
      ? toVec3(destStar.ra, destStar.dec, destStar.dist_ly).multiplyScalar(SCALE)
      : new THREE.Vector3(0, 0, -200)

    const approachDir = destWorldPos.clone().normalize()
    const finalCamPos = destWorldPos.clone().sub(approachDir.multiplyScalar(starRadius + 4))

    // ── 별 필드 ───────────────────────────────────────
    const { positions, colors } = buildStarField(stars)
    const circleTex = makeCircleTex(64)
    const glowTex   = makeGlowTex(128)

    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    starGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      vertexColors: true, size: 0.7, sizeAttenuation: true,
      transparent: true, opacity: 0.9, map: circleTex, alphaTest: 0.01,
    })))

    // ══ 별 그래픽 레이어 ═══════════════════════════════

    // [1] 별 표면 — GPU 셰이더 (대류셀 + limb darkening)
    const starUniforms = {
      uTime:  { value: 0 },
      uColor: { value: starColor },
    }
    const starMat = new THREE.ShaderMaterial({
      uniforms:       starUniforms,
      vertexShader:   STAR_VERT,
      fragmentShader: STAR_FRAG,
    })
    const starMesh = new THREE.Mesh(new THREE.SphereGeometry(starRadius, 64, 64), starMat)
    starMesh.position.copy(destWorldPos)
    scene.add(starMesh)

    // [2] 채층(Chromosphere) — 가장자리 rim glow
    const chromoUniforms = {
      uColor:   { value: starColor.clone().lerp(new THREE.Color(0xffffff), 0.3) },
      uOpacity: { value: 0.9 },
    }
    const chromoMat = new THREE.ShaderMaterial({
      uniforms:       chromoUniforms,
      vertexShader:   CHROMO_VERT,
      fragmentShader: CHROMO_FRAG,
      transparent:    true,
      blending:       THREE.AdditiveBlending,
      side:           THREE.FrontSide,
      depthWrite:     false,
    })
    const chromoMesh = new THREE.Mesh(new THREE.SphereGeometry(starRadius * 1.04, 48, 48), chromoMat)
    chromoMesh.position.copy(destWorldPos)
    scene.add(chromoMesh)

    // [3] 내부 glow — 별 바로 주변 부드러운 빛
    const innerGlowMat = new THREE.SpriteMaterial({
      map: glowTex, color: colorHex, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    const innerGlow = new THREE.Sprite(innerGlowMat)
    innerGlow.position.copy(destWorldPos)
    innerGlow.scale.set(starRadius * 3.5, starRadius * 3.5, 1)
    scene.add(innerGlow)

    // [4] 코로나 레이어 1 (중간 glow)
    const coronaMat1 = new THREE.SpriteMaterial({
      map: glowTex, color: colorHex, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    const corona1 = new THREE.Sprite(coronaMat1)
    corona1.position.copy(destWorldPos)
    corona1.scale.set(starRadius * 8, starRadius * 8, 1)
    scene.add(corona1)

    // [5] 코로나 레이어 2 (바깥 glow, 더 크고 희미)
    const coronaMat2 = new THREE.SpriteMaterial({
      map: glowTex, color: colorHex, transparent: true, opacity: 0.15,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    const corona2 = new THREE.Sprite(coronaMat2)
    corona2.position.copy(destWorldPos)
    corona2.scale.set(starRadius * 18, starRadius * 18, 1)
    scene.add(corona2)

    // [7] 표면 파티클 (prominences) — 별 표면 근처 소량 입자
    const promCount = 200
    const promPos   = new Float32Array(promCount * 3)
    for (let i = 0; i < promCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = starRadius * (1.02 + Math.random() * 0.35)
      promPos[i*3]   = destWorldPos.x + r * Math.sin(phi) * Math.cos(theta)
      promPos[i*3+1] = destWorldPos.y + r * Math.sin(phi) * Math.sin(theta)
      promPos[i*3+2] = destWorldPos.z + r * Math.cos(phi)
    }
    const promGeo = new THREE.BufferGeometry()
    promGeo.setAttribute('position', new THREE.BufferAttribute(promPos, 3))
    const promPoints = new THREE.Points(promGeo, new THREE.PointsMaterial({
      color: colorHex, size: starRadius * 0.045,
      transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, map: circleTex, alphaTest: 0.01,
      depthWrite: false,
    }))
    scene.add(promPoints)

    // ── lookAt 타겟 ───────────────────────────────────
    const lookAtTarget = new THREE.Vector3(0, 0, 0)

    // ── 렌더 루프 ─────────────────────────────────────
    let animId: number
    let t = 0
    const animate = () => {
      animId = requestAnimationFrame(animate)
      t += 0.016

      // 별 표면 셰이더 시간 업데이트
      starUniforms.uTime.value = t

      // 별 자전
      starMesh.rotation.y   += 0.0015
      chromoMesh.rotation.y += 0.0015

      // 채층 opacity pulse
      chromoUniforms.uOpacity.value = 0.75 + Math.sin(t * 1.2) * 0.15

      // 코로나 레이어 pulse
      coronaMat1.opacity = 0.28 + Math.sin(t * 0.8 + 0.5) * 0.10
      coronaMat2.opacity = 0.10 + Math.sin(t * 0.5) * 0.05
      innerGlowMat.opacity = 0.60 + Math.sin(t * 1.5) * 0.12

      // lookAt 적용
      camera.lookAt(lookAtTarget)
      earthMesh.rotation.y += 0.0015
      cloudMesh.rotation.y += 0.0018
      renderer.render(scene, camera)
    }
    animate()

    // ── GSAP 타임라인 ─────────────────────────────────
    try {
      const tl = gsap.timeline({ onComplete: () => onComplete() })

      if (captionRef.current) {
        gsap.fromTo(captionRef.current, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.3 })
      }
      tl.call(() => switchCaption('당신의 별을 향해 가는 중...'), [], 1.2)
      tl.call(() => {
        const el = captionRef.current
        if (el) gsap.to(el, { opacity: 0, duration: 0.4 })
      }, [], 3.8)

      // Phase 1: lookAt 전환
      tl.to(lookAtTarget, {
        x: destWorldPos.x, y: destWorldPos.y, z: destWorldPos.z,
        duration: 1.5, ease: 'sine.inOut',
      }, 0)

      // Phase 2+3: 카메라 연속 접근
      tl.to(camera.position, {
        x: finalCamPos.x, y: finalCamPos.y, z: finalCamPos.z,
        duration: 4.5, ease: 'power2.inOut',
      }, 0.5)

      // 외부 halo 퇴장
      tl.to([coronaMat2], { opacity: 0, duration: 1.0, ease: 'power1.in' }, 3.8)

      // onComplete at t=5.0s
    } catch {
      setTimeout(() => onComplete(), 5000)
    }

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', syncSize)
      gsap.killTweensOf([camera.position, lookAtTarget])
      renderer.dispose()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, animation: 'transit-fadein 0.3s ease forwards' }}>
      <style>{`@keyframes transit-fadein { from { opacity:0 } to { opacity:1 } }`}</style>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
      <p ref={captionRef} style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, calc(-50% + 120px))',
        margin: 0,
        fontFamily: "'DM Serif Display', serif",
        fontSize: '18px', fontWeight: 400,
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: '0.06em',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        opacity: 0,
      }}>
        별의 방향을 찾는 중...
      </p>
    </div>
  )
}
