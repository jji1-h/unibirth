import * as THREE from 'three'

/**
 * 원형 알파 텍스처 — PointsMaterial의 map으로 사용
 * 중앙 불투명, 가장자리 투명 → 별이 원형으로 보임
 */
export function makeCircleTex(size = 64): THREE.CanvasTexture {
  const c   = document.createElement('canvas')
  c.width   = c.height = size
  const ctx = c.getContext('2d')!
  const half = size / 2
  const g   = ctx.createRadialGradient(half, half, 0, half, half, half)
  g.addColorStop(0,    'rgba(255,255,255,1.0)')
  g.addColorStop(0.4,  'rgba(255,255,255,0.85)')
  g.addColorStop(0.75, 'rgba(255,255,255,0.2)')
  g.addColorStop(1,    'rgba(255,255,255,0.0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(c)
}

/**
 * 방사형 glow 텍스처 — SpriteMaterial의 map으로 사용
 * 별 glow·halo 등에 사용. 네모박스 대신 부드러운 원형 빛 번짐.
 */
export function makeGlowTex(size = 128): THREE.CanvasTexture {
  const c   = document.createElement('canvas')
  c.width   = c.height = size
  const ctx = c.getContext('2d')!
  const half = size / 2
  const g   = ctx.createRadialGradient(half, half, 0, half, half, half)
  g.addColorStop(0,    'rgba(255,255,255,1.0)')
  g.addColorStop(0.12, 'rgba(255,255,255,0.95)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.5)')
  g.addColorStop(0.65, 'rgba(255,255,255,0.12)')
  g.addColorStop(1,    'rgba(255,255,255,0.0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(c)
}

/**
 * 별 표면 텍스처 (Limb darkening)
 * 중앙: 백색 고온, 가장자리: 별 고유색보다 어두운 림 어두움 표현
 */
export function makeStarBodyTex(colorHex: number, size = 256): THREE.CanvasTexture {
  const c   = document.createElement('canvas')
  c.width   = c.height = size
  const ctx = c.getContext('2d')!
  const half = size / 2

  const col = new THREE.Color(colorHex)
  const ri  = Math.round(col.r * 255)
  const gi  = Math.round(col.g * 255)
  const bi  = Math.round(col.b * 255)

  // 중앙은 흰빛(초고온), 점점 별 고유색, 가장자리는 limb darkening (완전 불투명 유지)
  const g = ctx.createRadialGradient(half, half, 0, half, half, half)
  g.addColorStop(0,    `rgba(255,255,255,1.0)`)
  g.addColorStop(0.15, `rgba(255,${Math.min(255,gi+80)},${Math.min(255,bi+60)},1.0)`)
  g.addColorStop(0.45, `rgba(${ri},${gi},${bi},1.0)`)
  g.addColorStop(0.80, `rgba(${Math.max(0,ri-20)},${Math.max(0,gi-20)},${Math.max(0,bi-20)},1.0)`)
  g.addColorStop(1.0,  `rgba(${Math.max(0,ri-40)},${Math.max(0,gi-40)},${Math.max(0,bi-40)},1.0)`)

  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(c)
}
