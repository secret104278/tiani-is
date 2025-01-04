"use client";

import type { VolunteerActivity } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import AlertWarning from "~/app/_components/basic/alert-warning";
import ReactiveButton from "~/app/_components/basic/reactive-button";
import SelectWithCustomInput, {
  NestedSelect,
} from "~/app/_components/select-with-custom-input";
import { api } from "~/trpc/react";
import { volunteerActivityDetailHref } from "~/utils/navigation";
import {
  VOLUNTEER_ACTIVITY_TOPICS,
  VOLUNTEER_ACTIVITY_TOPIC_OTHER,
  getCurrentDateTime,
  getDateTimeString,
  getDurationHour,
  getEndTime,
  titleIsOther,
} from "~/utils/ui";

type VolunteerActivityFormData = {
  title: string;
  titleOther: string;
  headcount: number;
  location: string;
  startDateTime: Date | string;
  duration: number;
  description: string;
};

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

  const { register, handleSubmit, watch } = useForm<VolunteerActivityFormData>({
    defaultValues: formDefaultValues,
    mode: "all",
  });

  const router = useRouter();
  const {
    mutate: createActivity,
    error: createActivityError,
    isPending: createActivityIsLoading,
  } = api.volunteerActivity.createActivity.useMutation({
    onSuccess: (data) => router.push(volunteerActivityDetailHref(data.id)),
  });
  const {
    mutate: updateActivity,
    error: updateActivityError,
    isPending: updateActivityIsLoading,
  } = api.volunteerActivity.updateActivity.useMutation({
    onSuccess: (data) => router.push(volunteerActivityDetailHref(data.id)),
  });

  const _handleSubmit = (isDraft = false) => {
    if (defaultActivity) {
      return handleSubmit((data) =>
        updateActivity({
          activityId: defaultActivity.id,
          title: titleIsOther(data.title) ? data.titleOther : data.title,
          headcount: data.headcount,
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
        title: titleIsOther(data.title) ? data.titleOther : data.title,
        headcount: data.headcount,
        location: data.location,
        startDateTime: data.startDateTime as Date,
        endDateTime: getEndTime(data.startDateTime as Date, data.duration),
        description: data.description,
        isDraft: isDraft,
      }),
    );
  };

  const canSaveDraft = !defaultActivity || defaultActivity.status === "DRAFT";

  return (
    <form className="form-control max-w-xs">
      <div hidden={!!defaultActivity}>
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
          <span className="label-text">人數</span>
        </label>
        <input
          type="number"
          inputMode="numeric"
          className="tiani-input"
          required
          {...register("headcount", { valueAsNumber: true })}
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
          className="textarea textarea-bordered w-full"
          {...register("description")}
        ></textarea>
      </div>
      <div className="divider"></div>
      {!!createActivityError && (
        <AlertWarning>{createActivityError.message}</AlertWarning>
      )}
      {!!updateActivityError && (
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