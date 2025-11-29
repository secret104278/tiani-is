import { zodResolver } from "@hookform/resolvers/zod";
import type { inferRouterOutputs } from "@trpc/server";
import { isNil } from "lodash";
import { useForm } from "react-hook-form";
import { useClassMutations } from "~/hooks";
import {
  type ClassActivityFormData,
  classActivityFormSchema,
} from "~/lib/schemas";
import type { YideClassRouter } from "~/server/api/routers/yideclass";
import {
  CLASS_ACTIVITY_LOCATIONS,
  CLASS_ACTIVITY_TITLES,
  VOLUNTEER_ACTIVITY_TOPIC_OTHER,
  getCurrentDateTime,
  getDateTimeString,
  getDurationHour,
  getEndTime,
  locationIsOther,
  titleIsOther,
} from "~/utils/ui";
import ReactiveButton from "../utils/ReactiveButton";
import SelectWithCustomInput from "./SelectWithCustomInput";
import { ControlledDateTimeField, FormError, NumberField } from "./shared";

type ClassActivity = inferRouterOutputs<YideClassRouter>["getActivity"];

export default function ClassActivityForm({
  defaultActivity,
}: {
  defaultActivity?: ClassActivity;
}) {
  let formDefaultValues: Partial<ClassActivityFormData> = {
    title: CLASS_ACTIVITY_TITLES?.[0],
    startDateTime: new Date(getCurrentDateTime()),
    description: "",
  };
  if (defaultActivity) {
    const defaultTitleIsOther = titleIsOther(defaultActivity.title);
    const defaultLocationIsOther = locationIsOther(defaultActivity.location);

    formDefaultValues = {
      title: defaultTitleIsOther
        ? VOLUNTEER_ACTIVITY_TOPIC_OTHER
        : defaultActivity.title,
      titleOther: defaultTitleIsOther ? defaultActivity.title : "",

      location: defaultLocationIsOther
        ? VOLUNTEER_ACTIVITY_TOPIC_OTHER
        : defaultActivity.location,
      locationOther: defaultLocationIsOther ? defaultActivity.location : "",

      startDateTime: defaultActivity.startDateTime,
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
    control,
    formState: { errors },
  } = useForm<ClassActivityFormData>({
    resolver: zodResolver(classActivityFormSchema),
    defaultValues: formDefaultValues,
    mode: "onBlur", // Better UX - only validate after user leaves field
  });

  // Use the new mutation hook with automatic cache invalidation
  const { createActivity, updateActivity, isPending, error } =
    useClassMutations();

  const onSubmit = (data: ClassActivityFormData, isDraft = false) => {
    // Transform form data to API format
    const activityData = {
      title: titleIsOther(data.title) ? data.titleOther! : data.title,
      location: locationIsOther(data.location)
        ? data.locationOther!
        : data.location,
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
      });
    } else {
      // Create new activity
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
    <form className="form-control max-w-xs" onSubmit={handleFormSubmit()}>
      <div>
        <label className="label">
          <span className="label-text">班別</span>
        </label>
        <SelectWithCustomInput
          selectProps={register("title")}
          customInputProps={register("titleOther")}
          showCustomInput={watch("title") === VOLUNTEER_ACTIVITY_TOPIC_OTHER}
        >
          {CLASS_ACTIVITY_TITLES.map((option, i) => (
            <option key={i}>{option}</option>
          ))}
        </SelectWithCustomInput>
      </div>
      <div>
        <label className="label">
          <span className="label-text">開班地點</span>
        </label>
        <SelectWithCustomInput
          selectProps={register("location")}
          customInputProps={register("locationOther")}
          showCustomInput={watch("location") === VOLUNTEER_ACTIVITY_TOPIC_OTHER}
        >
          {CLASS_ACTIVITY_LOCATIONS.map((option, i) => (
            <option key={i}>{option}</option>
          ))}
        </SelectWithCustomInput>
      </div>
      <div className="divider" />
      <ControlledDateTimeField
        label="開班時間"
        required
        control={control}
        name="startDateTime"
      />
      <NumberField
        label="開班時數"
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
