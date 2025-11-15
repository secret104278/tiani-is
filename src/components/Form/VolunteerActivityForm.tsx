import type { VolunteerActivity } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { isNil } from "lodash";
import { useForm } from "react-hook-form";
import {
  volunteerActivityFormSchema,
  type VolunteerActivityFormData,
} from "~/lib/schemas";
import { useVolunteerMutations } from "~/hooks";
import {
  VOLUNTEER_ACTIVITY_TOPICS,
  VOLUNTEER_ACTIVITY_TOPIC_OTHER,
  getCurrentDateTime,
  getDateTimeString,
  getDurationHour,
  getEndTime,
  titleIsOther,
} from "~/utils/ui";
import ReactiveButton from "../utils/ReactiveButton";
import SelectWithCustomInput, { NestedSelect } from "./SelectWithCustomInput";
import {
  FormField,
  DateTimeField,
  NumberField,
  FormError,
} from "./shared";

export default function VolunteerActivityForm({
  defaultActivity,
}: {
  defaultActivity?: VolunteerActivity;
}) {
  let formDefaultValues: Partial<VolunteerActivityFormData> = {
    title: VOLUNTEER_ACTIVITY_TOPICS[0]?.options[0],
    startDateTime: getCurrentDateTime() as any as Date,
    description: "",
  };
  if (defaultActivity) {
    const defaultTitleIsOther = titleIsOther(defaultActivity.title);
    formDefaultValues = {
      title: defaultTitleIsOther
        ? VOLUNTEER_ACTIVITY_TOPIC_OTHER
        : defaultActivity.title,
      titleOther: defaultTitleIsOther ? defaultActivity.title : "",
      headcount: defaultActivity.headcount,
      location: defaultActivity.location,
      startDateTime: getDateTimeString(defaultActivity.startDateTime) as any as Date,
      duration: getDurationHour(
        defaultActivity.startDateTime,
        defaultActivity.endDateTime,
      ),
      description: defaultActivity.description ?? "",
    };
  }

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<VolunteerActivityFormData>({
    resolver: zodResolver(volunteerActivityFormSchema),
    defaultValues: formDefaultValues,
    mode: "onBlur", // Better UX - only validate after user leaves field
  });

  // Use the new mutation hook with automatic cache invalidation
  const { createActivity, updateActivity, isPending, error } =
    useVolunteerMutations();

  const onSubmit = (data: VolunteerActivityFormData, isDraft = false) => {
    // Transform form data to API format
    const activityData = {
      title: titleIsOther(data.title) ? data.titleOther! : data.title,
      headcount: data.headcount,
      location: data.location,
      startDateTime: data.startDateTime,
      endDateTime: getEndTime(data.startDateTime, data.duration),
      description: data.description ?? null,
      isDraft: isDraft,
    };

    if (defaultActivity) {
      // Update existing activity
      updateActivity({
        activityId: defaultActivity.id,
        ...activityData,
      } as any);
    } else {
      // Create new activity
      createActivity(activityData as any);
    }
  };

  const handleFormSubmit = (isDraft = false) => {
    return handleSubmit((data) => onSubmit(data, isDraft));
  };

  const canSaveDraft =
    isNil(defaultActivity) || defaultActivity.status === "DRAFT";

  return (
    <form
      className="form-control max-w-xs"
      onSubmit={handleFormSubmit()}
    >
      <div hidden={!isNil(defaultActivity)}>
        <label className="label">
          <span className="label-text">主題</span>
        </label>
        <SelectWithCustomInput
          selectProps={register("title")}
          customInputProps={register("titleOther")}
          showCustomInput={watch("title") === VOLUNTEER_ACTIVITY_TOPIC_OTHER}
        >
          <NestedSelect topics={VOLUNTEER_ACTIVITY_TOPICS} />
        </SelectWithCustomInput>
      </div>
      <NumberField
        label="人數"
        required
        error={errors.headcount?.message}
        {...register("headcount", { valueAsNumber: true })}
      />
      <FormField label="地點" required error={errors.location?.message}>
        <input type="text" className="tiani-input" {...register("location")} />
      </FormField>
      <div className="divider" />
      <DateTimeField
        label="開始時間"
        required
        error={errors.startDateTime?.message}
        {...register("startDateTime", { valueAsDate: true })}
      />
      <NumberField
        label="預估時數"
        required
        inputMode="decimal"
        step={0.1}
        error={errors.duration?.message}
        {...register("duration", { valueAsNumber: true })}
      />
      <div className="divider" />
      <div>
        <label className="label">
          <span className="label-text">補充說明</span>
        </label>
        <textarea
          className="textarea textarea-bordered w-full"
          {...register("description")}
        />
      </div>
      <div className="divider" />
      <FormError error={error?.message} />
      <div className="flex flex-row justify-end space-x-4">
        {canSaveDraft && (
          <ReactiveButton
            type="button"
            className="btn"
            onClick={handleFormSubmit(true)}
            loading={isPending}
          >
            保存草稿
          </ReactiveButton>
        )}

        <ReactiveButton
          type="submit"
          className="btn btn-primary"
          loading={isPending}
        >
          送出
        </ReactiveButton>
      </div>
    </form>
  );
}
