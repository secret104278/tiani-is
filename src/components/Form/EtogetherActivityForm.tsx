import { zodResolver } from "@hookform/resolvers/zod";
import type {
  EtogetherActivity,
  EtogetherActivitySubgroup,
} from "@prisma/client";
import { isNil } from "lodash";
import { useFieldArray, useForm } from "react-hook-form";
import { useEtogetherMutations } from "~/hooks";
import {
  type EtogetherActivityFormData,
  etogetherActivityFormSchema,
} from "~/lib/schemas";
import {
  getCurrentDateTime,
  getDateTimeString,
  getDurationHour,
  getEndTime,
} from "~/utils/ui";
import ReactiveButton from "../utils/ReactiveButton";
import { DateTimeField, FormError, FormField, NumberField } from "./shared";

export default function EtogetherActivityForm({
  defaultActivity,
}: {
  defaultActivity?: EtogetherActivity & {
    subgroups: EtogetherActivitySubgroup[];
  };
}) {
  let formDefaultValues: Partial<EtogetherActivityFormData> = {
    title: "",
    // Cast to Date because RHF defaultValues expects the schema type (Date),
    // but the input type="datetime-local" requires an ISO string.
    startDateTime: getCurrentDateTime() as unknown as Date,
    description: "",
  };
  if (defaultActivity) {
    formDefaultValues = {
      title: defaultActivity.title,
      location: defaultActivity.location,
      startDateTime: getDateTimeString(
        defaultActivity.startDateTime,
      ) as unknown as Date,
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
      description: data.description ?? null,
      isDraft: isDraft,
      subgroups: data.subgroups,
    };

    if (defaultActivity) {
      // Update existing activity
      updateActivity({
        activityId: defaultActivity.id,
        ...activityData,
      } as unknown as Parameters<typeof updateActivity>[0]);
    } else {
      // Create new activity
      // Create new activity
      createActivity(
        activityData as unknown as Parameters<typeof createActivity>[0],
      );
    }
  };

  const handleFormSubmit = (isDraft = false) => {
    return handleSubmit((data) => onSubmit(data, isDraft));
  };

  const canSaveDraft =
    isNil(defaultActivity) || defaultActivity.status === "DRAFT";

  return (
    <form className="form-control max-w-xs" onSubmit={handleFormSubmit()}>
      <FormField label="主題" required error={errors.title?.message}>
        <input type="text" className="tiani-input" {...register("title")} />
      </FormField>
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
