import * as THREE from 'three'
import type { Star } from './types'

export const SCALE = 6  // 1 광년 → scene 단위

export const SPECT_COLORS: Record<string, number> = {
  O: 0x9bb0ff, B: 0xaabfff, A: 0xcad7ff,
  F: 0xf8f7ff, G: 0xfff4e8, K: 0xffd2a1, M: 0xffaa7a,
}

/** HYG ra/dec/dist → 3D 좌표 (단위: ly) */
export function toVec3(ra: number, dec: number, dist: number): THREE.Vector3 {
  const raRad  = ra  * Math.PI / 12
  const decRad = dec * Math.PI / 180
  return new THREE.Vector3(
    dist * Math.cos(decRad) * Math.cos(raRad),
    dist * Math.sin(decRad),
    dist * Math.cos(decRad) * Math.sin(raRad),
  )
}

/** 결정론적 PRNG — 시드 고정 시 항상 동일한 수열 */
function seededRand(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 0x100000000
  }
}

/**
 * 두 씬에서 공유하는 star field geometry 데이터 빌드.
 * HYG 실제 좌표 + 시드 고정 배경별(2000개) → 항상 동일한 positions/colors 반환.
 */
export function buildStarField(stars: Star[]): {
  positions: Float32Array
  colors:    Float32Array
} {
  const positions: number[] = []
  const colors:    number[] = []

  // HYG 실제 3D 좌표
  for (const s of stars) {
    if (s.dist_ly <= 0 || s.ra == null || s.dec == null) continue
    const v  = toVec3(s.ra, s.dec, s.dist_ly).multiplyScalar(SCALE)
    const c  = new THREE.Color(SPECT_COLORS[s.spect?.[0] ?? 'G'] ?? 0xffffff)
    const br = Math.max(0.35, 1 - s.dist_ly / 150)
    positions.push(v.x, v.y, v.z)
    colors.push(c.r * br, c.g * br, c.b * br)
  }

  // 원거리 배경 별 — 시드 고정(0xdeadbeef)으로 두 씬이 동일한 위치 생성
  const rand = seededRand(0xdeadbeef)
  for (let i = 0; i < 2000; i++) {
    const r     = 250 + rand() * 600
    const theta = rand() * Math.PI * 2
    const phi   = Math.acos(2 * rand() - 1)
    positions.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    )
    const br = 0.3 + rand() * 0.7
    colors.push(br, br, br * 0.95)
  }

  return {
    positions: new Float32Array(positions),
    colors:    new Float32Array(colors),
  }
}
