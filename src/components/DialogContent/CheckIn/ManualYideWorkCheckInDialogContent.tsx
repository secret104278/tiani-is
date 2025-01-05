import { type inferRouterInputs } from "@trpc/server";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { type YideWorkRouter } from "~/server/api/routers/yidework";
import { api } from "~/utils/api";
import ReactiveButton from "../../utils/ReactiveButton";

type ManualYideWorkCheckInFormData = Omit<
  inferRouterInputs<YideWorkRouter>["manualExternalRegister"],
  "activityId" | "checked"
>;

export default function ManualYideWorkCheckInDialogContent({
  activityId,
}: {
  activityId: number;
}) {
  const router = useRouter();

  const { register, handleSubmit } = useForm<ManualYideWorkCheckInFormData>({
    mode: "all",
  });

  const {
    mutate: manualExternalRegister,
    isPending: manualExternalRegisterIsPending,
    error: manualExternalRegisterError,
  } = api.yideworkActivity.manualExternalRegister.useMutation({
    onSuccess: () => router.reload(),
  });

  return (
    <form className="flex flex-col space-y-4">
      <div>
        <label className="label">
          <span className="label-text">姓名</span>
        </label>
        <input
          required
          type="text"
          className="tiani-input"
          {...register(`username`)}
        />
      </div>
      <ReactiveButton
        className="btn btn-primary"
        loading={manualExternalRegisterIsPending}
        error={manualExternalRegisterError?.message}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick={handleSubmit((data) =>
          manualExternalRegister({ activityId, checked: true, ...data }),
        )}
      >
        送出
      </ReactiveButton>
    </form>
  );
}
