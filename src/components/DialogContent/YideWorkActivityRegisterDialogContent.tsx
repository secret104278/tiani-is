import { useFieldArray, useForm } from "react-hook-form";
import ReactiveButton from "../utils/ReactiveButton";

import type { inferRouterInputs } from "@trpc/server";
import type { User } from "next-auth";
import { useRouter } from "next/router";
import type { YideWorkRouter } from "~/server/api/routers/yidework";
import { api } from "~/utils/api";

type YideWorkActivityRegisterFormData = Omit<
  inferRouterInputs<YideWorkRouter>["registerActivity"],
  "activityId" | "userId"
>;

export default function YideWorkActivityRegisterDialogContent({
  user,
  activityId,
  defaultValues,
}: {
  user: User;
  activityId: number;
  defaultValues?: YideWorkActivityRegisterFormData;
}) {
  const router = useRouter();

  const { register, handleSubmit, control } =
    useForm<YideWorkActivityRegisterFormData>({
      mode: "all",
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
  } = api.yideworkActivity.registerActivity.useMutation({
    onSuccess: () => router.reload(),
  });

  return (
    <form className="flex flex-col space-y-4">
      <div>
        <label className="label">
          <span className="label-text">姓名：{user.name}</span>
        </label>
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
                required
                type="text"
                className="tiani-input-inline"
                {...register(`externalRegisters.${index}.username`)}
              />
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
          append({ username: "" });
        }}
      >
        新增夥伴
      </button>
      <ReactiveButton
        className="btn btn-primary"
        loading={registerActivityIsPending}
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
