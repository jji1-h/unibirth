export interface Star {
  id: number;
  proper: string | null;
  bf?: string | null;
  gl?: string | null;
  hip: number | null;
  dist_ly: number;
  mag: number | null;
  absmag: number | null;
  con: string | null;
  spect: string | null;
  ra: number | null;
  dec: number | null;
  lum: number | null;
  ci: number | null;
}

export interface AgeResult {
  years: number;
  days: number;
}

// A: gap <= 0.01광년 (당신의 별)
// B: 0.01광년 <= gap < 180일, 빛이 이미 도달
// C: 별 거리 > 나이 (빛이 아직 미도달)
// NO_STAR: gap >= 180일이거나 데이터 없음
export type MatchResultType = "A" | "B" | "C" | "NO_STAR";

export interface MatchResult {
  type: MatchResultType;
  star: Star | null;
  ageLy: number;
  gapLy: number;
  gapDays: number;
}

export type ValidationError =
  | "INCOMPLETE"
  | "INVALID_DATE"
  | "FUTURE_DATE"
  | "OUT_OF_RANGE";

export interface ValidationResult {
  valid: boolean;
  error?: ValidationError;
}
