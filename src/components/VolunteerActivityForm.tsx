/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { $Enums } from "@prisma/client";
import { isNil } from "lodash";
import { useRouter } from "next/router";
import { useForm, useWatch } from "react-hook-form";
import { api } from "~/utils/api";
import {
  VOLUNTEER_ACTIVITY_TOPICS,
  VOLUNTEER_ACTIVITY_TOPIC_OTHER,
} from "~/utils/ui";
import { AlertWarning } from "./Alert";
import ReactiveButton from "./ReactiveButton";

type VolunteerActivityFormData = {
  title: string;
  titleOther: string;
  headcount: number;
  location: string;
  startDateTime: Date | string;
  duration: number;
  description: string;
};

const toDuration = (startDateTime: Date, endDateTime: Date) =>
  (endDateTime.getTime() - startDateTime.getTime()) / 60 / 60 / 1000;

const getEndTime = (startDateTime: Date, duration: number) =>
  new Date(startDateTime.getTime() + duration * 60 * 60 * 1000);

const getCurrentDateTime = (offset = 0) => {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset();
  const offsetMs = (-tzOffset + offset) * 60 * 1000;
  const localTime = new Date(now.getTime() + offsetMs);
  return localTime.toISOString().slice(0, 16);
};

const getDateTimeString = (date: Date) => {
  const tzOffset = date.getTimezoneOffset();
  const offsetMs = -tzOffset * 60 * 1000;
  const localTime = new Date(date.getTime() + offsetMs);
  return localTime.toISOString().slice(0, 16);
};

const titleIsOther = (title: string) => {
  for (const topic of VOLUNTEER_ACTIVITY_TOPICS) {
    if (topic.options.includes(title)) {
      return false;
    }
  }
  return true;
};

export default function VolunteerActivityForm({
  defaultActivity,
}: {
  defaultActivity?: {
    id: number;
    title: string;
    headcount: number;
    location: string;
    startDateTime: Date;
    endDateTime: Date;
    description: string | null;
    status: $Enums.VolunteerActivityStatus;
  };
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
      duration: toDuration(
        defaultActivity.startDateTime,
        defaultActivity.endDateTime,
      ),
      description: defaultActivity.description ?? "",
    };
  }

  const { register, handleSubmit, control } =
    useForm<VolunteerActivityFormData>({
      defaultValues: formDefaultValues,
      mode: "all",
    });
  const formTitleValue = useWatch({ control, name: "title" });

  const router = useRouter();
  const {
    mutate: createActivity,
    error: createActivityError,
    isLoading: createActivityIsLoading,
  } = api.volunteerActivity.createActivity.useMutation({
    onSuccess: (data) => router.push(`/volunteeractivity/detail/${data.id}`),
  });
  const {
    mutate: updateActivity,
    error: updateActivityError,
    isLoading: updateActivityIsLoading,
  } = api.volunteerActivity.updateActivity.useMutation({
    onSuccess: (data) => router.push(`/volunteeractivity/detail/${data.id}`),
  });

  const _hadleSubmit = (isDraft = false) => {
    if (defaultActivity) {
      return handleSubmit((data) =>
        updateActivity({
          id: defaultActivity.id,
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

  const canSaveDraft =
    isNil(defaultActivity) || defaultActivity.status === "DRAFT";

  return (
    <div>
      <form className="form-control max-w-xs">
        <div hidden={!isNil(defaultActivity)}>
          <label className="label">
            <span className="label-text">主題</span>
          </label>
          <select
            className="select select-bordered w-full"
            required
            {...register("title")}
          >
            {VOLUNTEER_ACTIVITY_TOPICS.map((topic, i) => (
              <optgroup key={i} label={topic.topic}>
                {topic.options.map((option, j) => (
                  <option key={j}>{option}</option>
                ))}
              </optgroup>
            ))}
            <optgroup label="其他">
              <option>{VOLUNTEER_ACTIVITY_TOPIC_OTHER}</option>
            </optgroup>
          </select>
        </div>
        <div>
          <label className="label">
            <span className="label-text"></span>
          </label>
          <input
            type="text"
            hidden={!isNil(defaultActivity) || !titleIsOther(formTitleValue)}
            className="input input-bordered w-full invalid:input-error"
            {...register("titleOther")}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">人數</span>
          </label>
          <input
            type="number"
            inputMode="numeric"
            className="input input-bordered w-full invalid:input-error"
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
            className="input input-bordered w-full invalid:input-error"
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
            className="input input-bordered w-full invalid:input-error"
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
            className="input input-bordered w-full invalid:input-error"
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
              onClick={_hadleSubmit(true)}
              loading={createActivityIsLoading || updateActivityIsLoading}
            >
              保存草稿
            </ReactiveButton>
          )}

          <ReactiveButton
            className="btn btn-primary"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={_hadleSubmit()}
            loading={createActivityIsLoading || updateActivityIsLoading}
          >
            送出
          </ReactiveButton>
        </div>
      </form>
    </div>
  );
}
