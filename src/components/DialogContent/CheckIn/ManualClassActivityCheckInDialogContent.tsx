import { useClose } from "@headlessui/react";
import { isNil } from "lodash";
import { useState } from "react";
import { invalidateActivityRegistrations } from "~/lib/query/invalidation";
import { api } from "~/utils/api";
import UserCombobox, { type UserComboboxSelected } from "../../UserCombobox";
import ReactiveButton from "../../utils/ReactiveButton";

export default function ManualClassActivityCheckInDialogContent({
  activityId,
}: {
  activityId: number;
}) {
  const close = useClose();
  const utils = api.useUtils();
  const [selected, setSelected] = useState<UserComboboxSelected>(null);

  const {
    mutate: checkInActivity,
    isPending: checkInActivityIsPending,
    error: checkInActivityError,
  } = api.classActivity.checkInActivity.useMutation({
    onSuccess: async () => {
      await invalidateActivityRegistrations(utils, "class", activityId);
      close();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected) {
      checkInActivity({ activityId, userId: selected.id });
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
        loading={checkInActivityIsPending}
        error={checkInActivityError?.message}
      >
        送出
      </ReactiveButton>
    </form>
  );
}
