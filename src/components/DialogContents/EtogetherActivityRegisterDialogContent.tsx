import { useFieldArray, useForm } from "react-hook-form";
import ReactiveButton from "../ReactiveButton";

import { useRouter } from "next/router";
import { api } from "~/utils/api";

interface EtogetherActivityRegisterFormData {
  subgroupId: number;
  externals: {
    username: string;
    subgroupId: number;
  }[];
}

export default function EtogetherActivityRegisterDialogContent({
  activityId,
  subgroups,
}: {
  activityId: number;
  subgroups: {
    id: number;
    title: string;
  }[];
}) {
  const router = useRouter();

  const { register, handleSubmit, control } =
    useForm<EtogetherActivityRegisterFormData>({
      mode: "all",
    });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "externals",
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
          <span className="label-text">分組</span>
        </label>
        <div>
          <select
            className="select select-bordered"
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
      <div className="divider"></div>
      {fields.map((field, index) => (
        <div
          className="card card-bordered card-compact border-2"
          key={field.id}
        >
          <div className="card-body">
            <label className="label">
              <span className="label-text">姓名</span>
            </label>
            <input
              required
              type="text"
              className="tiani-input"
              {...register(`externals.${index}.username`)}
            />
            <label className="label">
              <span className="label-text">分組</span>
            </label>
            <select
              className="select select-bordered"
              required
              {...register(`externals.${index}.subgroupId`, {
                valueAsNumber: true,
              })}
            >
              {subgroups.map((subgroup) => (
                <option key={subgroup.id} value={subgroup.id}>
                  {subgroup.title}
                </option>
              ))}
            </select>
            <div className="card-actions justify-end">
              <button
                className="btn btn-primary"
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
          append({ username: "", subgroupId: -1 });
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
            id: activityId,
            ...data,
          });
        })}
      >
        送出報名
      </ReactiveButton>
    </form>
  );
}
