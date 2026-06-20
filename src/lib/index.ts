export type { Star, AgeResult, MatchResult, MatchResultType, ValidationResult, ValidationError } from "./types";
export { validateBirthdate, calcAge, calcAgeFromString, isNoStarZone, DAYS_PER_YEAR, PROXIMA_LY, MAX_AGE_YEARS } from "./age";
export { findNearestStar, GAP_THRESHOLD_LY } from "./starMatcher";
export { buildStarField, toVec3, SCALE, SPECT_COLORS } from "./starField";
