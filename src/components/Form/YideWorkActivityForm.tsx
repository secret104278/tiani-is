import type { inferRouterOutputs } from "@trpc/server";
import { isNil } from "lodash";
import { useRouter } from "next/router";
import { FormProvider, useForm } from "react-hook-form";
import type { YideWorkRouter } from "~/server/api/routers/yidework";
import { api } from "~/utils/api";
import type { YideWorkAssignments } from "~/utils/types";
import {
  OFFERING_FESTIVALS,
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

type YideWorkActivity = inferRouterOutputs<YideWorkRouter>["getActivity"];

interface YideWorkActivityFormData {
  title: string;
  titleOther: string;
  offeringFestival: string;
  offeringFestivalOther: string;
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
    duration: 2, // 預設 2 小時，雖然隱藏但仍需數值
    offeringFestival: "",
    offeringFestivalOther: "",
  };
  if (defaultActivity) {
    const defaultTitleIsOther = titleIsOther(defaultActivity.title);

    formDefaultValues = {
      title: defaultTitleIsOther
        ? VOLUNTEER_ACTIVITY_TOPIC_OTHER
        : defaultActivity.title,
      titleOther: defaultTitleIsOther ? defaultActivity.title : "",

      locationId: defaultActivity.locationId,

      startDateTime: getDateTimeString(defaultActivity.startDateTime),
      duration: getDurationHour(
        defaultActivity.startDateTime,
        defaultActivity.endDateTime,
      ),
      description: defaultActivity.description ?? "",
      assignments: (defaultActivity.assignments as YideWorkAssignments) ?? {},
      offeringFestival: defaultActivity.festival ?? "",
    };
  }

  const methods = useForm<YideWorkActivityFormData>({
    defaultValues: formDefaultValues,
    mode: "all",
  });
  const { register, handleSubmit, watch, setValue } = methods;

  const router = useRouter();
  const currentTitle = watch("title");
  const isOffering = currentTitle === "獻供通知";

  const {
    data: locations,
    isLoading: locationIsLoading,
    error: locationsError,
  } = api.yideworkActivity.getLocations.useQuery();

  const {
    mutate: createActivity,
    error: createActivityError,
    isPending: createActivityIsPending,
  } = api.yideworkActivity.createActivity.useMutation({
    onSuccess: (data) => router.push(`/work/activity/detail/${data.id}`),
  });
  const {
    mutate: updateActivity,
    error: updateActivityError,
    isPending: updateActivityIsPending,
  } = api.yideworkActivity.updateActivity.useMutation({
    onSuccess: (data) => router.push(`/work/activity/detail/${data.id}`),
  });

  const _handleSubmit = (isDraft = false) => {
    return handleSubmit((data) => {
      let festival: string | null = null;
      if (isOffering && data.offeringFestival) {
        festival =
          data.offeringFestival === "其他（自行輸入）"
            ? data.offeringFestivalOther
            : data.offeringFestival;
      }

      const payload = {
        title: titleIsOther(data.title) ? data.titleOther : data.title,
        locationId: data.locationId,
        startDateTime: data.startDateTime as Date,
        endDateTime: getEndTime(data.startDateTime as Date, data.duration || 2),
        description: data.description,
        festival: festival,
        assignments: data.assignments,
        isDraft: isDraft,
      };

      if (defaultActivity) {
        updateActivity({
          activityId: defaultActivity.id,
          ...payload,
        });
      } else {
        createActivity(payload);
      }
    });
  };

  const canSaveDraft =
    isNil(defaultActivity) || defaultActivity.status === "DRAFT";

  if (locationIsLoading) return <div className="loading" />;
  if (!isNil(locationsError))
    return <AlertWarning>{locationsError.message}</AlertWarning>;

  return (
    <FormProvider {...methods}>
      <form className="form-control max-w-xs">
        <div>
          <label className="label">
            <span className="label-text text-sm">道務項目</span>
          </label>
          <select
            className="select select-bordered"
            {...register("title")}
            onChange={(e) => {
              const val = e.target.value;
              setValue("title", val);
              // 切換時清除 assignments
              setValue("assignments", {});
            }}
          >
            {YIDE_WORK_ACTIVITY_TITLES.map((option, i) => (
              <option key={i}>{option}</option>
            ))}
          </select>
        </div>

        {isOffering && (
          <div className="space-y-2">
            <div>
              <label className="label">
                <span className="label-text text-sm">獻供節日</span>
              </label>
              <select
                className="select select-bordered w-full"
                {...register("offeringFestival")}
              >
                <option value=""> -- 請選擇 -- </option>
                {OFFERING_FESTIVALS.map((festival, i) => (
                  <option key={i} value={festival}>
                    {festival}
                  </option>
                ))}
              </select>
            </div>
            {watch("offeringFestival") === "其他（自行輸入）" && (
              <input
                type="text"
                placeholder="請輸入節日名稱"
                className="tiani-input w-full"
                {...register("offeringFestivalOther")}
              />
            )}
          </div>
        )}

        <div>
          <label className="label">
            <span className="label-text text-sm">佛堂名稱</span>
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

        <YideWorkAssignmentsSection title={currentTitle} />

        <div className="divider" />
        <div>
          <label className="label">
            <span className="label-text text-sm">時間</span>
          </label>
          <input
            type="datetime-local"
            className="tiani-input"
            required
            {...register("startDateTime", { valueAsDate: true })}
          />
        </div>

        <div className="divider" />
        <div>
          <label className="label">
            <span className="label-text text-sm">補充說明</span>
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
