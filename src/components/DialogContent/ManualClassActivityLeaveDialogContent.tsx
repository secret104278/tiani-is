import { useClose } from "@headlessui/react";
import { isNil } from "lodash";
import { useState } from "react";
import { invalidateActivityRegistrations } from "~/lib/query/invalidation";
import { api } from "~/utils/api";
import UserCombobox, { type UserComboboxSelected } from "../UserCombobox";
import ReactiveButton from "../utils/ReactiveButton";

export default function ManualClassActivityLeaveDialogContent({
  activityId,
}: {
  activityId: number;
}) {
  const close = useClose();
  const utils = api.useUtils();
  const [selected, setSelected] = useState<UserComboboxSelected>(null);

  const {
    mutate: manualTakeLeave,
    isPending: manualTakeLeaveIsPending,
    error: manualTakeLeaveError,
  } = api.classActivity.takeLeave.useMutation({
    onSuccess: async () => {
      await invalidateActivityRegistrations(utils, "class", activityId);
      close();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected) {
      manualTakeLeave({ activityId, userId: selected.id });
    }
  };

  return (
    <form className="flex flex-col space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="label">
          <span className="label-text">班員</span>
        </label>
        <div>
          <UserCombobox selected={selected} setSelected={setSelected} />
        </div>
      </div>
      <ReactiveButton
        type="submit"
        className="btn btn-primary"
        disabled={isNil(selected)}
        loading={manualTakeLeaveIsPending}
        error={manualTakeLeaveError?.message}
      >
        送出
      </ReactiveButton>
    </form>
  );
}
