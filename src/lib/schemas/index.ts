/**
 * Central export for all Zod validation schemas
 *
 * This library provides type-safe validation schemas for all forms in the application.
 * Each schema is designed to work with React Hook Form and the zodResolver.
 *
 * Usage:
 * ```typescript
 * import { volunteerActivityFormSchema } from "~/lib/schemas";
 * import { zodResolver } from "@hookform/resolvers/zod";
 * import { useForm } from "react-hook-form";
 *
 * const form = useForm({
 *   resolver: zodResolver(volunteerActivityFormSchema),
 *   mode: "onBlur",
 * });
 * ```
 */

// Activity schemas
export {
  volunteerActivityFormSchema,
  classActivityFormSchema,
  etogetherActivityFormSchema,
  etogetherSubgroupSchema,
  yideWorkActivityFormSchema,
  activityUpdateSchema,
  type VolunteerActivityFormData,
  type ClassActivityFormData,
  type EtogetherActivityFormData,
  type YideWorkActivityFormData,
} from "./activity";

// User schemas
export {
  userProfileFormSchema,
  adminUserFormSchema,
  qiudaoInfoSchema,
  type UserProfileFormData,
  type AdminUserFormData,
  type QiudaoInfoData,
} from "./user";

// Check-in and registration schemas
export {
  manualCheckInFormSchema,
  manualEtogetherCheckInFormSchema,
  modifyCheckRecordFormSchema,
  etogetherRegistrationFormSchema,
  yideWorkRegistrationFormSchema,
  externalRegisterSchema,
  type ManualCheckInFormData,
  type ManualEtogetherCheckInFormData,
  type ModifyCheckRecordFormData,
  type EtogetherRegistrationFormData,
  type YideWorkRegistrationFormData,
} from "./checkin";

// TianiShop schemas (already exists)
export {
  listingFormSchema,
  listingApiSchema,
  listingBaseSchema,
  zodDecimalPrice,
} from "./tianishop";
