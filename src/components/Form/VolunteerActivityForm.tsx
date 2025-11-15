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
import { AlertWarning } from "../utils/Alert";
import ReactiveButton from "../utils/ReactiveButton";
import SelectWithCustomInput, { NestedSelect } from "./SelectWithCustomInput";

export default function VolunteerActivityForm({
  defaultActivity,
}: {
  defaultActivity?: VolunteerActivity;
}) {
  let formDefaultValues: Partial<VolunteerActivityFormData> = {
    title: VOLUNTEER_ACTIVITY_TOPICS[0]?.options[0],
    startDateTime: getCurrentDateTime(),
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
      startDateTime: getDateTimeString(defaultActivity.startDateTime),
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
      title: titleIsOther(data.title) ? data.titleOther : data.title,
      headcount: data.headcount,
      location: data.location,
      startDateTime: data.startDateTime,
      endDateTime: getEndTime(data.startDateTime, data.duration),
      description: data.description,
      isDraft: isDraft,
    };

    if (defaultActivity) {
      // Update existing activity
      updateActivity({
        activityId: defaultActivity.id,
        ...activityData,
      });
    } else {
      // Create new activity
      createActivity(activityData);
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
      <div>
        <label className="label">
          <span className="label-text">
            人數
            <span className="text-error ml-1">*</span>
          </span>
        </label>
        <input
          type="number"
          inputMode="numeric"
          className="tiani-input"
          {...register("headcount", { valueAsNumber: true })}
        />
        {errors.headcount && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.headcount.message}
            </span>
          </label>
        )}
      </div>
      <div>
        <label className="label">
          <span className="label-text">
            地點
            <span className="text-error ml-1">*</span>
          </span>
        </label>
        <input
          type="text"
          className="tiani-input"
          {...register("location")}
        />
        {errors.location && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.location.message}
            </span>
          </label>
        )}
      </div>
      <div className="divider" />
      <div>
        <label className="label">
          <span className="label-text">
            開始時間
            <span className="text-error ml-1">*</span>
          </span>
        </label>
        <input
          type="datetime-local"
          className="tiani-input"
          {...register("startDateTime", { valueAsDate: true })}
        />
        {errors.startDateTime && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.startDateTime.message}
            </span>
          </label>
        )}
      </div>
      <div>
        <label className="label">
          <span className="label-text">
            預估時數
            <span className="text-error ml-1">*</span>
          </span>
        </label>
        <input
          type="number"
          inputMode="decimal"
          className="tiani-input"
          step="0.1"
          {...register("duration", { valueAsNumber: true })}
        />
        {errors.duration && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.duration.message}
            </span>
          </label>
        )}
      </div>
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
      {!isNil(error) && <AlertWarning>{error.message}</AlertWarning>}
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
