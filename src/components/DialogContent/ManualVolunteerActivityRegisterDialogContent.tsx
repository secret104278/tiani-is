import { useClose } from "@headlessui/react";
import { isNil } from "lodash";
import { useState } from "react";
import { api } from "~/utils/api";
import { invalidateActivityRegistrations } from "~/lib/query/invalidation";
import UserCombobox, { type UserComboboxSelected } from "../UserCombobox";
import ReactiveButton from "../utils/ReactiveButton";

export default function ManualVolunteerActivityRegisterDialogContent({
  activityId,
}: {
  activityId: number;
}) {
  const close = useClose();
  const utils = api.useUtils();
  const [selected, setSelected] = useState<UserComboboxSelected>(null);

  const {
    mutate: participateActivity,
    isPending: participateActivityIsPending,
    error: participateActivityError,
  } = api.volunteerActivity.participateActivity.useMutation({
    onSuccess: async () => {
      await invalidateActivityRegistrations(utils, "volunteer", activityId);
      close();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected) {
      participateActivity({ activityId, userId: selected.id });
    }
  };

  return (
    <form className="flex flex-col space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="label">
          <span className="label-text">志工</span>
        </label>
        <div>
          <UserCombobox selected={selected} setSelected={setSelected} />
        </div>
      </div>
      <ReactiveButton
        type="submit"
        className="btn btn-primary"
        disabled={isNil(selected)}
        loading={participateActivityIsPending}
        error={participateActivityError?.message}
      >
        送出
      </ReactiveButton>
    </form>
  );
}
