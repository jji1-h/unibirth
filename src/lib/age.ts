import type { AgeResult, ValidationResult, ValidationError } from "./types";

const DAYS_PER_YEAR = 365.25;
const PROXIMA_LY = 4.2441;
const MAX_AGE_YEARS = 120;

export function validateBirthdate(
  input: string,
  today: Date = new Date()
): ValidationResult {
  const digits = input.replace(/\D/g, "");
  if (digits.length !== 8) return { valid: false, error: "INCOMPLETE" };

  const year  = parseInt(digits.slice(0, 4), 10);
  const month = parseInt(digits.slice(4, 6), 10);
  const day   = parseInt(digits.slice(6, 8), 10);

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth()    !== month - 1 ||
    date.getDate()     !== day
  ) {
    return { valid: false, error: "INVALID_DATE" };
  }

  if (date > today) return { valid: false, error: "FUTURE_DATE" };

  const ageYears = calcAge(date, today).years;
  if (ageYears > MAX_AGE_YEARS) return { valid: false, error: "OUT_OF_RANGE" };

  return { valid: true };
}

export function calcAge(
  birthdate: Date,
  today: Date = new Date()
): AgeResult {
  const msElapsed = today.getTime() - birthdate.getTime();
  const days  = msElapsed / (1000 * 60 * 60 * 24);
  const years = days / DAYS_PER_YEAR;
  return { years, days };
}

export function calcAgeFromString(
  input: string,
  today: Date = new Date()
): AgeResult {
  const digits = input.replace(/\D/g, "");
  const year  = parseInt(digits.slice(0, 4), 10);
  const month = parseInt(digits.slice(4, 6), 10);
  const day   = parseInt(digits.slice(6, 8), 10);
  return calcAge(new Date(year, month - 1, day), today);
}

export function isNoStarZone(ageLy: number): boolean {
  return ageLy < PROXIMA_LY;
}

export { DAYS_PER_YEAR, PROXIMA_LY, MAX_AGE_YEARS };
