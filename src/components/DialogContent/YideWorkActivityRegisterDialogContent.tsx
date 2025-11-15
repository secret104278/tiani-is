import { useClose } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import ReactiveButton from "../utils/ReactiveButton";

import type { User } from "next-auth";
import { api } from "~/utils/api";
import { invalidateActivityRegistrations } from "~/lib/query/invalidation";
import {
  yideWorkRegistrationFormSchema,
  type YideWorkRegistrationFormData,
} from "~/lib/schemas";

export default function YideWorkActivityRegisterDialogContent({
  user,
  activityId,
  defaultValues,
}: {
  user: User;
  activityId: number;
  defaultValues?: YideWorkRegistrationFormData;
}) {
  const close = useClose();
  const utils = api.useUtils();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<YideWorkRegistrationFormData>({
    resolver: zodResolver(yideWorkRegistrationFormSchema),
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
  } = api.yideworkActivity.registerActivity.useMutation({
    onSuccess: async () => {
      await invalidateActivityRegistrations(utils, "yidework", activityId);
      close();
    },
  });

  const onSubmit = (data: YideWorkRegistrationFormData) => {
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
        onClick={() => append({ username: "" })}
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
