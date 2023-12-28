import type { ClassActivity } from "@prisma/client";
import { isNil } from "lodash";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { api } from "~/utils/api";
import {
  getCurrentDateTime,
  getDateTimeString,
  getDurationHour,
  getEndTime,
} from "~/utils/ui";
import { AlertWarning } from "./Alert";
import ReactiveButton from "./ReactiveButton";

interface EtogetherActivityFormData {
  title: string;
  location: string;
  startDateTime: Date | string;
  duration: number;
  description: string;
  //   subgroup: { asd: string }[];
}

export default function EtogetherActivityForm({
  defaultActivity,
}: {
  defaultActivity?: ClassActivity;
}) {
  let formDefaultValues: Partial<EtogetherActivityFormData> = {
    title: "",
    startDateTime: getCurrentDateTime(),
    description: "",
  };
  if (defaultActivity) {
    formDefaultValues = {
      title: defaultActivity.title,
      location: defaultActivity.location,
      startDateTime: getDateTimeString(defaultActivity.startDateTime),
      duration: getDurationHour(
        defaultActivity.startDateTime,
        defaultActivity.endDateTime,
      ),
      description: defaultActivity.description ?? "",
    };
  }

  const { register, handleSubmit, watch } = useForm<EtogetherActivityFormData>({
    defaultValues: formDefaultValues,
    mode: "all",
  });

  const router = useRouter();
  const {
    mutate: createActivity,
    error: createActivityError,
    isLoading: createActivityIsLoading,
  } = api.classActivity.createActivity.useMutation({
    onSuccess: (data) => router.push(`/etogether/activity/detail/${data.id}`),
  });
  const {
    mutate: updateActivity,
    error: updateActivityError,
    isLoading: updateActivityIsLoading,
  } = api.classActivity.updateActivity.useMutation({
    onSuccess: (data) => router.push(`/etogether/activity/detail/${data.id}`),
  });

  const _handleSubmit = (isDraft = false) => {
    if (defaultActivity) {
      return handleSubmit((data) =>
        updateActivity({
          id: defaultActivity.id,
          title: data.title,
          location: data.location,
          startDateTime: data.startDateTime as Date,
          endDateTime: getEndTime(data.startDateTime as Date, data.duration),
          description: data.description,
          isDraft: isDraft,
        }),
      );
    }

    return handleSubmit((data) =>
      createActivity({
        title: data.title,
        location: data.location,
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
          <span className="label-text">主題</span>
        </label>
        <input
          type="text"
          className="tiani-input"
          required
          {...register("title")}
        />
      </div>
      <div>
        <label className="label">
          <span className="label-text">地點</span>
        </label>
        <input
          type="text"
          className="tiani-input"
          required
          {...register("location")}
        />
      </div>
      <div className="divider"></div>
      <div>
        <label className="label">
          <span className="label-text">開始時間</span>
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
      <div className="divider"></div>
      <div>
        <label className="label">
          <span className="label-text">補充說明</span>
        </label>
        <textarea
          className="textarea textarea-bordered textarea-lg w-full"
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
            loading={createActivityIsLoading || updateActivityIsLoading}
          >
            保存草稿
          </ReactiveButton>
        )}

        <ReactiveButton
          className="btn btn-primary"
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={_handleSubmit()}
          loading={createActivityIsLoading || updateActivityIsLoading}
        >
          送出
        </ReactiveButton>
      </div>
    </form>
  );
}
