import { z } from "zod";

// Custom error messages in Traditional Chinese
z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.expected === "number") return { message: "請輸入數字" };
      if (issue.expected === "date") return { message: "請輸入有效的日期" };
      if (issue.expected === "string") return { message: "請輸入文字" };
      break;
    case z.ZodIssueCode.invalid_date:
      return { message: "請輸入有效的日期" };
    case z.ZodIssueCode.too_small:
      return { message: "數值太小" };
    case z.ZodIssueCode.too_big:
      return { message: "數值太大" };
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === "email")
        return { message: "請輸入有效的電子郵件" };
      break;
  }
  return { message: ctx.defaultError };
});

export const listingSchema = z
  .object({
    title: z.string().min(1, "請輸入標題"),
    description: z.string().optional(),
    price: z.number().min(0, "價格必須大於零"),
    startTime: z.date(),
    endTime: z.date(),
    capacity: z.number().int().min(1).optional(),
    images: z.array(
      z.object({
        key: z.string(),
        thumbhash: z.string(),
        order: z.number(),
      }),
    ),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "結束時間必須在開始時間之後",
    path: ["endTime"],
  });
