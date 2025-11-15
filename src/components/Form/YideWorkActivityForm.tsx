import type { inferRouterOutputs } from "@trpc/server";
import { zodResolver } from "@hookform/resolvers/zod";
import { isNil } from "lodash";
import { useForm } from "react-hook-form";
import type { YideWorkRouter } from "~/server/api/routers/yidework";
import { api } from "~/utils/api";
import {
  yideWorkActivityFormSchema,
  type YideWorkActivityFormData,
} from "~/lib/schemas";
import { useYideWorkMutations } from "~/hooks";
import {
  VOLUNTEER_ACTIVITY_TOPIC_OTHER,
  YIDE_WORK_ACTIVITY_TITLES,
  getCurrentDateTime,
  getDateTimeString,
  getDurationHour,
  getEndTime,
  titleIsOther,
} from "~/utils/ui";
import { AlertWarning } from "../utils/Alert";
import ReactiveButton from "../utils/ReactiveButton";
import SelectWithCustomInput from "./SelectWithCustomInput";

const EMPTY_PRESET_ID = -1;

type YideWorkActivity = inferRouterOutputs<YideWorkRouter>["getActivity"];

export default function YideWorkActivityForm({
  defaultActivity,
}: {
  defaultActivity?: YideWorkActivity;
}) {
  let formDefaultValues: Partial<YideWorkActivityFormData> = {
    title: YIDE_WORK_ACTIVITY_TITLES?.[0],
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

      locationId: defaultActivity.locationId,
      presetId: defaultActivity.presetId ?? EMPTY_PRESET_ID,

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
  } = useForm<YideWorkActivityFormData>({
    resolver: zodResolver(yideWorkActivityFormSchema),
    defaultValues: formDefaultValues,
    mode: "onBlur", // Better UX - only validate after user leaves field
  });

  const {
    data: locations,
    isLoading: locationIsLoading,
    error: locationsError,
  } = api.yideworkActivity.getLocations.useQuery();
  const {
    data: presets,
    isLoading: presetsIsLoading,
    error: presetsError,
  } = api.yideworkActivity.getPresets.useQuery();

  // Use the new mutation hook with automatic cache invalidation
  const { createActivity, updateActivity, isPending, error } =
    useYideWorkMutations();

  const onSubmit = (data: YideWorkActivityFormData, isDraft = false) => {
    // Transform form data to API format
    const activityData = {
      title: titleIsOther(data.title) ? data.titleOther : data.title,
      locationId: data.locationId,
      presetId: data.presetId === EMPTY_PRESET_ID ? undefined : data.presetId,
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

  if (locationIsLoading) return <div className="loading" />;
  if (!isNil(locationsError))
    return <AlertWarning>{locationsError.message}</AlertWarning>;
  if (presetsIsLoading) return <div className="loading" />;
  if (!isNil(presetsError))
    return <AlertWarning>{presetsError.message}</AlertWarning>;

  return (
    <form
      className="form-control max-w-xs"
      onSubmit={handleFormSubmit()}
    >
      <div>
        <label className="label">
          <span className="label-text">道務項目</span>
        </label>
        <SelectWithCustomInput
          selectProps={register("title")}
          customInputProps={register("titleOther")}
          showCustomInput={watch("title") === VOLUNTEER_ACTIVITY_TOPIC_OTHER}
        >
          {YIDE_WORK_ACTIVITY_TITLES.map((option, i) => (
            <option key={i}>{option}</option>
          ))}
        </SelectWithCustomInput>
      </div>
      <div>
        <label className="label">
          <span className="label-text">預設活動</span>
        </label>
        <select
          className="select select-bordered"
          {...register("presetId", { valueAsNumber: true })}
        >
          <option value={EMPTY_PRESET_ID}> -- 請選擇 -- </option>
          {presets?.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.description}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">
          <span className="label-text">
            佛堂名稱
            <span className="text-error ml-1">*</span>
          </span>
        </label>
        <select
          className="select select-bordered"
          {...register("locationId", { valueAsNumber: true })}
        >
          {locations?.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
        {errors.locationId && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.locationId.message}
            </span>
          </label>
        )}
      </div>
      <div className="divider" />
      <div>
        <label className="label">
          <span className="label-text">
            時間
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
