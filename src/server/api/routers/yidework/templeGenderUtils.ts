import type { Gender } from "~/prisma-client";

export type TempleGender = "QIAN" | "TONG" | "KUN" | "NV";

export const TEMPLE_GENDER_LABELS: Record<TempleGender, string> = {
  QIAN: "乾",
  TONG: "童",
  KUN: "坤",
  NV: "女",
};

export const TEMPLE_GENDER_ORDER: TempleGender[] = [
  "QIAN",
  "TONG",
  "KUN",
  "NV",
];

/**
 * Calculate temple gender based on biological gender and birth year
 *
 * Male (MALE):
 *   - >= 16 years old -> QIAN (乾)
 *   - < 16 years old -> TONG (童)
 *
 * Female (FEMALE):
 *   - >= 14 years old -> KUN (坤)
 *   - < 14 years old -> NV (女)
 *
 * @param gender - Biological gender (MALE or FEMALE)
 * @param birthYear - Birth year
 * @returns Temple gender category or null if inputs are missing
 */
export function calculateTempleGender(
  gender: Gender | null | undefined,
  birthYear: number | null | undefined,
): TempleGender | null {
  if (!gender || !birthYear) return null;

  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  if (gender === "MALE") {
    return age >= 16 ? "QIAN" : "TONG";
  }
  return age >= 14 ? "KUN" : "NV";
}
