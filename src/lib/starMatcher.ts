import type { Star, MatchResult, MatchResultType } from "./types";
import { DAYS_PER_YEAR } from "./age";

const GAP_THRESHOLD_LY  = 0.01;   // A/B 경계 (~3.65일)
const GAP_THRESHOLD_DAYS = 180;   // B/C 경계

export function findNearestStar(
  ageLy: number,
  stars: Star[]
): MatchResult {
  if (stars.length === 0) {
    return { type: "NO_STAR", star: null, ageLy, gapLy: 0, gapDays: 0 };
  }

  const idx = lowerBound(stars, ageLy);

  const candidates: Star[] = [];
  if (idx > 0)            candidates.push(stars[idx - 1]);
  if (idx < stars.length) candidates.push(stars[idx]);

  const best = candidates.reduce((a, b) => {
    const gapA = Math.abs(a.dist_ly - ageLy);
    const gapB = Math.abs(b.dist_ly - ageLy);
    if (gapA !== gapB) return gapA < gapB ? a : b;
    return (a.mag ?? 999) <= (b.mag ?? 999) ? a : b;
  });

  const gapLy   = Math.abs(best.dist_ly - ageLy);
  const gapDays = Math.round(gapLy * DAYS_PER_YEAR);
  const notYet  = best.dist_ly > ageLy;  // 빛이 아직 미도달

  let type: MatchResultType;
  if (gapDays > GAP_THRESHOLD_DAYS) {
    type = "NO_STAR";                      // gap > 180일 → 결과 없음 (최우선)
  } else if (notYet) {
    type = "C";                            // gap < 180일이지만 빛 미도달
  } else if (gapLy <= GAP_THRESHOLD_LY) {
    type = "A";                            // gap <= 0.01광년
  } else {
    type = "B";                            // 0.01광년 < gap < 180일, 빛 도달
  }

  return { type, star: best, ageLy, gapLy, gapDays };
}

function lowerBound(stars: Star[], target: number): number {
  let lo = 0, hi = stars.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (stars[mid].dist_ly < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export { GAP_THRESHOLD_LY, GAP_THRESHOLD_DAYS };
