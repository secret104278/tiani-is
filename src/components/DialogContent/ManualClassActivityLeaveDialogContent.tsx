import { isNil } from "lodash";
import { useRouter } from "next/router";
import { useState } from "react";
import { api } from "~/utils/api";
import UserCombobox, { type UserComboboxSelected } from "../UserCombobox";
import ReactiveButton from "../utils/ReactiveButton";

export default function ManualClassActivityLeaveDialogContent({
  activityId,
}: {
  activityId: number;
}) {
  const router = useRouter();

  const {
    mutate: manualTakeLeave,
    isLoading: manualTakeLeaveIsLoading,
    error: manualTakeLeaveError,
  } = api.classActivity.takeLeave.useMutation({
    onSuccess: () => router.reload(),
  });

  const [selected, setSelected] = useState<UserComboboxSelected | undefined>();

  return (
    <form className="flex flex-col space-y-4">
      <div>
        <label className="label">
          <span className="label-text">班員</span>
        </label>
        <div>
          <UserCombobox selected={selected} setSelected={setSelected} />
        </div>
      </div>
      <ReactiveButton
        className="btn btn-primary"
        disabled={isNil(selected)}
        loading={manualTakeLeaveIsLoading}
        error={manualTakeLeaveError?.message}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick={() =>
          selected && manualTakeLeave({ activityId, userId: selected.id })
        }
      >
        送出
      </ReactiveButton>
    </form>
  );
}
