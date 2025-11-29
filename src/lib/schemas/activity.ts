import { z } from "zod";

/**
 * Common validation rules for activities
 */
const activityValidation = {
  title: z.string().min(1, "請輸入主題"),
  description: z.string().optional(),
  duration: z
    .number()
    .min(0.5, "時長至少0.5小時")
    .max(24, "時長不得超過24小時"),
  startDateTime: z.coerce.date({
    required_error: "請選擇開始時間",
    invalid_type_error: "無效的日期格式",
  }),
} as const;

/**
 * Volunteer Activity Schema
 * Used in: src/components/Form/VolunteerActivityForm.tsx
 */
export const volunteerActivityFormSchema = z.object({
  title: activityValidation.title,
  titleOther: z.string().optional(),
  headcount: z
    .number({
      required_error: "請輸入人數",
      invalid_type_error: "人數必須是數字",
    })
    .int("人數必須是整數")
    .min(1, "人數至少為1"),
  location: z.string().min(1, "請輸入地點"),
  startDateTime: activityValidation.startDateTime,
  duration: activityValidation.duration,
  description: activityValidation.description,
});

export type VolunteerActivityFormData = z.infer<
  typeof volunteerActivityFormSchema
>;

/**
 * Class Activity Schema
 * Used in: src/components/Form/ClassActivityForm.tsx
 */
export const classActivityFormSchema = z.object({
  title: activityValidation.title,
  titleOther: z.string().optional(),
  location: z.string().min(1, "請輸入地點"),
  locationOther: z.string().optional(),
  startDateTime: activityValidation.startDateTime,
  duration: activityValidation.duration,
  description: activityValidation.description,
});

export type ClassActivityFormData = z.infer<typeof classActivityFormSchema>;

/**
 * Etogether Activity Subgroup Schema
 */
export const etogetherSubgroupSchema = z.object({
  id: z.number().nullable(),
  title: z.string().min(1, "請輸入小組名稱"),
  description: z.string().nullable().optional(),
  displayColorCode: z.string().nullable().optional(),
});

/**
 * Etogether Activity Schema
 * Used in: src/components/Form/EtogetherActivityForm.tsx
 * Supports dynamic subgroups using useFieldArray
 */
export const etogetherActivityFormSchema = z.object({
  title: activityValidation.title,
  location: z.string().min(1, "請輸入地點"),
  startDateTime: activityValidation.startDateTime,
  duration: activityValidation.duration,
  description: activityValidation.description,
  subgroups: z.array(etogetherSubgroupSchema).optional(),
});

export type EtogetherActivityFormData = z.infer<
  typeof etogetherActivityFormSchema
>;

/**
 * Yide Work Activity Schema
 * Used in: src/components/Form/YideWorkActivityForm.tsx
 */
export const yideWorkActivityFormSchema = z.object({
  title: activityValidation.title,
  titleOther: z.string().optional(),
  presetId: z.number().optional(),
  locationId: z
    .number({
      required_error: "請選擇地點",
      invalid_type_error: "地點必須是數字",
    })
    .int("地點ID必須是整數"),
  startDateTime: activityValidation.startDateTime,
  duration: activityValidation.duration,
  description: activityValidation.description,
});

export type YideWorkActivityFormData = z.infer<
  typeof yideWorkActivityFormSchema
>;

/**
 * Generic activity update schema (all fields optional)
 * Useful for PATCH operations
 */
export const activityUpdateSchema = z.object({
  title: z.string().min(1, "請輸入主題").optional(),
  location: z.string().min(1, "請輸入地點").optional(),
  startDateTime: z.coerce.date().optional(),
  duration: z
    .number()
    .min(0.5, "時長至少0.5小時")
    .max(24, "時長不得超過24小時")
    .optional(),
  description: z.string().optional(),
  isDraft: z.boolean().optional(),
});
