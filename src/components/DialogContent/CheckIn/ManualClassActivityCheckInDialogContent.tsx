import { isNil } from "lodash";
import { useRouter } from "next/router";
import { useState } from "react";
import { api } from "~/utils/api";
import UserCombobox, { type UserComboboxSelected } from "../../UserCombobox";
import ReactiveButton from "../../utils/ReactiveButton";

export default function ManualClassActivityCheckInDialogContent({
  activityId,
}: {
  activityId: number;
}) {
  const router = useRouter();

  const {
    mutate: checkInActivity,
    isLoading: checkInActivityIsLoading,
    error: checkInActivityError,
  } = api.classActivity.checkInActivity.useMutation({
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
        loading={checkInActivityIsLoading}
        error={checkInActivityError?.message}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick={() =>
          selected && checkInActivity({ activityId, userId: selected.id })
        }
      >
        送出
      </ReactiveButton>
    </form>
  );
}
