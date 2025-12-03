import { z } from "zod";

const PHONE_REGEX = /^09\d{8}$/;
const PHONE_ERROR_MESSAGE = "電話號碼必須以 09 開頭，共 10 位數字";

/**
 * Taiwan phone number validation
 * Must start with 09 and be exactly 10 digits
 */
export const phoneNumberSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      return PHONE_REGEX.test(val);
    },
    {
      message: PHONE_ERROR_MESSAGE,
    },
  );

/**
 * Birth year validation for temple gender calculation
 * Must be between 1900 and current year, in 19xx or 20xx format
 */
export const birthYearSchema = z
  .number()
  .int()
  .min(1900, "年份必須在 1900 以後")
  .max(new Date().getFullYear(), "年份不能是未來年份")
  .refine(
    (val) => {
      const yearStr = val.toString();
      return yearStr.startsWith("19") || yearStr.startsWith("20");
    },
    {
      message: "年份必須是 19xx 或 20xx 格式",
    },
  );

export function validatePhoneNumber(phone: string | undefined): boolean {
  if (!phone) return true;
  return PHONE_REGEX.test(phone);
}
