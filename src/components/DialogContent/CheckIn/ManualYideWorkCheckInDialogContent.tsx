import { useClose } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  manualCheckInFormSchema,
  type ManualCheckInFormData,
} from "~/lib/schemas";
import { api } from "~/utils/api";
import { invalidateActivityRegistrations } from "~/lib/query/invalidation";
import ReactiveButton from "../../utils/ReactiveButton";

export default function ManualYideWorkCheckInDialogContent({
  activityId,
}: {
  activityId: number;
}) {
  const close = useClose();
  const utils = api.useUtils();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ManualCheckInFormData>({
    resolver: zodResolver(manualCheckInFormSchema),
    mode: "onBlur",
  });

  const {
    mutate: manualRegister,
    isPending,
    error,
  } = api.yideworkActivity.manualExternalRegister.useMutation({
    onSuccess: async () => {
      await invalidateActivityRegistrations(utils, "yidework", activityId);
      close();
    },
  });

  const onSubmit = (data: ManualCheckInFormData) => {
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
