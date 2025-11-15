import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  manualCheckInFormSchema,
  type ManualCheckInFormData,
} from "~/lib/schemas";
import { useCheckInMutations } from "~/hooks";
import ReactiveButton from "../../utils/ReactiveButton";

export default function ManualYideWorkCheckInDialogContent({
  activityId,
}: {
  activityId: number;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ManualCheckInFormData>({
    resolver: zodResolver(manualCheckInFormSchema),
    mode: "onBlur",
  });

  const { manualRegister, isPending, error } = useCheckInMutations(
    "yidework",
    activityId,
  );

  const onSubmit = (data: ManualCheckInFormData) => {
    manualRegister?.({ activityId, checked: true, ...data });
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
