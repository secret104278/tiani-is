import { useClose } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { invalidateActivityRegistrations } from "~/lib/query/invalidation";
import {
  type ManualEtogetherCheckInFormData,
  manualEtogetherCheckInFormSchema,
} from "~/lib/schemas";
import { api } from "~/utils/api";
import { truncateTitle } from "~/utils/ui";
import ReactiveButton from "../../utils/ReactiveButton";

export default function ManualEtogetherCheckInDialogContent({
  activityId,
  subgroups,
}: {
  activityId: number;
  subgroups: {
    id: number;
    title: string;
  }[];
}) {
  const close = useClose();
  const utils = api.useUtils();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ManualEtogetherCheckInFormData>({
    resolver: zodResolver(manualEtogetherCheckInFormSchema),
    mode: "onBlur",
  });

  const {
    mutate: manualRegister,
    isPending,
    error,
  } = api.etogetherActivity.manualExternalRegister.useMutation({
    onSuccess: async () => {
      await invalidateActivityRegistrations(utils, "etogether", activityId);
      close();
    },
  });

  const onSubmit = (data: ManualEtogetherCheckInFormData) => {
    manualRegister({ activityId, checked: true, ...data });
  };

  return (
    <form className="flex flex-col space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="label">
          <span className="label-text">姓名</span>
        </label>
        <input type="text" className="tiani-input" {...register("username")} />
        {errors.username && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.username.message}
            </span>
          </label>
        )}
      </div>
      <div>
        <label className="label">
          <span className="label-text">分組</span>
        </label>
        <select
          className="select select-bordered"
          {...register("subgroupId", {
            valueAsNumber: true,
          })}
        >
          {subgroups.map((subgroup) => (
            <option key={subgroup.id} value={subgroup.id}>
              {truncateTitle(subgroup.title)}
            </option>
          ))}
        </select>
        {errors.subgroupId && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.subgroupId.message}
            </span>
          </label>
        )}
      </div>
      <ReactiveButton
        type="submit"
        className="btn btn-primary"
        loading={isPending}
        error={error?.message}
      >
        送出
      </ReactiveButton>
    </form>
  );
}
