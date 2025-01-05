import { type inferRouterOutputs } from "@trpc/server";
import { isNil } from "lodash";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { type YideClassRouter } from "~/server/api/routers/yideclass";
import { api } from "~/utils/api";
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
import { AlertWarning } from "../utils/Alert";
import ReactiveButton from "../utils/ReactiveButton";
import SelectWithCustomInput from "./SelectWithCustomInput";

type ClassActivity = inferRouterOutputs<YideClassRouter>["getActivity"];

interface ClassActivityFormData {
  title: string;
  titleOther: string;
  location: string;
  locationOther: string;
  startDateTime: Date | string;
  duration: number;
  description: string;
}

export default function ClassActivityForm({
  defaultActivity,
}: {
  defaultActivity?: ClassActivity;
}) {
  let formDefaultValues: Partial<ClassActivityFormData> = {
    title: CLASS_ACTIVITY_TITLES?.[0],
    startDateTime: getCurrentDateTime(),
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

      startDateTime: getDateTimeString(defaultActivity.startDateTime),
      duration: getDurationHour(
        defaultActivity.startDateTime,
        defaultActivity.endDateTime,
      ),
      description: defaultActivity.description ?? "",
    };
  }

  const { register, handleSubmit, watch } = useForm<ClassActivityFormData>({
    defaultValues: formDefaultValues,
    mode: "all",
  });

  const router = useRouter();
  const {
    mutate: createActivity,
    error: createActivityError,
    isPending: createActivityIsPending,
  } = api.classActivity.createActivity.useMutation({
    onSuccess: (data) => router.push(`/yideclass/activity/detail/${data.id}`),
  });
  const {
    mutate: updateActivity,
    error: updateActivityError,
    isPending: updateActivityIsPending,
  } = api.classActivity.updateActivity.useMutation({
    onSuccess: (data) => router.push(`/yideclass/activity/detail/${data.id}`),
  });

  const _handleSubmit = (isDraft = false) => {
    if (defaultActivity) {
      return handleSubmit((data) =>
        updateActivity({
          activityId: defaultActivity.id,
          title: titleIsOther(data.title) ? data.titleOther : data.title,
          location: locationIsOther(data.location)
            ? data.locationOther
            : data.location,
          startDateTime: data.startDateTime as Date,
          endDateTime: getEndTime(data.startDateTime as Date, data.duration),
          description: data.description,
          isDraft: isDraft,
        }),
      );
    }

    return handleSubmit((data) =>
      createActivity({
        title: titleIsOther(data.title) ? data.titleOther : data.title,
        location: locationIsOther(data.location)
          ? data.locationOther
          : data.location,
        startDateTime: data.startDateTime as Date,
        endDateTime: getEndTime(data.startDateTime as Date, data.duration),
        description: data.description,
        isDraft: isDraft,
      }),
    );
  };

  const canSaveDraft =
    isNil(defaultActivity) || defaultActivity.status === "DRAFT";

  return (
    <form className="form-control max-w-xs">
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
      <div className="divider"></div>
      <div>
        <label className="label">
          <span className="label-text">開班時間</span>
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
          <span className="label-text">開班時數</span>
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
      <div className="divider"></div>
      <div>
        <label className="label">
          <span className="label-text">補充說明</span>
        </label>
        <textarea
          className="textarea textarea-bordered w-full"
          {...register("description")}
        ></textarea>
      </div>
      <div className="divider"></div>
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
  );
}
