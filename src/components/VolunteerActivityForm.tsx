/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { VolunteerActivityStatus } from "@prisma/client";
import { isNil } from "lodash";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { api } from "~/utils/api";
import { AlertWarning } from "./Alert";

type VolunteerActivityFormData = {
  id: number;
  title: string;
  headcount: number;
  location: string;
  startDateTime: Date;
  endDateTime: Date;
  description: string;
  status: VolunteerActivityStatus;
};

export default function VolunteerActivityForm({
  defaultActivity,
}: {
  defaultActivity?: VolunteerActivityFormData;
}) {
  const { register, handleSubmit } = useForm();
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
          title: data.title,
          headcount: data.headcount,
          location: data.location,
          startDateTime: data.startDateTime,
          endDateTime: data.endDateTime,
          description: data.description,
          isDraft: isDraft,
        }),
      );
    }

    return handleSubmit((data) =>
      createActivity({
        title: data.title,
        headcount: data.headcount,
        location: data.location,
        startDateTime: data.startDateTime,
        endDateTime: data.endDateTime,
        description: data.description,
        isDraft: isDraft,
      }),
    );
  };

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

  const canSaveDraft =
    isNil(defaultActivity) || defaultActivity.status === "DRAFT";

  return (
    <div>
      {!isNil(createActivityError) && (
        <AlertWarning>{createActivityError.message}</AlertWarning>
      )}
      {!isNil(updateActivityError) && (
        <AlertWarning>{updateActivityError.message}</AlertWarning>
      )}
      <form className="form-control max-w-xs">
        <div hidden={!isNil(defaultActivity)}>
          <label className="label">
            <span className="label-text">主題</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full invalid:input-error"
            required
            defaultValue={defaultActivity?.title}
            {...register("title")}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">人數</span>
          </label>
          <input
            type="number"
            className="input input-bordered w-full invalid:input-error"
            required
            defaultValue={defaultActivity?.headcount}
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
            defaultValue={defaultActivity?.location}
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
            defaultValue={
              defaultActivity?.startDateTime
                ? getDateTimeString(defaultActivity.startDateTime)
                : getCurrentDateTime()
            }
            required
            {...register("startDateTime", { valueAsDate: true })}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">預估結束時間</span>
          </label>
          <input
            type="datetime-local"
            className="input input-bordered w-full invalid:input-error"
            defaultValue={
              defaultActivity?.endDateTime
                ? getDateTimeString(defaultActivity.endDateTime)
                : getCurrentDateTime(60)
            }
            required
            {...register("endDateTime", { valueAsDate: true })}
          />
        </div>
        <div className="divider"></div>
        <div>
          <label className="label">
            <span className="label-text">補充說明</span>
          </label>
          <textarea
            className="textarea textarea-bordered textarea-lg w-full"
            defaultValue={defaultActivity?.description}
            {...register("description")}
          ></textarea>
        </div>
        <div className="divider"></div>
        {createActivityIsLoading || updateActivityIsLoading ? (
          <div className="loading"></div>
        ) : (
          <div className="flex flex-row justify-end space-x-4">
            {canSaveDraft && (
              <button
                className="btn"
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onClick={_hadleSubmit(true)}
              >
                保存草稿
              </button>
            )}

            <button
              className="btn btn-primary"
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={_hadleSubmit()}
            >
              送出
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
