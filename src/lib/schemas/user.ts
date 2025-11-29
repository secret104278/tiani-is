import { z } from "zod";

/**
 * User Profile Schema
 * Used in: src/pages/personal/account.tsx
 */
export const userProfileFormSchema = z.object({
  name: z.string().min(1, "請輸入姓名"),
  qiudaoDateSolar: z.string().optional(),
  qiudaoHour: z.string().optional(),
  qiudaoTemple: z.string().optional(),
  qiudaoTanzhu: z.string().optional(),
  affiliation: z.string().optional(),
  dianChuanShi: z.string().optional(),
  yinShi: z.string().optional(),
  baoShi: z.string().optional(),
});

export type UserProfileFormData = z.infer<typeof userProfileFormSchema>;

/**
 * User creation/update for admin
 * Used in: src/pages/admin/users.tsx
 */
export const adminUserFormSchema = z.object({
  name: z.string().min(1, "請輸入姓名"),
  email: z.string().email("請輸入有效的電子郵件").optional(),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
});

export type AdminUserFormData = z.infer<typeof adminUserFormSchema>;

/**
 * Qiudao information update schema
 * Separate schema for the qiudao info mutation
 */
export const qiudaoInfoSchema = z.object({
  qiudaoDateSolar: z.coerce.date().nullable().optional(),
  qiudaoDateLunar: z.string().nullable().optional(),
  qiudaoHour: z.string().nullable().optional(),
  qiudaoTemple: z.string().nullable().optional(),
  qiudaoTanzhu: z.string().nullable().optional(),
  affiliation: z.string().nullable().optional(),
  dianChuanShi: z.string().nullable().optional(),
  yinShi: z.string().nullable().optional(),
  baoShi: z.string().nullable().optional(),
});

export type QiudaoInfoData = z.infer<typeof qiudaoInfoSchema>;
