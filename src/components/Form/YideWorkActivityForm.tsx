import type { inferRouterOutputs } from "@trpc/server";
import { isNil } from "lodash";
import { useRouter } from "next/router";
import { FormProvider, useForm } from "react-hook-form";
import type { YideWorkRouter } from "~/server/api/routers/yidework";
import { api } from "~/utils/api";
import type { YideWorkAssignments } from "~/utils/types";
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
import YideWorkAssignmentsSection from "./YideWorkAssignmentsSection";

const EMPTY_PRESET_ID = -1;

type YideWorkActivity = inferRouterOutputs<YideWorkRouter>["getActivity"];

interface YideWorkActivityFormData {
  title: string;
  titleOther: string;
  presetId: number;
  locationId: number;
  startDateTime: Date | string;
  duration: number;
  description: string;
  assignments: YideWorkAssignments;
}

export default function YideWorkActivityForm({
  defaultActivity,
}: {
  defaultActivity?: YideWorkActivity;
}) {
  let formDefaultValues: Partial<YideWorkActivityFormData> = {
    title: YIDE_WORK_ACTIVITY_TITLES?.[0],
    startDateTime: getCurrentDateTime(),
    description: "",
    assignments: {},
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
      assignments: (defaultActivity.assignments as YideWorkAssignments) ?? {},
    };
  }

  const methods = useForm<YideWorkActivityFormData>({
    defaultValues: formDefaultValues,
    mode: "all",
  });
  const { register, handleSubmit, watch } = methods;

  const router = useRouter();
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
  const {
    mutate: createActivity,
    error: createActivityError,
    isPending: createActivityIsPending,
  } = api.yideworkActivity.createActivity.useMutation({
    onSuccess: (data) => router.push(`/yidework/activity/detail/${data.id}`),
  });
  const {
    mutate: updateActivity,
    error: updateActivityError,
    isPending: updateActivityIsPending,
  } = api.yideworkActivity.updateActivity.useMutation({
    onSuccess: (data) => router.push(`/yidework/activity/detail/${data.id}`),
  });

  const _handleSubmit = (isDraft = false) => {
    if (defaultActivity) {
      return handleSubmit((data) =>
        updateActivity({
          activityId: defaultActivity.id,
          title: titleIsOther(data.title) ? data.titleOther : data.title,
          locationId: data.locationId,
          presetId:
            data.presetId === EMPTY_PRESET_ID ? undefined : data.presetId,
          startDateTime: data.startDateTime as Date,
          endDateTime: getEndTime(data.startDateTime as Date, data.duration),
          description: data.description,
          assignments: data.assignments,
          isDraft: isDraft,
        }),
      );
    }

    return handleSubmit((data) =>
      createActivity({
        title: titleIsOther(data.title) ? data.titleOther : data.title,
        locationId: data.locationId,
        presetId: data.presetId === EMPTY_PRESET_ID ? undefined : data.presetId,
        startDateTime: data.startDateTime as Date,
        endDateTime: getEndTime(data.startDateTime as Date, data.duration),
        description: data.description,
        assignments: data.assignments,
        isDraft: isDraft,
      }),
    );
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
    <FormProvider {...methods}>
      <form className="form-control max-w-xs">
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
            <span className="label-text">佛堂名稱</span>
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
        </div>
        {watch("title").includes("辦道") && <YideWorkAssignmentsSection />}
        <div className="divider" />
        <div>
          <label className="label">
            <span className="label-text">時間</span>
          </label>
          <input
            type="datetime-local"
            className="tiani-input"
            required
            {...register("startDateTime", { valueAsDate: true })}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">預估時數</span>
          </label>
          <input
            type="number"
            inputMode="decimal"
            className="tiani-input"
            step="0.1"
            required
            {...register("duration", { valueAsNumber: true })}
          />
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
        {!isNil(createActivityError) && (
          <AlertWarning>{createActivityError.message}</AlertWarning>
        )}
        {!isNil(updateActivityError) && (
          <AlertWarning>{updateActivityError.message}</AlertWarning>
        )}
        <div className="flex flex-row justify-end space-x-4">
          {canSaveDraft && (
            <ReactiveButton
              className="btn"
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={_handleSubmit(true)}
              loading={createActivityIsPending || updateActivityIsPending}
            >
              保存草稿
            </ReactiveButton>
          )}

          <ReactiveButton
            className="btn btn-primary"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={_handleSubmit()}
            loading={createActivityIsPending || updateActivityIsPending}
          >
            送出
          </ReactiveButton>
        </div>
      </form>
    </FormProvider>
  );
}
