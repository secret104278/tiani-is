import type { inferRouterOutputs } from "@trpc/server";
import _ from "lodash";
import { isNil } from "lodash";
import { useRouter } from "next/router";
import { FormProvider, useForm } from "react-hook-form";
import type { WorkRouter } from "~/server/api/routers/work";
import { api } from "~/utils/api";
import type { WorkAssignments } from "~/utils/types";
import {
  MASTER_WORK_ROLES,
  OFFERING_FESTIVALS,
  VOLUNTEER_ACTIVITY_TOPIC_OTHER,
  WORK_ACTIVITY_TITLES,
  WORK_ROLE_PRESETS,
  getCurrentDateTime,
  getDateTimeString,
  getDurationHour,
  getEndTime,
  getUnitBySlug,
  titleIsOther,
} from "~/utils/ui";
import { AlertWarning } from "../utils/Alert";
import ReactiveButton from "../utils/ReactiveButton";
import WorkAssignmentsSection from "./WorkAssignmentsSection";

type YideWorkActivity = inferRouterOutputs<WorkRouter>["getActivity"];

interface WorkActivityFormData {
  title: string;
  titleOther: string;
  offeringFestival: string;
  offeringFestivalOther: string;
  locationId: number;
  startDateTime: Date | string;
  duration: number;
  description: string;
  assignments: WorkAssignments;
  preset: string;
  rolesConfig: string[];
}

export default function WorkActivityForm({
  defaultActivity,
  unitSlug,
}: {
  defaultActivity?: YideWorkActivity;
  unitSlug: string;
}) {
  let formDefaultValues: Partial<WorkActivityFormData> = {
    title: WORK_ACTIVITY_TITLES?.[0],
    startDateTime: getCurrentDateTime(),
    description: "",
    assignments: {},
    duration: 2, // 預設 2 小時，雖然隱藏但仍需數值
    offeringFestival: "",
    offeringFestivalOther: "",
    preset: "offering",
    rolesConfig: [...WORK_ROLE_PRESETS.offering.roles],
  };
  if (defaultActivity) {
    const defaultTitleIsOther = titleIsOther(defaultActivity.title);

    let rolesConfig = (defaultActivity.rolesConfig as string[]) ?? [];
    let preset = "full";

    // Legacy data fallback
    if (_.isEmpty(rolesConfig)) {
      if (defaultActivity.title === "獻供通知") {
        preset = "offering";
        rolesConfig = [...WORK_ROLE_PRESETS.offering.roles];
      } else if (defaultActivity.title === "辦道通知") {
        preset = "taoCeremony";
        rolesConfig = [...WORK_ROLE_PRESETS.taoCeremony.roles];
      }
    } else {
      // Try to find matching preset
      const matchedPreset = Object.entries(WORK_ROLE_PRESETS).find(
        ([, def]) =>
          def.roles.length === rolesConfig.length &&
          def.roles.every((r) => rolesConfig.includes(r)),
      );
      if (matchedPreset) {
        preset = matchedPreset[0];
      }
    }

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
      assignments: (defaultActivity.assignments as WorkAssignments) ?? {},
      offeringFestival: defaultActivity.festival ?? "",
      preset,
      rolesConfig,
    };
  }

  const methods = useForm<WorkActivityFormData>({
    defaultValues: formDefaultValues,
    mode: "all",
  });
  const { register, handleSubmit, watch, setValue } = methods;

  const router = useRouter();
  const unitName = getUnitBySlug(unitSlug)?.name;

  const currentTitle = watch("title");
  const isOffering = currentTitle === "獻供通知";

  const {
    data: locations,
    isLoading: locationIsLoading,
    error: locationsError,
  } = api.workActivity.getLocations.useQuery();

  const {
    data: staffs,
    isLoading: staffsIsLoading,
    error: staffsError,
  } = api.workActivity.getStaffs.useQuery(
    {
      activityId: defaultActivity?.id ?? 0,
    },
    {
      enabled: !!defaultActivity?.id,
    },
  );

  const staffNames =
    (staffs?.map((staff) => staff.user.name).filter(Boolean) as string[]) ?? [];

  const {
    mutate: createActivity,
    error: createActivityError,
    isPending: createActivityIsPending,
  } = api.workActivity.createActivity.useMutation({
    onSuccess: (data) =>
      router.push(`/work/${unitSlug}/activity/detail/${data.id}`),
  });
  const {
    mutate: updateActivity,
    error: updateActivityError,
    isPending: updateActivityIsPending,
  } = api.workActivity.updateActivity.useMutation({
    onSuccess: (data) =>
      router.push(`/work/${unitSlug}/activity/detail/${data.id}`),
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
        rolesConfig: data.rolesConfig,
        isDraft: isDraft,
        unit: unitName ?? "義德",
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

  const currentRoleKeys = watch("rolesConfig") || [];
  const activeRoleDefinitions = MASTER_WORK_ROLES.filter((r) =>
    currentRoleKeys.includes(r.key),
  );

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

              // Auto-switch preset based on title if it's a new activity
              if (!defaultActivity) {
                if (val === "獻供通知") {
                  setValue("preset", "offering");
                  setValue("rolesConfig", [
                    ...WORK_ROLE_PRESETS.offering.roles,
                  ]);
                } else if (val === "辦道通知") {
                  setValue("preset", "taoCeremony");
                  setValue("rolesConfig", [
                    ...WORK_ROLE_PRESETS.taoCeremony.roles,
                  ]);
                }
                setValue("assignments", {});
              }
            }}
          >
            {WORK_ACTIVITY_TITLES.map((option, i) => (
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
            {locations?.map((location: { id: number; name: string }) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">
            <span className="label-text text-sm">工作分配模式</span>
          </label>
          <select
            className="select select-bordered"
            {...register("preset")}
            onChange={(e) => {
              const presetKey = e.target
                .value as keyof typeof WORK_ROLE_PRESETS;
              const preset = WORK_ROLE_PRESETS[presetKey];
              setValue("preset", presetKey);
              setValue("rolesConfig", [...preset.roles]);
              // Reset assignments when preset changes to avoid stale data in UI
              setValue("assignments", {});
            }}
          >
            {Object.entries(WORK_ROLE_PRESETS).map(([key, def]) => (
              <option key={key} value={key}>
                {def.label}
              </option>
            ))}
          </select>
        </div>

        <WorkAssignmentsSection
          roleDefinitions={activeRoleDefinitions}
          staffNames={staffNames}
        />

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
