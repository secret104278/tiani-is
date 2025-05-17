import Decimal from "decimal.js";
import { z } from "zod";

export const zodDecimalPrice = (errorMessage = "無效的數字格式") =>
  z.preprocess(
    (val) => {
      if (typeof val === "string" || typeof val === "number") {
        try {
          return new Decimal(val);
        } catch (error) {
          return val; // Return original value if conversion fails, Zod will catch type mismatch
        }
      }
      return val; // Pass through if already a Decimal or other type
    },
    z
      .instanceof(Decimal, { message: errorMessage })
      .refine((d) => !d.isNaN(), { message: "數字不可為 NaN" })
      .refine((d) => d.isFinite(), { message: "數字必須是有限值" })
      .refine((d) => d.gte(0), { message: "價格必須大於等於 0" }),
  );

// Base schema for listing creation that's shared between frontend and backend
export const listingBaseSchema = z.object({
  title: z.string().min(1, "請輸入標題"),
  description: z.string().optional(),
  price: zodDecimalPrice(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  capacity: z.number().int().min(1).optional(),
});

// Frontend-specific schema that handles File objects and time type selection
export const listingFormSchema = listingBaseSchema
  .extend({
    timeType: z.enum(["limited", "unlimited"]),
    images: z.array(z.instanceof(File)).min(1, "請至少上傳一張圖片"),
  })
  .refine(
    (data) => {
      if (data.timeType === "limited") {
        return data.startTime && data.endTime && data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: "結束時間必須在開始時間之後",
      path: ["endTime"],
    },
  );

// Backend-specific schema that handles processed image data
export const listingApiSchema = listingBaseSchema
  .extend({
    images: z.array(
      z.object({
        data: z.instanceof(Uint8Array),
        type: z.string(),
        name: z.string(),
      }),
    ),
  })
  .refine(
    (data) =>
      data.endTime && data.startTime ? data.endTime > data.startTime : true,
    {
      message: "結束時間必須在開始時間之後",
      path: ["endTime"],
    },
  );
