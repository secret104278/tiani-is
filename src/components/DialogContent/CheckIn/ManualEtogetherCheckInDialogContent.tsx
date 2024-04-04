import { type inferRouterInputs } from "@trpc/server";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { type EtogetherRouter } from "~/server/api/routers/etogether";
import { api } from "~/utils/api";
import ReactiveButton from "../../utils/ReactiveButton";

type ManualEtogetherCheckInFormData = Omit<
  inferRouterInputs<EtogetherRouter>["manualExternalRegister"],
  "activityId" | "checked"
>;

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
  const router = useRouter();

  const { register, handleSubmit } = useForm<ManualEtogetherCheckInFormData>({
    mode: "all",
  });

  const {
    mutate: manualExternalRegister,
    isLoading: manualExternalRegisterIsLoading,
    error: manualExternalRegisterError,
  } = api.etogetherActivity.manualExternalRegister.useMutation({
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
      <div>
        <label className="label">
          <span className="label-text">分組</span>
        </label>
        <select
          className="select select-bordered"
          required
          {...register(`subgroupId`, {
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
      <ReactiveButton
        className="btn btn-primary"
        loading={manualExternalRegisterIsLoading}
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
