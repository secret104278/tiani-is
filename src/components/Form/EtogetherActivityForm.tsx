import type {
  EtogetherActivity,
  EtogetherActivitySubgroup,
} from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { isNil } from "lodash";
import { useFieldArray, useForm } from "react-hook-form";
import {
  etogetherActivityFormSchema,
  type EtogetherActivityFormData,
} from "~/lib/schemas";
import { useEtogetherMutations } from "~/hooks";
import {
  getCurrentDateTime,
  getDateTimeString,
  getDurationHour,
  getEndTime,
} from "~/utils/ui";
import { AlertWarning } from "../utils/Alert";
import ReactiveButton from "../utils/ReactiveButton";

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

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EtogetherActivityFormData>({
    resolver: zodResolver(etogetherActivityFormSchema),
    defaultValues: formDefaultValues,
    mode: "onBlur", // Better UX - only validate after user leaves field
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subgroups",
  });

  // Use the new mutation hook with automatic cache invalidation
  const { createActivity, updateActivity, isPending, error } =
    useEtogetherMutations();

  const onSubmit = (data: EtogetherActivityFormData, isDraft = false) => {
    // Transform form data to API format
    const activityData = {
      title: data.title,
      location: data.location,
      startDateTime: data.startDateTime,
      endDateTime: getEndTime(data.startDateTime, data.duration),
      description: data.description,
      isDraft: isDraft,
      subgroups: data.subgroups,
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
      <div>
        <label className="label">
          <span className="label-text">
            主題
            <span className="text-error ml-1">*</span>
          </span>
        </label>
        <input
          type="text"
          className="tiani-input"
          {...register("title")}
        />
        {errors.title && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.title.message}
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
                  type="button"
                  className="btn btn-primary"
                  onClick={() => remove(index)}
                >
                  移除
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="btn"
          onClick={() =>
            append({
              id: null,
              title: "",
              description: null,
              displayColorCode: null,
            })
          }
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
