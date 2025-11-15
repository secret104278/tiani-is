import { z } from "zod";

/**
 * Manual Check-In Schema (for external users)
 * Used in manual check-in dialog components
 */
export const manualCheckInFormSchema = z.object({
  username: z.string().min(1, "請輸入姓名"),
});

export type ManualCheckInFormData = z.infer<typeof manualCheckInFormSchema>;

/**
 * Manual Etogether Check-In Schema (for external users with subgroup)
 * Used in: src/components/DialogContent/CheckIn/ManualEtogetherCheckInDialogContent.tsx
 */
export const manualEtogetherCheckInFormSchema = z.object({
  username: z.string().min(1, "請輸入姓名"),
  subgroupId: z
    .number({
      required_error: "請選擇分組",
      invalid_type_error: "分組必須是數字",
    })
    .int("分組ID必須是整數"),
});

export type ManualEtogetherCheckInFormData = z.infer<
  typeof manualEtogetherCheckInFormSchema
>;

/**
 * Modify Check Record Schema
 * Used in: src/components/DialogContent/ModifyCheckRecordDialogContent.tsx
 * Allows editing check-in/check-out times with automatic work hours calculation
 */
export const modifyCheckRecordFormSchema = z
  .object({
    checkInAt: z.coerce.date({
      required_error: "請選擇簽到時間",
      invalid_type_error: "無效的日期格式",
    }),
    checkOutAt: z.coerce.date({
      required_error: "請選擇簽退時間",
      invalid_type_error: "無效的日期格式",
    }),
    workHours: z
      .number({
        required_error: "請輸入工作時數",
        invalid_type_error: "工作時數必須是數字",
      })
      .min(0, "工作時數不可為負數")
      .max(24, "工作時數不得超過24小時"),
  })
  .refine((data) => data.checkOutAt > data.checkInAt, {
    message: "簽退時間必須晚於簽到時間",
    path: ["checkOutAt"],
  });

export type ModifyCheckRecordFormData = z.infer<
  typeof modifyCheckRecordFormSchema
>;

/**
 * External Register for Activity Registration
 * Used in registration dialog forms with useFieldArray
 */
export const externalRegisterSchema = z.object({
  username: z.string().min(1, "請輸入姓名"),
  subgroupId: z
    .number({
      required_error: "請選擇分組",
      invalid_type_error: "分組必須是數字",
    })
    .int("分組ID必須是整數")
    .optional(),
});

/**
 * Etogether Activity Registration Schema
 * Used in: src/components/DialogContent/EtogetherActivityRegisterDialogContent.tsx
 */
export const etogetherRegistrationFormSchema = z.object({
  subgroupId: z
    .number({
      required_error: "請選擇分組",
      invalid_type_error: "分組必須是數字",
    })
    .int("分組ID必須是整數"),
  externalRegisters: z.array(externalRegisterSchema).optional(),
});

export type EtogetherRegistrationFormData = z.infer<
  typeof etogetherRegistrationFormSchema
>;

/**
 * Yide Work Activity Registration Schema
 * Used in: src/components/DialogContent/YideWorkActivityRegisterDialogContent.tsx
 */
export const yideWorkRegistrationFormSchema = z.object({
  externalRegisters: z.array(externalRegisterSchema).optional(),
});

export type YideWorkRegistrationFormData = z.infer<
  typeof yideWorkRegistrationFormSchema
>;
