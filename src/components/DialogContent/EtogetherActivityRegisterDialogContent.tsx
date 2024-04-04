import { useFieldArray, useForm } from "react-hook-form";
import ReactiveButton from "../utils/ReactiveButton";

import type { inferRouterInputs } from "@trpc/server";
import type { User } from "next-auth";
import { useRouter } from "next/router";
import type { EtogetherRouter } from "~/server/api/routers/etogether";
import { api } from "~/utils/api";

type EtogetherActivityRegisterFormData = Omit<
  inferRouterInputs<EtogetherRouter>["registerActivity"],
  "activityId" | "userId"
>;

export default function EtogetherActivityRegisterDialogContent({
  user,
  activityId,
  subgroups,
  defaultValues,
}: {
  user: User;
  activityId: number;
  subgroups: {
    id: number;
    title: string;
  }[];
  defaultValues?: EtogetherActivityRegisterFormData;
}) {
  const router = useRouter();

  const { register, handleSubmit, control } =
    useForm<EtogetherActivityRegisterFormData>({
      mode: "all",
      defaultValues,
    });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "externalRegisters",
  });

  const {
    mutate: registerActivity,
    isLoading: registerActivityIsLoading,
    error: registerActivityError,
  } = api.etogetherActivity.registerActivity.useMutation({
    onSuccess: () => router.reload(),
  });

  return (
    <form className="flex flex-col space-y-4">
      <div>
        <label className="label">
          <span className="label-text">姓名：{user.name}</span>
        </label>
        <div className="flex flex-row space-x-1">
          <label className="label">
            <span className="label-text">分組</span>
          </label>
          <select
            className="select select-bordered select-sm"
            required
            {...register("subgroupId", { valueAsNumber: true })}
          >
            {subgroups.map((subgroup) => (
              <option key={subgroup.id} value={subgroup.id}>
                {subgroup.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="divider">其他夥伴</div>
      {fields.map((field, index) => (
        <div
          className="card card-bordered card-compact border-2"
          key={field.id}
        >
          <div className="card-body">
            <div className="flex flex-row space-x-1">
              <label className="label">
                <span className="label-text">姓名</span>
              </label>
              <input
                required
                type="text"
                className="tiani-input-inline"
                {...register(`externalRegisters.${index}.username`)}
              />
            </div>
            <div className="flex flex-row space-x-1">
              <label className="label">
                <span className="label-text">分組</span>
              </label>
              <select
                className="select select-bordered select-sm"
                required
                {...register(`externalRegisters.${index}.subgroupId`, {
                  valueAsNumber: true,
                })}
              >
                {subgroups.map((subgroup) => (
                  <option key={subgroup.id} value={subgroup.id}>
                    {subgroup.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="card-actions justify-end">
              <button
                className="btn btn-primary btn-sm"
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
          append({ username: "", subgroupId: subgroups?.[0]?.id ?? -1 });
        }}
      >
        新增夥伴
      </button>
      <ReactiveButton
        className="btn btn-primary"
        loading={registerActivityIsLoading}
        error={registerActivityError?.message}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick={handleSubmit((data) => {
          void registerActivity({
            userId: user.id,
            activityId,
            ...data,
          });
        })}
      >
        送出報名
      </ReactiveButton>
    </form>
  );
}
