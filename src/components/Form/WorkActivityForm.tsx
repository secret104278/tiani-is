import { PlusIcon, TrashIcon } from "@heroicons/react/20/solid";
import { YideWorkType } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import _ from "lodash";
import { isNil } from "lodash";
import { useRouter } from "next/router";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import type { WorkRouter } from "~/server/api/routers/work";
import { api } from "~/utils/api";
import type { WorkAssignments } from "~/utils/types";
import {
  CUSTOM_ROLE_KEY,
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
  roleTitleInput: string;
  offeringFestival: string;
  offeringFestivalOther: string;
  locationId: number;
  startDateTime: Date | string;
  duration: number;
  description: string;
  assignments: WorkAssignments;
  customRoles: { role: string; name: string }[];
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
    roleTitleInput: "",
    startDateTime: getCurrentDateTime(),
    description: "",
    assignments: {},
    customRoles: [],
    duration: 2, // 預設 2 小時，雖然隱藏但仍需數值
    offeringFestival: "",
    offeringFestivalOther: "",
    preset: "offering",
    rolesConfig: [...WORK_ROLE_PRESETS.offering.roles],
  };
  if (defaultActivity) {
    const isCustomTitle = !WORK_ACTIVITY_TITLES.includes(defaultActivity.title);

    let rolesConfig = (defaultActivity.rolesConfig as string[]) ?? [];
    let preset = "full";

    // Legacy data fallback
    if (_.isEmpty(rolesConfig)) {
      if (defaultActivity.title === "獻供通知") {
        preset = "offering";
        rolesConfig = [...WORK_ROLE_PRESETS.offering.roles];
      } else if (defaultActivity.title === "辦道通知" || isCustomTitle) {
        preset = "taoCeremony";
        rolesConfig = [...WORK_ROLE_PRESETS.taoCeremony.roles];
      } else if (defaultActivity.title === "執禮通知") {
        preset = "full";
        rolesConfig = [];
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
      title: isCustomTitle ? "執禮通知" : defaultActivity.title,
      roleTitleInput: isCustomTitle ? defaultActivity.title : "",

      locationId: defaultActivity.locationId,

      startDateTime: getDateTimeString(defaultActivity.startDateTime),
      duration: getDurationHour(
        defaultActivity.startDateTime,
        defaultActivity.endDateTime,
      ),
      description: defaultActivity.description ?? "",
      assignments: (defaultActivity.assignments as WorkAssignments) ?? {},
      customRoles:
        (defaultActivity.assignments as WorkAssignments)?.[CUSTOM_ROLE_KEY] ||
        [],
      offeringFestival: defaultActivity.festival ?? "",
      preset,
      rolesConfig,
    };
  }

  const methods = useForm<WorkActivityFormData>({
    defaultValues: formDefaultValues,
    mode: "all",
  });
  const { register, handleSubmit, watch, setValue, control } = methods;

  const {
    fields: customRoleFields,
    append: appendCustomRole,
    remove: removeCustomRole,
  } = useFieldArray({
    control,
    name: "customRoles",
  });

  const router = useRouter();
  const unitName = getUnitBySlug(unitSlug)?.name;

  const currentTitle = watch("title");
  const isOffering = currentTitle === "獻供通知";
  const isCeremonyMode = currentTitle === "執禮通知";

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

      const finalTitle = isCeremonyMode ? data.roleTitleInput : data.title;

      let workType: YideWorkType = YideWorkType.OTHER;
      if (data.title === "獻供通知") workType = YideWorkType.OFFERING;
      else if (data.title === "辦道通知") workType = YideWorkType.TAO;
      else if (data.title === "執禮通知") workType = YideWorkType.CEREMONY;

      const payload = {
        title: finalTitle,
        workType: workType,
        locationId: data.locationId,
        startDateTime: data.startDateTime as Date,
        endDateTime: getEndTime(data.startDateTime as Date, data.duration || 2),
        description: data.description,
        festival: festival,
        assignments: {
          ...data.assignments,
          [CUSTOM_ROLE_KEY]: data.customRoles,
        },
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
                } else if (val === "執禮通知") {
                  setValue("preset", "full");
                  setValue("rolesConfig", []);
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

        {isCeremonyMode && (
          <div className="mt-2">
            <label className="label">
              <span className="label-text text-sm">道務名稱</span>
            </label>
            <input
              type="text"
              placeholder="例如：春季大典"
              className="tiani-input w-full"
              {...register("roleTitleInput", { required: isCeremonyMode })}
            />
          </div>
        )}

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

        {isCeremonyMode && (
          <div className="my-4 rounded-md border border-base-300 bg-base-100 p-4">
            <div className="mb-2 font-bold text-sm">
              自訂職務欄位 (自行輸入)
            </div>
            <div className="space-y-4">
              {customRoleFields.map((field, index) => (
                <div
                  key={field.id}
                  className="relative flex flex-col gap-2 border-base-300 border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    <input
                      placeholder="職務 (如: 交通)"
                      className="input input-bordered w-full"
                      {...register(`customRoles.${index}.role` as const)}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-circle text-error"
                      onClick={() => removeCustomRole(index)}
                    >
                      <TrashIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <input
                    placeholder="人員姓名"
                    className="input input-bordered w-full"
                    {...register(`customRoles.${index}.name` as const)}
                  />
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline btn-sm w-full"
                onClick={() => appendCustomRole({ role: "", name: "" })}
              >
                <PlusIcon className="h-4 w-4" /> 新增自訂欄位
              </button>
            </div>
          </div>
        )}

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
