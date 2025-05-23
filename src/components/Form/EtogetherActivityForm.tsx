import type {
  EtogetherActivity,
  EtogetherActivitySubgroup,
} from "@prisma/client";
import { isNil } from "lodash";
import { useRouter } from "next/router";
import { useFieldArray, useForm } from "react-hook-form";
import { api } from "~/utils/api";
import {
  getCurrentDateTime,
  getDateTimeString,
  getDurationHour,
  getEndTime,
} from "~/utils/ui";
import { AlertWarning } from "../utils/Alert";
import ReactiveButton from "../utils/ReactiveButton";

interface EtogetherActivityFormData {
  title: string;
  location: string;
  startDateTime: Date | string;
  duration: number;
  description: string;
  subgroups: {
    id: number | null;
    title: string;
    description: string | null;
    displayColorCode: string | null;
  }[];
}

export default function EtogetherActivityForm({
  defaultActivity,
}: {
  defaultActivity?: EtogetherActivity & {
    subgroups: EtogetherActivitySubgroup[];
  };
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
      subgroups: defaultActivity.subgroups ?? [],
      description: defaultActivity.description ?? "",
    };
  }

  const { register, handleSubmit, control } =
    useForm<EtogetherActivityFormData>({
      defaultValues: formDefaultValues,
      mode: "all",
    });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "subgroups",
  });

  const router = useRouter();
  const {
    mutate: createActivity,
    error: createActivityError,
    isPending: createActivityIsPending,
  } = api.etogetherActivity.createActivity.useMutation({
    onSuccess: (data) => router.push(`/etogether/activity/detail/${data.id}`),
  });
  const {
    mutate: updateActivity,
    error: updateActivityError,
    isPending: updateActivityIsPending,
  } = api.etogetherActivity.updateActivity.useMutation({
    onSuccess: (data) => router.push(`/etogether/activity/detail/${data.id}`),
  });

  const _handleSubmit = (isDraft = false) => {
    if (defaultActivity) {
      return handleSubmit((data) =>
        updateActivity({
          activityId: defaultActivity.id,
          title: data.title,
          location: data.location,
          startDateTime: data.startDateTime as Date,
          endDateTime: getEndTime(data.startDateTime as Date, data.duration),
          description: data.description,
          isDraft: isDraft,
          subgroups: data.subgroups,
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
        subgroups: data.subgroups,
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
      <div className="divider" />
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
      <div className="divider" />
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            className="card card-bordered card-compact border-2"
            key={field.id}
          >
            <div className="card-body">
              <label className="label">
                <span className="label-text">分組主題</span>
              </label>
              <input
                required
                type="text"
                className="tiani-input"
                {...register(`subgroups.${index}.title`)}
              />
              <label className="label">
                <span className="label-text">分組說明</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                {...register(`subgroups.${index}.description`)}
              />
              <div className="flex flex-row items-center">
                <label className="label">
                  <span className="label-text">背景顏色</span>
                </label>
                <input
                  type="color"
                  style={{ border: "none" }}
                  {...register(`subgroups.${index}.displayColorCode`)}
                />
              </div>
              <div className="card-actions justify-end">
                <button
                  className="btn btn-primary"
                  onClick={(e) => {
                    void e.preventDefault();
                    remove(index);
                  }}
                >
                  移除
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          className="btn"
          onClick={(e) => {
            void e.preventDefault();
            append({
              id: null,
              title: "",
              description: null,
              displayColorCode: null,
            });
          }}
        >
          新增分組
        </button>
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
  );
}
