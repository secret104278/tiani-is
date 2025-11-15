import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import ReactiveButton from "../utils/ReactiveButton";

import type { User } from "next-auth";
import { api } from "~/utils/api";
import { invalidateActivityRegistrations } from "~/lib/query/invalidation";
import {
  etogetherRegistrationFormSchema,
  type EtogetherRegistrationFormData,
} from "~/lib/schemas";
import { truncateTitle } from "~/utils/ui";

export default function EtogetherActivityRegisterDialogContent({
  user,
  activityId,
  subgroups,
  defaultValues,
  onClose,
}: {
  user: User;
  activityId: number;
  subgroups: {
    id: number;
    title: string;
  }[];
  defaultValues?: EtogetherRegistrationFormData;
  onClose?: () => void;
}) {
  const utils = api.useUtils();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EtogetherRegistrationFormData>({
    resolver: zodResolver(etogetherRegistrationFormSchema),
    mode: "onBlur",
    defaultValues,
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "externalRegisters",
  });

  const {
    mutate: registerActivity,
    isPending: registerActivityIsPending,
    error: registerActivityError,
  } = api.etogetherActivity.registerActivity.useMutation({
    onSuccess: async () => {
      await invalidateActivityRegistrations(utils, "etogether", activityId);
      onClose?.();
    },
  });

  const onSubmit = (data: EtogetherRegistrationFormData) => {
    registerActivity({
      userId: user.id,
      activityId,
      ...data,
    });
  };

  return (
    <form className="flex flex-col space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="label">
          <span className="label-text">姓名：{user.name}</span>
        </label>
        <div className="flex flex-row items-center space-x-1">
          <label className="label">
            <span className="label-text">分組</span>
          </label>
          <select
            className="select select-bordered select-sm"
            {...register("subgroupId", { valueAsNumber: true })}
          >
            {subgroups.map((subgroup) => (
              <option key={subgroup.id} value={subgroup.id}>
                {truncateTitle(subgroup.title)}
              </option>
            ))}
          </select>
        </div>
        {errors.subgroupId && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.subgroupId.message}
            </span>
          </label>
        )}
      </div>
      <div className="divider">其他夥伴</div>
      {fields.map((field, index) => (
        <div
          className="card card-bordered card-compact border-2"
          key={field.id}
        >
          <div className="card-body">
            <div className="flex flex-row items-center space-x-1">
              <label className="label">
                <span className="label-text">姓名</span>
              </label>
              <input
                type="text"
                className="tiani-input-inline"
                {...register(`externalRegisters.${index}.username`)}
              />
            </div>
            <div className="flex flex-row items-center space-x-1">
              <label className="label">
                <span className="label-text flex-shrink-0">分組</span>
              </label>
              <select
                className="select select-bordered"
                {...register(`externalRegisters.${index}.subgroupId`, {
                  valueAsNumber: true,
                })}
              >
                {subgroups.map((subgroup) => (
                  <option key={subgroup.id} value={subgroup.id}>
                    {truncateTitle(subgroup.title)}
                  </option>
                ))}
              </select>
            </div>
            <div className="card-actions justify-end">
              <button
                type="button"
                className="btn btn-primary btn-sm"
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
        onClick={() => append({ username: "", subgroupId: subgroups?.[0]?.id ?? -1 })}
      >
        新增夥伴
      </button>
      <ReactiveButton
        type="submit"
        className="btn btn-primary"
        loading={registerActivityIsPending}
        error={registerActivityError?.message}
      >
        送出報名
      </ReactiveButton>
    </form>
  );
}
