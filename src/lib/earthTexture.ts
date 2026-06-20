/**
 * 캔버스로 프로시저럴 지구 텍스처를 생성합니다.
 * Three.js CanvasTexture로 변환해 사용하세요.
 */
export function createEarthCanvas(size = 1024): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width  = size
  canvas.height = size / 2
  const ctx = canvas.getContext('2d')!

  const w = canvas.width
  const h = canvas.height

  // 1. 바다 (딥 블루)
  const ocean = ctx.createLinearGradient(0, 0, 0, h)
  ocean.addColorStop(0,   '#0a1f4a')
  ocean.addColorStop(0.4, '#0e2e6a')
  ocean.addColorStop(0.6, '#0e2e6a')
  ocean.addColorStop(1,   '#0a1f4a')
  ctx.fillStyle = ocean
  ctx.fillRect(0, 0, w, h)

  // 2. 대륙 (노이즈 기반 패치)
  const landColors = ['#2d5a1b', '#3a6b22', '#4a7a2a', '#1e4a10', '#5a8a35']

  // 랜덤 시드 기반 대륙 모양 (고정 시드)
  const seed = 42
  const rng  = mulberry32(seed)

  for (let i = 0; i < 28; i++) {
    const cx   = rng() * w
    const cy   = rng() * h
    const rx   = 40 + rng() * 140
    const ry   = 30 + rng() * 90
    const rot  = rng() * Math.PI
    const lc   = landColors[Math.floor(rng() * landColors.length)]

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rot)
    ctx.beginPath()

    // 불규칙한 다각형으로 대륙 느낌
    const pts = 10 + Math.floor(rng() * 8)
    for (let p = 0; p < pts; p++) {
      const angle = (p / pts) * Math.PI * 2
      const r1    = rx * (0.6 + rng() * 0.6)
      const r2    = ry * (0.6 + rng() * 0.6)
      const x     = Math.cos(angle) * r1
      const y     = Math.sin(angle) * r2
      p === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = lc
    ctx.globalAlpha = 0.85 + rng() * 0.15
    ctx.fill()
    ctx.restore()
  }

  // 3. 사막/고지대 하이라이트
  ctx.globalAlpha = 0.3
  for (let i = 0; i < 8; i++) {
    const cx = rng() * w
    const cy = rng() * h
    const r  = 20 + rng() * 60
    const g  = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, '#c8a84b')
    g.addColorStop(1, 'transparent')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // 4. 극지방 (흰색)
  ctx.globalAlpha = 1
  // 북극
  const npGrad = ctx.createRadialGradient(w / 2, 0, 0, w / 2, 0, h * 0.22)
  npGrad.addColorStop(0, 'rgba(220,235,255,0.95)')
  npGrad.addColorStop(1, 'rgba(220,235,255,0)')
  ctx.fillStyle = npGrad
  ctx.fillRect(0, 0, w, h * 0.22)

  // 남극
  const spGrad = ctx.createRadialGradient(w / 2, h, 0, w / 2, h, h * 0.18)
  spGrad.addColorStop(0, 'rgba(235,245,255,0.9)')
  spGrad.addColorStop(1, 'rgba(235,245,255,0)')
  ctx.fillStyle = spGrad
  ctx.fillRect(0, h * 0.82, w, h * 0.18)

  // 5. 대기 산란 (가장자리 어둡게)
  const edgeGrad = ctx.createLinearGradient(0, 0, 0, h)
  edgeGrad.addColorStop(0,    'rgba(0,10,30,0.25)')
  edgeGrad.addColorStop(0.15, 'transparent')
  edgeGrad.addColorStop(0.85, 'transparent')
  edgeGrad.addColorStop(1,    'rgba(0,10,30,0.25)')
  ctx.fillStyle = edgeGrad
  ctx.fillRect(0, 0, w, h)

  return canvas
}

// 간단한 결정론적 RNG (Mulberry32)
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}
